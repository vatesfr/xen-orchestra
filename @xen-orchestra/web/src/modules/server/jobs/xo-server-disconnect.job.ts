import { xoServerIdsArg } from '@/modules/server/jobs/xo-server-args.job.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'

export const useXoServerDisconnectJob = defineJob('server.disconnect', [xoServerIdsArg], () => {
  const { monitorTask } = useXoTaskUtils()
  const { getServersByIds } = useXoServerCollection()

  return {
    async run(serverIds) {
      const results = await Promise.allSettled(
        serverIds.map(async serverId => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`servers/${serverId.value}/actions/disconnect`)
          await monitorTask(taskId)
        })
      )
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to disconnect server ${serverIds[index].value}:`, result.reason)
        }
      })
      return results
    },
    validate(isRunning, serverIds) {
      if (isRunning) {
        throw new JobRunningError('server disconnection already in progress')
      }
      if (serverIds.length === 0 || serverIds.some(id => id.value === '')) {
        throw new JobError('server ids are required')
      }
      const servers = getServersByIds(serverIds.map(id => id.value))
      if (servers.some(server => server.status !== 'connected')) {
        throw new JobError('server must be connected')
      }
    },
  }
})
