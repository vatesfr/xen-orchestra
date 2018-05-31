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

const computeStatus = (status, tasks) => {
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

  return status
}

export default {
  async getBackupNgLogs (runId?: string) {
    const { runningJobs } = this
    const consolidated = {}
    forEach(await this.getLogs('jobs'), ({ data, time, message }, id) => {
      const { event } = data
      if (event === 'job.start') {
        if (
          (data.type === 'backup' || data.key === undefined) &&
          (runId === undefined || runId === id)
        ) {
          const { jobId } = data
          consolidated[id] = {
            data: data.data,
            id,
            jobId,
            start: time,
            status: runningJobs[jobId] === id ? 'pending' : 'interrupted',
          }
        }
      } else if (event === 'job.end') {
        const log = consolidated[data.runJobId]
        if (log !== undefined) {
          log.end = time
          log.status = computeStatus(
            getStatus((log.result = data.error)),
            log.tasks
          )
        }
      } else if (event === 'task.start') {
        const parent = consolidated[data.parentId]
        if (parent !== undefined) {
          ;(parent.tasks || (parent.tasks = [])).push(
            (consolidated[id] = {
              data: data.data,
              id,
              message,
              start: time,
              status: 'pending',
            })
          )
        }
      } else if (event === 'task.end') {
        const log = consolidated[data.taskId]
        if (log !== undefined) {
          // TODO: merge/transfer work-around
          delete consolidated[data.taskId]
          log.end = time
          log.status = computeStatus(
            getStatus((log.result = data.result), data.status),
            log.tasks
          )
        }
      } else if (event === 'jobCall.start') {
        const parent = consolidated[data.runJobId]
        if (parent !== undefined) {
          ;(parent.tasks || (parent.tasks = [])).push(
            (consolidated[id] = {
              data: {
                type: 'VM',
                id: data.params.id,
              },
              id,
              start: time,
              status: 'pending',
            })
          )
        }
      } else if (event === 'jobCall.end') {
        const log = consolidated[data.runCallId]
        if (log !== undefined) {
          delete consolidated[data.runCallId]
          log.end = time
          log.status = computeStatus(
            getStatus((log.result = data.error)),
            log.tasks
          )
        }
      }
    })
    return consolidated
  },
}
