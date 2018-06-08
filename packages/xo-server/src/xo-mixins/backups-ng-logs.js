import { forEach } from 'lodash'

const isSkippedError = error =>
  error.message === 'no disks found' ||
  error.message === 'no such object' ||
  error.message === 'no VMs match this pattern' ||
  error.message === 'unhealthy VDI chain'

const getStatus = (
  error,
  status = error === undefined ? 'success' : 'failure'
) => (status === 'failure' && isSkippedError(error) ? 'skipped' : status)

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

export default {
  async getBackupNgLogs (runId?: string) {
    const { runningJobs } = this
    const consolidated = {}
    const started = {}
    forEach(await this.getLogs('jobs'), ({ data, time, message }, id) => {
      const { event } = data
      if (event === 'job.start') {
        if (
          (data.type === 'backup' || data.key === undefined) &&
          (runId === undefined || runId === id)
        ) {
          const { scheduleId, jobId } = data
          consolidated[id] = started[id] = {
            data: data.data,
            id,
            jobId,
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
          log.status = computeStatusAndSortTasks(
            getStatus((log.result = data.error)),
            log.tasks
          )
        }
      } else if (event === 'task.start') {
        const parent = started[data.parentId]
        if (parent !== undefined) {
          ;(parent.tasks || (parent.tasks = [])).push(
            (started[id] = {
              data: data.data,
              id,
              message,
              start: time,
              status: parent.status,
            })
          )
        }
      } else if (event === 'task.end') {
        const { taskId } = data
        const log = started[taskId]
        if (log !== undefined) {
          // TODO: merge/transfer work-around
          delete started[taskId]
          log.end = time
          log.status = computeStatusAndSortTasks(
            getStatus((log.result = data.result), data.status),
            log.tasks
          )
        }
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
          log.status = computeStatusAndSortTasks(
            getStatus((log.result = data.error)),
            log.tasks
          )
        }
      }
    })
    return runId === undefined ? consolidated : consolidated[runId]
  },
}
