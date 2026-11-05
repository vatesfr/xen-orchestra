import { xoPbdsArg } from '@/modules/pbd/jobs/xo-pbd-args.ts'
import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useXoPbdPlugJob = defineJob('pbd.plug', [xoPbdsArg], () => {
  const { t } = useI18n()
  const { monitorTask } = useXoTaskUtils()

  return {
    async run(pbds: FrontXoPbd[]) {
      const results = await Promise.allSettled(
        pbds.map(async pbd => {
          const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(`pbds/${pbd.id}/actions/plug`)
          await monitorTask(taskId)
        })
      )

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Failed to plug PBD ${pbds[index]?.id}:`, result.reason)
        }
      })

      return results
    },

    validate: (isRunning, pbds: FrontXoPbd[] | undefined) => {
      if (!pbds || pbds.length === 0) {
        throw new JobError(t('job:pbd-plug:missing-pbd'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:connect:in-progress'))
      }

      if (pbds.some(pbd => pbd.attached)) {
        throw new JobError(t('job:pbd-plug:pbd-connected'))
      }
    },
  }
})
