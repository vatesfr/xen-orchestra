import { xoServerIdsArg } from '@/modules/server/jobs/xo-server-args.job.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoServerConnectJob = defineJob('server.connect', [xoServerIdsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(serverIds) {
      const results = await Promise.allSettled(
        serverIds.map(async serverId => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`servers/${serverId.value}/actions/connect`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to connect server ${serverIds[index].value}:`, result.reason)
        }
      })

      return results
    },
    validate(isRunning, serverIds) {
      if (isRunning) {
        throw new JobRunningError(t('job:connect:in-progress'))
      }
      if (serverIds.length === 0 || serverIds.some(id => id.value === '')) {
        throw new JobError(t('job:server-connect:missing-server'))
      }
    },
  }
})
