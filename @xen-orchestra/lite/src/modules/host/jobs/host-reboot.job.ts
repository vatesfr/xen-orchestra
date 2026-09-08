import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { isHostOperationPending } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostRebootJob = defineJob('host.reboot', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { isHostRunning } = useHostMetricsStore().subscribe()

  return {
    run: host => xapi.host.cleanReboot(host.$ref),

    validate: (isRunning, host) => {
      if (host === undefined) {
        throw new JobError(t('job:host-reboot:missing-host'))
      }

      if (isRunning || isHostOperationPending(host, HOST_OPERATION.REBOOT)) {
        throw new JobRunningError(t('job:host-reboot:in-progress'))
      }

      if (isHostOperationPending(host, HOST_OPERATION.EVACUATE)) {
        throw new JobRunningError(t('job:host-reboot:evacuate-in-progress'))
      }

      if (!isHostRunning(host)) {
        throw new JobError(t('job:host-reboot:bad-power-state'))
      }
    },
  }
})
