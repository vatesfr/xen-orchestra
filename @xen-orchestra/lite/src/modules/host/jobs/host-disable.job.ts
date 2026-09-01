import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { isHostOperationPending } from '@/modules/host/utils/host.util.ts'
import { useHostMetricsStore } from '@/stores/xen-api/host-metrics.store.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostDisableJob = defineJob('host.disable', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()
  const { isHostRunning } = useHostMetricsStore().subscribe()

  return {
    run: (host: XenApiHost) => xapi.host.disable(host.$ref),

    validate: (isRunning, host: XenApiHost | undefined) => {
      if (host === undefined) {
        throw new JobError(t('job:host-disable:missing-host'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:disable:in-progress'))
      }

      if (isHostOperationPending(host, HOST_OPERATION.EVACUATE)) {
        throw new JobRunningError(t('job:host-evacuate:in-progress'))
      }

      if (!isHostRunning(host)) {
        throw new JobError(t('job:host-disable:bad-power-state'))
      }
    },
  }
})
