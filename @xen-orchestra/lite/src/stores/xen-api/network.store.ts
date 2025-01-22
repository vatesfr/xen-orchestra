import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { usePifStore } from '@/stores/xen-api/pif.store'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNetworkStore = defineStore('xen-api-network', () => {
  const deps = {
    pifStore: usePifStore(),
  }

  const { context: baseContext, ...configRest } = createXapiStoreConfig('network', {
    sortBy: sortByNameLabel,
  })

  const pifContext = deps.pifStore.getContext()

  const networksWithPifs = computed(() => {
    const networkRefs = Array.from(pifContext.pifsByHostMaster.value.keys())

    return baseContext.records.value.filter(network => {
      return networkRefs.includes(network.$ref) && network.PIFs.length > 0
    })
  })

  const networksWithoutPifs = computed(() => {
    return baseContext.records.value.filter(network => network.PIFs.length === 0)
  })

  const context = {
    ...baseContext,
    networksWithPifs,
    networksWithoutPifs,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
