import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoNetwork } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

const networkFields: (keyof XoNetwork)[] = [
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
] as const

export const useXoNetworkCollection = defineRemoteResource({
  url: `${BASE_URL}/networks?fields=${networkFields.join(',')}`,
  watchCollection: watchCollectionWrapper({ resource: 'network', fields: networkFields }),
  initialData: () => [] as XoNetwork[],
  state: (rawNetworks, context) => {
    const { hostMasterPifsByNetwork } = useXoPifCollection(context)

    const networks = useSorted(rawNetworks, sortByNameLabel)

    const networksWithPifs = computed(() => {
      const networkIds = Array.from(hostMasterPifsByNetwork.value.keys())

      return networks.value.filter(network => networkIds.includes(network.id) && network.PIFs.length > 0)
    })

    const networksWithoutPifs = computed(() => networks.value.filter(network => network.PIFs.length === 0))

    return {
      ...useXoCollectionState(networks, {
        context,
        baseName: 'network',
      }),
      networksWithPifs,
      networksWithoutPifs,
    }
  },
})
