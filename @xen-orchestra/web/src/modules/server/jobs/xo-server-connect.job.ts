import { xoServerIdsArg } from '@/modules/server/jobs/xo-server-args.job.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'

export const useXoServerConnectJob = defineJob('server.connect', [xoServerIdsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  return {
    run(serverIds) {
      return Promise.allSettled(
        serverIds.map(async serverId => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`servers/${serverId.value}/actions/connect`)
          await monitorTask(taskId)
        })
      )
    },
    validate(isRunning, serverIds) {
      if (isRunning) {
        throw new JobRunningError('connect server already running')
      }
      if (serverIds.length === 0 || serverIds.some(id => id.value === '')) {
        throw new JobError('server ids are required')
      }
    },
  }
})
