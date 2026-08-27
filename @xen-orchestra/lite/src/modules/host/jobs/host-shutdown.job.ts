import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { isHostOperationPending } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostShutdownJob = defineJob('host.shutdown', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { isHostRunning } = useHostMetricsStore().subscribe()

  return {
    run: host => xapi.host.cleanShutdown(host.$ref),

    validate: (isRunning, host) => {
      if (host === undefined) {
        throw new JobError(t('job:host-shutdown:missing-host'))
      }

      if (!isHostRunning(host)) {
        throw new JobError(t('job:host-shutdown:bad-power-state'))
      }

      if (isRunning || isHostOperationPending(host, HOST_OPERATION.SHUTDOWN)) {
        throw new JobRunningError(t('job:host-shutdown:in-progress'))
      }
    },
  }
})
