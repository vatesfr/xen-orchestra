import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { isHostOperationPending } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostStartJob = defineJob('host.start', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { isHostRunning, isHostHalted } = useHostMetricsStore().subscribe()

  return {
    run: host => xapi.host.powerOn(host.$ref),

    validate: (isRunning, host) => {
      if (host === undefined) {
        throw new JobError(t('job:host-start:missing-host'))
      }

      if (isHostRunning(host)) {
        throw new JobError(t('job:host-start:bad-power-state'))
      }

      if (!isHostHalted(host)) {
        throw new JobError(t('job:host-start:bad-power-state-not-halted'))
      }

      if (isRunning || isHostOperationPending(host, HOST_OPERATION.POWER_ON)) {
        throw new JobRunningError(t('job:host-start:in-progress'))
      }

      if (host.power_on_mode === '') {
        throw new JobError(t('job:host-start:power-on-disabled'))
      }
    },
  }
})
