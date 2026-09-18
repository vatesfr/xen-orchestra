import { HOST_OPERATION } from '@/libs/xen-api/xen-api.enums.ts'
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { hostArg } from '@/modules/host/jobs/host-args.ts'
import { isHostOperationPending } from '@/modules/host/utils/host.util.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export const useHostEnableJob = defineJob('host.enable', [hostArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: (host: XenApiHost) => xapi.host.enable(host.$ref),

    validate: (isRunning, host: XenApiHost | undefined) => {
      if (host === undefined) {
        throw new JobError(t('job:host-enable:missing-host'))
      }

      if (isRunning || isHostOperationPending(host, HOST_OPERATION.ENABLE)) {
        throw new JobRunningError(t('job:enable:in-progress'))
      }

      if (isHostOperationPending(host, HOST_OPERATION.EVACUATE)) {
        throw new JobRunningError(t('job:host-evacuate:in-progress'))
      }
    },
  }
})
