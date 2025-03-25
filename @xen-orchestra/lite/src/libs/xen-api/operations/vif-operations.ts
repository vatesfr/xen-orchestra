import type XenApi from '@/libs/xen-api/xen-api'
import type { XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'

export function createVifOperations(xenApi: XenApi) {
  type VifRefs = MaybeArray<XenApiVif['$ref']>

  type VmRef = XenApiVm['$ref']

  type NetworkRef = XenApiNetwork['$ref']

  type VifCreateParams = {
    vmRef: VmRef
    device?: string
    network: NetworkRef | string
    MAC: string
    MTU?: number
    other_config?: Record<string, any>
    qos_algorithm_params?: Record<string, any>
    qos_algorithm_type?: string
  }

  return {
    create: async (vifs: VifCreateParams[]) => {
      const results: VifRefs = []

      for (const params of vifs) {
        let {
          vmRef,
          device,
          network,
          MAC = '',
          MTU,
          other_config = {},
          qos_algorithm_params = {},
          qos_algorithm_type = '',
        } = params

        if (device === undefined) {
          const [allowedDevices = []] = await xenApi.vm.getAllowedVifDevices(vmRef)

          device = allowedDevices.shift()
        }

        MTU = await xenApi.getField<number>('network', network, 'MTU')

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

        results.push(await xenApi.call('VIF.create', [vifRecord]))
      }
      return results
    },

    delete: (vifRefs: VifRefs) => Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.destroy', [vifRef]))),
  }
}
