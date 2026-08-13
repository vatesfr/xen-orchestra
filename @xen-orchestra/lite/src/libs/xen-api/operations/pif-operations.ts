import type XenApi from '@/libs/xen-api/xen-api.ts'
import type { XenApiPif } from '@/libs/xen-api/xen-api.types.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'

export function createPifOperations(xenApi: XenApi) {
  return {
    forget: (pifs: MaybeArray<XenApiPif>) =>
      Promise.all(
        toArray(pifs).map(async pif => {
          if (pif.VLAN_master_of !== 'OpaqueRef:NULL') {
            return xenApi.call('VLAN.destroy', [pif.VLAN_master_of])
          }

          if (pif.bond_master_of.length > 0) {
            return Promise.all(pif.bond_master_of.map(bondRef => xenApi.call('Bond.destroy', [bondRef])))
          }

          if (pif.tunnel_access_PIF_of.length > 0) {
            await xenApi.call('PIF.unplug', [pif.$ref])
            return Promise.all(pif.tunnel_access_PIF_of.map(tunnelRef => xenApi.call('tunnel.destroy', [tunnelRef])))
          }

          return xenApi.call('PIF.forget', [pif.$ref])
        })
      ),
  }
}
