import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostRestartToolstackJob = defineJob('host.restart-toolstack', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { isHostRunning } = useHostMetricsStore().subscribe()
  const { pool } = usePoolStore().subscribe()

  return {
    run: (host: XenApiHost) => xapi.host.restartAgent(host.$ref),

    validate: (isRunning, host: XenApiHost | undefined) => {
      if (host === undefined) {
        throw new JobError(t('job:host-restart-toolstack:missing-host'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:host-restart-toolstack:in-progress'))
      }

      if (!isHostRunning(host)) {
        throw new JobError(t('job:host-restart-toolstack:bad-power-state'))
      }

      if (pool.value?.ha_enabled) {
        throw new JobError(t('job:host-restart-toolstack:ha-enabled'))
      }
    },
  }
})
