import type { XenApiNetwork, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import { newVifPayloadArg } from '@/modules/vif/jobs/new-vif-args.ts'
import { useXenApiStore } from '@/stores/xen-api.store.ts'
import type { IpAddress } from '@core/utils/ip-address.utils.ts'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import type { VIF_LOCKING_MODE } from '@vates/types'
import { useI18n } from 'vue-i18n'

export type BaseVifPayload = {
  MAC?: string
  ipv4_allowed?: IpAddress[]
  ipv6_allowed?: IpAddress[]
  locking_mode?: VIF_LOCKING_MODE
  qos_algorithm_type?: string
  qos_algorithm_params?: Record<string, string>
  other_config: Record<string, string>
}

export type NewVifPayload = BaseVifPayload & {
  vmRef: XenApiVm['$ref']
  network: XenApiNetwork['$ref']
}

export const useXoVifCreateJob = defineJob('vif.create', [newVifPayloadArg], () => {
  const xapi = useXenApiStore().getXapi()
  const { t } = useI18n()

  return {
    run: payload => xapi.vif.create(payload),
    validate: (isRunning, vif) => {
      if (vif.length === 0) {
        throw new JobError(t('job:vm-start:missing-vm'))
      }

      if (isRunning) {
        throw new JobRunningError(t('job:vm-start:in-progress'))
      }
    },
  }
})
