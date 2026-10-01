import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiNetwork, XenApiVif, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { VIF_LOCKING_MODE } from '@vates/types'

export function createVifOperations(xenApi: XenApi) {
  type VifRefs = MaybeArray<XenApiVif['$ref']>

  type VmRef = XenApiVm['$ref']

  type NetworkRef = XenApiNetwork['$ref']

  type VifCreateParams = {
    vmRef: VmRef
    device?: string
    network: NetworkRef
    MAC?: string
    MTU?: number
    ipv4_allowed?: string[]
    ipv6_allowed?: string[]
    locking_mode?: VIF_LOCKING_MODE
    other_config?: Record<string, any>
    qos_algorithm_params?: Record<string, any>
    qos_algorithm_type?: string
  }

  const setOtherConfig = (vifRefs: VifRefs, key: string, value: string) =>
    Promise.all(
      toArray(vifRefs).map(async vifRef => {
        await xenApi.call('VIF.remove_from_other_config', [vifRef, key])
        await xenApi.call('VIF.add_to_other_config', [vifRef, key, value])
      })
    )

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
          ipv4_allowed = [],
          ipv6_allowed = [],
          locking_mode = VIF_LOCKING_MODE.NETWORK_DEFAULT,
          other_config = {},
          qos_algorithm_params = {},
          qos_algorithm_type = '',
        } = params

        if (device === undefined) {
          const [allowedDevices = []] = await xenApi.vm.getAllowedVifDevices(vmRef)

          device = allowedDevices.shift()
        }

        if (MTU === undefined) {
          MTU = await xenApi.getField<number>('network', network, 'MTU')
        }

        const vifRecord = {
          device,
          VM: vmRef,
          network,
          MAC,
          MTU,
          ipv4_allowed,
          ipv6_allowed,
          locking_mode,
          other_config,
          qos_algorithm_params,
          qos_algorithm_type,
        }

        results.push(await xenApi.call('VIF.create', [vifRecord]))
      }
      return results
    },

    delete: (vifRefs: VifRefs) => Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.destroy', [vifRef]))),

    plug: (vifRefs: VifRefs) => Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.plug', [vifRef]))),

    unplug: (vifRefs: VifRefs) => Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.unplug', [vifRef]))),

    move: (vifRefs: VifRefs, networkRef: NetworkRef) =>
      Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.move', [vifRef, networkRef]))),

    setIpv4Allowed: (vifRefs: VifRefs, ips: string[]) =>
      Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.set_ipv4_allowed', [vifRef, ips]))),

    setIpv6Allowed: (vifRefs: VifRefs, ips: string[]) =>
      Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.set_ipv6_allowed', [vifRef, ips]))),

    setLockingMode: (vifRefs: VifRefs, lockingMode: VIF_LOCKING_MODE) =>
      Promise.all(toArray(vifRefs).map(vifRef => xenApi.call('VIF.set_locking_mode', [vifRef, lockingMode]))),

    setRateLimit: (vifRefs: VifRefs, kbps: number | null) =>
      Promise.all(
        toArray(vifRefs).map(async vifRef => {
          await xenApi.call('VIF.set_qos_algorithm_type', [vifRef, kbps === null ? '' : 'ratelimit'])
          await xenApi.call('VIF.set_qos_algorithm_params', [vifRef, kbps === null ? {} : { kbps: String(kbps) }])
        })
      ),

    setTxChecksumming: (vifRefs: VifRefs, enabled: boolean) => setOtherConfig(vifRefs, 'ethtool-tx', String(enabled)),
  }
}
