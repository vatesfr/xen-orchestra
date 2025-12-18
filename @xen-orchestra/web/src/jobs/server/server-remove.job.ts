import { fetchDelete } from '@/utils/fetch.util'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { serverIdsArg } from '../args.job'

export const useJobServerRemove = defineJob('server.remove', [serverIdsArg], () => {
  return {
    run(serverIds) {
      return Promise.allSettled(serverIds.map(async serverId => fetchDelete(`servers/${serverId.value}`)))
    },
    validate(isRunning, serverIds) {
      if (isRunning) {
        throw new JobRunningError('server connect already running')
      }
      if (serverIds.length === 0 || serverIds.some(id => id.value === '')) {
        throw new JobError('server ids are required')
      }
    },
  }
})
