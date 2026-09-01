import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostScanPifsJob = defineJob('host.scan-pifs', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { isHostRunning } = useHostMetricsStore().subscribe()
  const { t } = useI18n()

  return {
    run: host => xapi.pif.scan(host.$ref),
    validate: (isRunning, host) => {
      if (!host) {
        throw new JobError(t('job:host-scan-pifs:missing-host'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:host-scan-pifs:in-progress'))
      }

      if (!isHostRunning(host)) {
        throw new JobError(t('job:host-scan-pifs:bad-power-state'))
      }
    },
  }
})
