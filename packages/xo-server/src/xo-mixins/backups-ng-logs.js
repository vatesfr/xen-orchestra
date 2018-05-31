import { forEach, groupBy, isEmpty } from 'lodash'

import { type CallJob } from './jobs'
import { type BackupJob, Mode, ReportWhen } from './backups-ng'

type TaskStatus = 'failure' | 'interrupted' | 'pending' | 'skipped' | 'success'

type ConsolidatedOperationTask = {|
  parentId: string,
  id: string,
  start: string,
  message: 'transger' | 'merge',
  status: TaskStatus,
  result?:
    | {|
        size: number,
      |}
    | Object,
  end?: number,
|}

type ConsolidatedSubTask = {
  data?: {
    type: 'SR' | 'remote',
    id: string,
  },
  message: 'snapshot' | 'export',
  id: string,
  parentId: string,
  start: number,
  status: TaskStatus,
  result?: string | Object,
  end?: number,
  tasks?: Array<ConsolidatedOperationTask>,
}

type ConsolidatedTask = {
  data: {|
    type: 'VM',
    id: string,
  |},
  parentId: string,
  id: string,
  start: number,
  status: TaskStatus,
  message: string,
  end?: number,
  tasks?: Array<ConsolidatedSubTask>,
  transfer?: {|
    duration: number,
    size: number,
  |},
  merge?: {|
    duration: number,
    size: number,
  |},
  result?: Object,
}

type ConsolidatedBackupNgLog = {|
  data?: {|
    reportWhen?: ReportWhen,
    mode?: Mode,
  |},
  end?: number,
  error?: Object,
  id: string,
  jobId: string,
  scheduleId: string,
  start: number,
  status: TaskStatus,
  tasks: Array<ConsolidatedTask>,
|}

const NO_VMS_MATCH_THIS_PATTERN = 'no VMs match this pattern'
const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const NO_SUCH_OBJECT_ERROR = 'no such object'
const NO_DISKS_FOUND = 'no disks found'

const isSkippedError = error =>
  error.message === UNHEALTHY_VDI_CHAIN_ERROR ||
  error.message === NO_SUCH_OBJECT_ERROR ||
  error.message === NO_DISKS_FOUND

export default class BackupNgLogs {
  _app: {
    getLogs: (namespace: string) => Promise<{ [id: string]: Object }>,
    getJob: ((id: string, 'backup') => Promise<BackupJob>) &
      ((id: string, 'call') => Promise<CallJob>),
  }

  constructor (app: any) {
    this._app = app
  }

  async getBackupNgLogs (
    runId?: string
  ): Promise<$Dict<ConsolidatedBackupNgLog>> {
    const rawLogs = await this._app.getLogs('jobs')
    let groupedLogs = {}
    for (const id in rawLogs) {
      const { data, time, message } = rawLogs[id]

      switch (data.event) {
        case 'job.start':
          if (data.type === 'backup' || data.key === undefined) {
            groupedLogs[id] = {
              id,
              jobId: data.jobId,
              scheduleId: data.scheduleId,
              data: data.data,
              start: time,
            }
          }
          break
        case 'job.end':
          const jobLog = groupedLogs[data.runJobId]
          if (jobLog !== undefined) {
            jobLog.end = time
            jobLog.error = data.error
          }
          break
        case 'task.start':
          const parentLog = groupedLogs[data.parentId]
          if (parentLog !== undefined) {
            groupedLogs[id] = {
              parentId: data.parentId,
              data: data.data,
              id,
              start: time,
              message,
            }
          }
          break
        case 'task.end':
          const task = groupedLogs[data.taskId]
          if (task !== undefined) {
            // work-around
            if (
              time === task.start &&
              (message === 'merge' || message === 'transfer')
            ) {
              delete groupedLogs[data.taskId]
            } else {
              task.status = data.status
              task.result = data.result
              task.end = time
            }
          }
          break
        case 'jobCall.start':
          if (groupedLogs[data.runJobId] !== undefined) {
            groupedLogs[id] = {
              parentId: data.runJobId,
              data: {
                type: 'VM',
                id: data.params.id,
              },
              id,
              start: time,
            }
          }
          break
        case 'jobCall.end':
          const call = groupedLogs[data.runCallId]
          if (call !== undefined) {
            call.status = data.error === undefined ? 'success' : 'failure'
            call.result = data.error
            const returnedValue = data.returnedValue
            if (returnedValue !== undefined) {
              if (returnedValue.transferDuration > 0) {
                call.transfer = {
                  duration: returnedValue.transferDuration,
                  size: returnedValue.transferSize,
                }
              }
              if (returnedValue.mergeDuration > 0) {
                call.merge = {
                  duration: returnedValue.mergeDuration,
                  size: returnedValue.mergeSize,
                }
              }
            }
            call.end = time
          }
      }
    }

    if (isEmpty(groupedLogs)) {
      return {}
    }

    groupedLogs = groupBy(groupedLogs, log => log.parentId || 'roots')
    const consolidatedLogs: $Dict<ConsolidatedBackupNgLog> = {}
    for (const jobLog of groupedLogs['roots']) {
      const jobLogId = jobLog.id
      consolidatedLogs[jobLogId] = jobLog
      let job
      try {
        job = await this._app.getJob(jobLog.jobId, 'backup')
      } catch (e) {}
      const taskWithNoEndStatus =
        job?.runId === jobLog.id ? 'pending' : 'interrupted'

      if (jobLog.error !== undefined) {
        jobLog.status =
          jobLog.error.message === NO_VMS_MATCH_THIS_PATTERN
            ? 'skipped'
            : 'failure'
        continue
      }

      let jobFailed = false
      let hasTaskSkipped = false
      jobLog.tasks = []
      forEach(groupedLogs[jobLogId], taskLog => {
        const taskLogId = taskLog.id
        jobLog.tasks.push(taskLog)

        if (taskLog.result !== undefined) {
          if (isSkippedError(taskLog.result)) {
            taskLog.status = 'skipped'
            hasTaskSkipped = true
          } else {
            taskLog.status = 'failure'
            jobFailed = true
          }
          return
        }

        let taskFailed = false
        taskLog.tasks = []
        forEach(groupedLogs[taskLogId], subTaskLog => {
          const subTaskLogId = subTaskLog.id
          taskLog.tasks.push(subTaskLog)

          if (subTaskLog.end === undefined) {
            subTaskLog.status = taskWithNoEndStatus
          }

          if (subTaskLog.status === 'failure') {
            jobFailed = true
            taskFailed = true
            return
          }

          if (subTaskLog.message !== 'snapshot') {
            subTaskLog.tasks = []
            forEach(groupedLogs[subTaskLogId], operationLog => {
              subTaskLog.tasks.push(operationLog)
              if (operationLog.end === undefined) {
                operationLog.status = taskWithNoEndStatus
              }
            })
          }
        })

        if (taskLog.end === undefined) {
          taskLog.status = taskWithNoEndStatus
        } else {
          taskLog.status = taskFailed ? 'failure' : 'success'
        }
      })
      if (jobLog.end === undefined) {
        jobLog.status = taskWithNoEndStatus
      } else {
        jobLog.status = jobFailed
          ? 'failure'
          : hasTaskSkipped
            ? 'skipped'
            : 'success'
      }
    }

    return runId !== undefined ? consolidatedLogs[runId] : consolidatedLogs
  }
}
