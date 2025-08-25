import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { XoPif } from '@/types/xo/pif.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

export const useXoPifCollection = defineRemoteResource({
  url: '/rest/v0/pifs?fields=$host,$network,attached,carrier,device,dns,gateway,id,ip,ipv6,mac,management,mode,mtu,netmask,speed,vlan,isBondMaster,bondSlaves',
  initialData: () => [] as XoPif[],
  state: (pifs, context) => {
    const state = useXoCollectionState(pifs, {
      context,
      baseName: 'pif',
    })

    const { isMasterHost } = useXoHostCollection(context)

    const hostMasterPifsByNetwork = computed(() => {
      const hostMasterPifsByNetworkMap = new Map<XoNetwork['id'], XoPif[]>()

      pifs.value
        .filter(pif => isMasterHost(pif.$host))
        .forEach(pif => {
          const networkId = pif.$network
          if (!hostMasterPifsByNetworkMap.has(networkId)) {
            hostMasterPifsByNetworkMap.set(networkId, [])
          }
          hostMasterPifsByNetworkMap.get(networkId)?.push(pif)
        })

      return hostMasterPifsByNetworkMap
    })

    function getPifsByNetworkId(networkId: XoNetwork['id']) {
      return pifs.value.filter(pif => pif.$network === networkId)
    }

    const pifsByHost = computed(() => {
      const pifsByHostMap = new Map<XoHost['id'], XoPif[]>()

      pifs.value.forEach(pif => {
        const hostId = pif.$host
        if (!pifsByHostMap.has(hostId)) {
          pifsByHostMap.set(hostId, [])
        }

        pifsByHostMap.get(hostId)!.push(pif)
      })

      return pifsByHostMap
    })

    function getBondsDevices(pif: XoPif) {
      return pif.isBondMaster ? pif.bondSlaves.flatMap(slaveId => state.getPifById(slaveId)?.device ?? []) : []
    }

    return {
      ...state,
      hostMasterPifsByNetwork,
      pifsByHost,
      getPifsByNetworkId,
      getBondsDevices,
    }
  },
})
