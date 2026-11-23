import { validateRollingUpdateJob, xoPoolArg } from '@/modules/pool/jobs/xo-pool-args.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg } from '@core/packages/job'
import type { XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const forceArg = defineJobArg<boolean>({ identify: false, toArray: false })

export const useXoPoolFinalizeRollingUpdateJob = defineJob(
  'pool.finalize-rolling-update',
  [xoPoolArg, forceArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(pool: FrontXoPool, force: boolean) {
        const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
          `pools/${pool.id}/actions/finalize_rolling_update`,
          { force }
        )

        await monitorTask(taskId)
      },

      validate: (isRunning, pool: FrontXoPool | undefined) =>
        validateRollingUpdateJob(isRunning, pool, {
          missingPool: t('job:pool-rolling-update:missing-pool'),
          inProgress: t('job:pool-finalize-rolling-update:in-progress'),
        }),
    }
  }
)
