import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoHost, XoNetwork, XoPif } from '@vates/types'
import { computed } from 'vue'

const pifFields: (keyof XoPif)[] = [
  '$host',
  '$network',
  'attached',
  'carrier',
  'device',
  'dns',
  'gateway',
  'id',
  'ip',
  'ipv6',
  'mac',
  'management',
  'mode',
  'mtu',
  'netmask',
  'speed',
  'vlan',
  'isBondMaster',
  'bondSlaves',
  'type',
] as const

export const useXoPifCollection = defineRemoteResource({
  url: `${BASE_URL}/pifs?fields=${pifFields.join(',')}`,
  initialData: () => [] as XoPif[],
  watchCollection: watchCollectionWrapper({ resource: 'PIF', fields: pifFields }),
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
      if (!pif.isBondMaster || !pif.bondSlaves) {
        return []
      }

      return pif.bondSlaves.flatMap(slaveId => state.getPifById(slaveId)?.device ?? [])
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
