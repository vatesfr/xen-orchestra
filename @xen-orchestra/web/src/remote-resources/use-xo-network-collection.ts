import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export const useXoNetworkCollection = defineRemoteResource({
  url: '/rest/v0/networks?fields=id,defaultIsLocked,name_label,nbd,tags,$pool,name_description,MTU,PIFs,other_config',
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
