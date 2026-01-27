import { xoServerIdsArg } from '@/modules/server/jobs/xo-server-args.job.ts'
import { fetchDelete } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'

export const useXoServerRemoveJob = defineJob('server.remove', [xoServerIdsArg], () => {
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
