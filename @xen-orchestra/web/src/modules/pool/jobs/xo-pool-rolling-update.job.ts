import { validateRollingUpdateJob, xoPoolArg } from '@/modules/pool/jobs/xo-pool-args.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { RollingUpdateStartOptions } from '@/modules/pool/utils/rolling-update.util.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import { defineJob, defineJobArg } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

const startOptionsArg = defineJobArg<RollingUpdateStartOptions | undefined>({ identify: false, toArray: false })

export const useXoPoolRollingUpdateJob = defineJob('pool.rolling-update', [xoPoolArg, startOptionsArg], () => {
  const { t } = useI18n()

  return {
    // The task is not awaited: a rolling update lasts, and it is followed from the recovery record of the pool
    async run(pool: FrontXoPool, options: RollingUpdateStartOptions | undefined) {
      await fetchPost(`pools/${pool.id}/actions/rolling_update`, options)
    },

    validate: (isRunning, pool: FrontXoPool | undefined) =>
      validateRollingUpdateJob(isRunning, pool, {
        missingPool: t('job:pool-rolling-update:missing-pool'),
        inProgress: t('job:pool-rolling-update:in-progress'),
      }),
  }
})
