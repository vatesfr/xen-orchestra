import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { isPoolOperationPending } from '@/modules/pool/utils/pool.util.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { POOL_ALLOWED_OPERATIONS } from '@vates/types'
import { useI18n } from 'vue-i18n'

export const useHostDetachJob = defineJob('host.detach', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { pool, isMasterHost } = usePoolStore().subscribe()

  return {
    run: host => xapi.pool.eject(host.$ref),

    validate: (isRunning, host) => {
      if (host === undefined) {
        throw new JobError(t('job:host-detach:missing-host'))
      }

      if (isRunning || (pool.value && isPoolOperationPending(pool.value, POOL_ALLOWED_OPERATIONS.EJECT))) {
        throw new JobRunningError(t('job:host-detach:in-progress'))
      }

      if (isMasterHost(host.$ref)) {
        throw new JobError(t('job:host-detach:master-host'))
      }
    },
  }
})
