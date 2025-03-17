import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export function createVifOperations(xenApi: XenApi) {
  type VifRefs = MaybeArray<XenApiVif['$ref']>

  type VmRefs = MaybeArray<XenApiVm['$ref']>

  type NetworkRef = XenApiNetwork['$ref']

  type VifRecord = {
    vmRefs: VmRefs
    device: string | undefined
    network: NetworkRef | string
    MAC: string
    MTU?: number
    other_config?: Record<string, any>
    qos_algorithm_params?: Record<string, any>
    qos_algorithm_type?: string
  }

  return {
    create: ({
      device,
      vmRefs,
      network,
      MAC,
      MTU = 1500,
      other_config = {},
      qos_algorithm_params = {},
      qos_algorithm_type = '',
    }: VifRecord) => {
      return Promise.all<XenApiVif['$ref']>(
        toArray(vmRefs).map(vmRef => {
          const vifRecord = {
            device,
            VM: vmRef,
            network,
            MAC,
            MTU,
            other_config,
            qos_algorithm_params,
            qos_algorithm_type,
          }

          return xenApi.call('VIF.create', [vifRecord])
        })
      )
    },

    delete: (vifRefs: VifRefs) => Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.destroy', [vifRef]))),
  }
}
