import forEach from 'lodash/forEach.js'
import isEmpty from 'lodash/isEmpty.js'
import iteratee from 'lodash/iteratee.js'
import ms from 'ms'
import sortedIndexBy from 'lodash/sortedIndexBy.js'

import { debounceWithKey } from '../_pDebounceWithKey.mjs'

const isSkippedError = error =>
  error != null &&
  (error.message === 'no disks found' ||
    error.message === 'no VMs match this pattern' ||
    error.message === 'unhealthy VDI chain')

const getStatus = (error, status = error === undefined ? 'success' : 'failure') =>
  status === 'failure' && isSkippedError(error) ? 'skipped' : status

const computeStatusAndSortTasks = (status, tasks) => {
  if (status === 'failure' || tasks === undefined) {
    return status
  }

  for (let i = 0, n = tasks.length; i < n; ++i) {
    const taskStatus = tasks[i].status
    if (taskStatus === 'failure') {
      return taskStatus
    }
    if (taskStatus === 'skipped') {
      status = taskStatus
    }
  }

  tasks.sort(taskTimeComparator)

  return status
}

const taskTimeComparator = ({ start: s1, end: e1 }, { start: s2, end: e2 }) => {
  if (e1 !== undefined) {
    if (e2 !== undefined) {
      // finished tasks are ordered by their end times
      return e1 - e2
    }
    // finished task before unfinished tasks
    return -1
  } else if (e2 === undefined) {
    // unfinished tasks are ordered by their start times
    return s1 - s2
  }
  // unfinished task after finished tasks
  return 1
}

// type Task = {
//   data: any,
//   end?: number,
//   id: string,
//   jobId?: string,
//   jobName?: string,
//   message?:  'backup' | 'metadataRestore' | 'restore',
//   proxyId?: string,
//   scheduleId?: string,
//   start: number,
//   status: 'pending' | 'failure' | 'interrupted' | 'skipped' | 'success',
//   tasks?: Task[],
// }
export default {
  getBackupNgLogs: debounceWithKey(
    async function getBackupNgLogs(runId) {
      const [jobLogs, restoreLogs, restoreMetadataLogs] = await Promise.all([
        this.getLogs('jobs'),
        this.getLogs('restore'),
        this.getLogs('metadataRestore'),
      ])

      const { runningJobs, runningRestores, runningMetadataRestores } = this
      const consolidated = {}
      const started = {}

      const handleLog = ({ data, time, message }, id) => {
        const { event } = data
        if (event === 'job.start') {
          if ((data.type === 'backup' || data.key === undefined) && (runId === undefined || runId === id)) {
            const { scheduleId, jobId } = data
            consolidated[id] = started[id] = {
              data: data.data,
              id,
              jobId,
              jobName: data.jobName,
              message: 'backup',
              proxyId: data.proxyId,
              scheduleId,
              start: time,
              status: runningJobs[jobId] === id ? 'pending' : 'interrupted',
            }
          }
        } else if (event === 'job.end') {
          const { runJobId } = data
          const log = started[runJobId]
          if (log !== undefined) {
            delete started[runJobId]
            log.end = time
            log.status = computeStatusAndSortTasks(getStatus((log.result = data.error)), log.tasks)
          }
        } else if (event === 'task.start') {
          const task = {
            data: data.data,
            id,
            message,
            start: time,
          }
          const { parentId } = data
          let parent
          if (parentId === undefined && (runId === undefined || runId === id)) {
            // top level task
            task.status =
              (message === 'restore' && !runningRestores.has(id)) ||
              (message === 'metadataRestore' && !runningMetadataRestores.has(id))
                ? 'interrupted'
                : 'pending'
            consolidated[id] = started[id] = task
          } else if ((parent = started[parentId]) !== undefined) {
            // sub-task for which the parent exists
            task.status = parent.status
            started[id] = task
            ;(parent.tasks || (parent.tasks = [])).push(task)
          }
        } else if (event === 'task.end') {
          const { taskId } = data
          const log = started[taskId]
          if (log !== undefined) {
            // TODO: merge/transfer work-around
            delete started[taskId]
            log.end = time
            log.status = computeStatusAndSortTasks(getStatus((log.result = data.result), data.status), log.tasks)
          }
        } else if (event === 'task.warning') {
          const parent = started[data.taskId]
          parent !== undefined &&
            (parent.warnings || (parent.warnings = [])).push({
              data: data.data,
              message,
            })
        } else if (event === 'task.info') {
          const parent = started[data.taskId]
          parent !== undefined &&
            (parent.infos || (parent.infos = [])).push({
              data: data.data,
              message,
            })
        } else if (event === 'jobCall.start') {
          const parent = started[data.runJobId]
          if (parent !== undefined) {
            ;(parent.tasks || (parent.tasks = [])).push(
              (started[id] = {
                data: {
                  type: 'VM',
                  id: data.params.id,
                },
                id,
                start: time,
                status: parent.status,
              })
            )
          }
        } else if (event === 'jobCall.end') {
          const { runCallId } = data
          const log = started[runCallId]
          if (log !== undefined) {
            delete started[runCallId]
            log.end = time
            log.status = computeStatusAndSortTasks(getStatus((log.result = data.error)), log.tasks)
          }
        }
      }

      forEach(jobLogs, handleLog)
      forEach(restoreLogs, handleLog)
      forEach(restoreMetadataLogs, handleLog)

      return runId === undefined ? consolidated : consolidated[runId]
    },
    10e3,
    function keyFn(runId) {
      return [this, runId]
    }
  ),

  async getBackupNgLogsSorted({ after, before, filter, limit }) {
    let logs = await this.getBackupNgLogs()

    // convert to array
    logs = Object.values(logs)

    if (typeof filter === 'function' || !isEmpty(filter)) {
      logs = logs.filter(iteratee(filter))
    }

    logs.sort((a, b) => a.start - b.start)

    // only extract the range we are interested in
    const i =
      after === undefined
        ? 0
        : sortedIndexBy(
            logs,
            {
              start: typeof after === 'number' ? after : Date.now() - ms(after),
            },
            'start'
          )
    let j =
      before === undefined
        ? logs.length
        : sortedIndexBy(
            logs,
            {
              start: typeof before === 'number' ? before : Date.now() - ms(before),
            },
            'start'
          )

    limit += i
    if (limit < j) {
      j = limit
    }
    logs = logs.slice(i, j)

    return logs
  },
}
