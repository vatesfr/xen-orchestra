import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  const deps = {
    pifStore: usePifStore(),
  }

  const { context: baseContext, ...configRest } = createXoStoreConfig('network', {
    sortBy: sortByNameLabel,
  })

  const pifContext = deps.pifStore.getContext()

  const networksWithPifs = computed(() => {
    const networkIds = Array.from(pifContext.hostMasterPifsByNetwork.value.keys())

    return baseContext.records.value.filter(network => {
      return networkIds.includes(network.id) && network.PIFs.length > 0
    })
  })

  const networksWithoutPifs = computed(() => baseContext.records.value.filter(network => network.PIFs.length === 0))

  const context = {
    ...baseContext,
    networksWithPifs,
    networksWithoutPifs,
  }
  return createSubscribableStoreContext({ context, ...configRest }, {})
})
