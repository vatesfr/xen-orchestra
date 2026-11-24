import { validateRollingUpdateJob, xoPoolArg } from '@/modules/pool/jobs/xo-pool-args.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoTaskUtils } from '@/shared/composables/xo-task-utils.composable.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg, JobError } from '@core/packages/job'
import type { PoolRollingUpdateRecoveryUnrestoredItem, XoTask } from '@vates/types'
import { useI18n } from 'vue-i18n'

const unrestoredItemArg = defineJobArg<PoolRollingUpdateRecoveryUnrestoredItem | undefined>({
  identify: false,
  toArray: false,
})

export const useXoPoolRestoreRollingUpdateItemJob = defineJob(
  'pool.restore-rolling-update-item',
  [xoPoolArg, unrestoredItemArg],
  () => {
    const { t } = useI18n()
    const { monitorTask } = useXoTaskUtils()

    return {
      async run(pool: FrontXoPool, item: PoolRollingUpdateRecoveryUnrestoredItem | undefined) {
        if (item === undefined) {
          throw new JobError(t('job:pool-restore-rolling-update-item:missing-item'))
        }

        const { taskId } = await fetchPost<{ taskId: XoTask['id'] }>(
          `pools/${pool.id}/actions/restore_rolling_update_item`,
          { type: item.type, id: item.id }
        )

        await monitorTask(taskId)
      },

      validate: (isRunning, pool: FrontXoPool | undefined) =>
        validateRollingUpdateJob(isRunning, pool, {
          missingPool: t('job:pool-rolling-update:missing-pool'),
          inProgress: t('job:pool-restore-rolling-update-item:in-progress'),
        }),
    }
  }
)
