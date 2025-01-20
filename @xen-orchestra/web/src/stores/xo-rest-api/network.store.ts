import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('network')

  const networksWithPifs = computed(() => baseContext.records.value.filter(network => network.PIFs.length > 0))

  const networksWithoutPifs = computed(() => baseContext.records.value.filter(network => network.PIFs.length === 0))

  const context = {
    ...baseContext,
    networksWithPifs,
    networksWithoutPifs,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
