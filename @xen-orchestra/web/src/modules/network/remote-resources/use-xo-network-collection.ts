import { getEncryptedEncapsulationsByPool, isPrivateNetwork } from '@/modules/network/utils/xo-network.util.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY, type TUNNEL_PROTOCOL, type XoNetwork } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { ref, watch } from 'vue'

export type FrontXoNetwork = Pick<XoNetwork, (typeof networkFields)[number]>

const networkFields = [
  'id',
  'defaultIsLocked',
  'name_label',
  'nbd',
  'tags',
  '$pool',
  'name_description',
  'MTU',
  'PIFs',
  'other_config',
  'type',
  'isBonded',
] as const satisfies readonly (keyof XoNetwork)[]

export const useXoNetworkCollection = defineRemoteResource({
  url: `${BASE_URL}/networks?fields=${networkFields.join(',')}&ndjson=true`,
  stream: true,
  initWatchCollection: () => useWatchCollection({ resource: 'network', fields: networkFields }),
  initialData: () => [] as FrontXoNetwork[],
  state: (rawNetworks, context) => {
    const sortedNetworks = useSorted(rawNetworks, sortByNameLabel)

    const physicalNetworks = ref<FrontXoNetwork[]>([])
    const internalNetworks = ref<FrontXoNetwork[]>([])
    const privateNetworks = ref<FrontXoNetwork[]>([])
    const privateNetworksByUuid = ref(new Map<string, FrontXoNetwork[]>())
    const encryptedEncapsulationsByPool = ref(new Map<FrontXoNetwork['$pool'], Set<TUNNEL_PROTOCOL>>())

    watch(sortedNetworks, networks => {
      const tmpPhysicalNetworks: FrontXoNetwork[] = []
      const tmpInternalNetworks: FrontXoNetwork[] = []
      const tmpPrivateNetworks: FrontXoNetwork[] = []
      const tmpPrivateNetworksByUuid = new Map<string, FrontXoNetwork[]>()

      networks.forEach(network => {
        if (isPrivateNetwork(network)) {
          tmpPrivateNetworks.push(network)
          safePushInMap(
            tmpPrivateNetworksByUuid,
            network.other_config[SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY],
            network
          )
        } else if (network.PIFs.length === 0) {
          tmpInternalNetworks.push(network)
        } else {
          tmpPhysicalNetworks.push(network)
        }
      })

      physicalNetworks.value = tmpPhysicalNetworks
      internalNetworks.value = tmpInternalNetworks
      privateNetworks.value = tmpPrivateNetworks
      privateNetworksByUuid.value = tmpPrivateNetworksByUuid
      encryptedEncapsulationsByPool.value = getEncryptedEncapsulationsByPool(tmpPrivateNetworks)
    })

    return {
      ...useXoCollectionState(sortedNetworks, {
        context,
        baseName: 'network',
      }),
      physicalNetworks,
      internalNetworks,
      privateNetworks,
      privateNetworksByUuid,
      encryptedEncapsulationsByPool,
    }
  },
})
