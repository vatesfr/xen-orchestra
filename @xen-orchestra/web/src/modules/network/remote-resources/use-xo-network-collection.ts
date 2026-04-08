import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoNetwork } from '@vates/types'
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
  url: `${BASE_URL}/networks?fields=${networkFields.join(',')}`,
  initWatchCollection: () => useWatchCollection({ resource: 'network', fields: networkFields }),
  initialData: () => [] as FrontXoNetwork[],
  state: (rawNetworks, context) => {
    const sortedNetworks = useSorted(rawNetworks, sortByNameLabel)

    const networksWithPifs = ref<FrontXoNetwork[]>([])
    const networksWithoutPifs = ref<FrontXoNetwork[]>([])

    watch(sortedNetworks, networks => {
      const tmpNetworksWithPifs: FrontXoNetwork[] = []
      const tmpNetworksWithoutPifs: FrontXoNetwork[] = []

      networks.forEach(network => {
        if (network.PIFs.length === 0) {
          tmpNetworksWithoutPifs.push(network)
        } else {
          tmpNetworksWithPifs.push(network)
        }
      })

      networksWithPifs.value = tmpNetworksWithPifs
      networksWithoutPifs.value = tmpNetworksWithoutPifs
    })

    return {
      ...useXoCollectionState(sortedNetworks, {
        context,
        baseName: 'network',
      }),
      networksWithPifs,
      networksWithoutPifs,
    }
  },
})
