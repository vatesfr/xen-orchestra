import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPif } from '@vates/types'
import { ref, watch } from 'vue'

export type FrontXoPif = Pick<XoPif, (typeof pifFields)[number]>

const pifFields = [
  '$host',
  '$network',
  '$pool',
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
  'isBondSlave',
  'bondSlaves',
  'physical',
  'type',
] as const satisfies readonly (keyof XoPif)[]

export const useXoPifCollection = defineRemoteResource({
  url: `${BASE_URL}/pifs?fields=${pifFields.join(',')}`,
  initialData: () => [] as FrontXoPif[],
  initWatchCollection: () => useWatchCollection({ resource: 'PIF', fields: pifFields }),
  state: (pifs, context) => {
    const state = useXoCollectionState(pifs, {
      context,
      baseName: 'pif',
    })

    const { isMasterHost } = useXoHostCollection(context)

    const hostMasterPifsByNetwork = ref(new Map<FrontXoNetwork['id'], FrontXoPif[]>())
    const pifsByHost = ref(new Map<FrontXoHost['id'], FrontXoPif[]>())

    watch(pifs, _pifs => {
      const tmpHostMasterPifsByNetwork = new Map<FrontXoNetwork['id'], FrontXoPif[]>()
      const tmpPifsByHost = new Map<FrontXoHost['id'], FrontXoPif[]>()

      _pifs.forEach(pif => {
        if (isMasterHost(pif.$host)) {
          safePushInMap(tmpHostMasterPifsByNetwork, pif.$network, pif)
        }
        safePushInMap(tmpPifsByHost, pif.$host, pif)
      })

      hostMasterPifsByNetwork.value = tmpHostMasterPifsByNetwork
      pifsByHost.value = tmpPifsByHost
    })

    function getPifsByNetworkId(networkId: FrontXoNetwork['id']) {
      return pifs.value.filter(pif => pif.$network === networkId)
    }

    function getBondsDevices(pif: FrontXoPif) {
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
