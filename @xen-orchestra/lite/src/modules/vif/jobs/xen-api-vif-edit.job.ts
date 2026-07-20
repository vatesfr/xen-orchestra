import type { RecordRef, XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { XenApiVifsArg } from '@/modules/vif/jobs/xen-api-vif-args'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import { useXenApiStore } from '@/stores/xen-api.store'
import { defineJob, JobError, JobRunningError } from '@core/packages/job'
import { useI18n } from 'vue-i18n'

export type BaseVifPayload = {
  MAC?: string
  ipv4_allowed?: string[]
  ipv6_allowed?: string[]
  qos_algorithm_type?: string
  qos_algorithm_params?: Record<string, string>
  other_config: Record<string, string>
}

export type EditVifPayload = BaseVifPayload & {
  vmRef: XenApiVm['$ref']
  networkRef: XenApiNetwork['$ref']
  actualVifRef: XenApiVif['$ref']
}

const xapi = useXenApiStore().getXapi()

export const useXenApiVifEditJob = defineJob('vif.edit', [XenApiVifsArg], () => {
  const { t } = useI18n()

  return {
    run(payloads): Promise<RecordRef<'vif'>> {
      const { getByOpaqueRef: getVifByRef } = useVifStore().subscribe()
      const { getByOpaqueRef: getVmByRef } = useVmStore().subscribe()
      const { getByOpaqueRef: getNetworkByRef } = useNetworkStore().subscribe()

      const actualVif = getVifByRef(payloads.actualVifRef)
      const vm = getVmByRef(payloads.vmRef)
      const network = getNetworkByRef(payloads.networkRef)

      if (!actualVif || !vm || !network) {
        throw new JobError(t('job:arg:missing-payload'))
      }

      const refPayloads = {
        vmRef: vm.$ref,
        network: network.$ref,
        MAC: payloads.MAC,
        ipv4_allowed: payloads.ipv4_allowed,
        ipv6_allowed: payloads.ipv6_allowed,
        qos_algorithm_type: payloads.qos_algorithm_type,
        qos_algorithm_params: payloads.qos_algorithm_params,
        other_config: payloads.other_config,
      }
      return xapi.vif.edit(actualVif, refPayloads)
    },

    validate(isRunning, payloads) {
      if (isRunning) {
        throw new JobRunningError(t('edit-vif:updating'))
      }

      if (!payloads) {
        throw new JobError(t('job:arg:missing-payload'))
      }
    },
  }
})
