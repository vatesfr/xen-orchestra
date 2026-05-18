import { xoSrArg } from '@/modules/storage-repository/jobs/xo-sr-args.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoSrDisconnectJob = defineJob('sr.disconnect', [xoSrArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(srs: FrontXoSr[]) {
      // TODO Replace with PBD unplug (one if disconnecting from host, all if disconnecting from pool)
      const results = await Promise.allSettled(
        srs.map(async sr => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`srs/${sr.id}/actions/unplug`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to disconnect SR ${srs[index]?.id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, srs: FrontXoSr[] | undefined) => {
      if (!srs || srs.length === 0) {
        throw new JobError(t('job:sr-disconnect:missing-sr'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:disconnect:in-progress'))
      }
    },
  }
})
