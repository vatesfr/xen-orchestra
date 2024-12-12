import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useNetworkStore = defineStore('network', () => {
  const { context: baseContext, ...restConfig } = createXoStoreConfig('network')

  const networksWithPIFs = computed(() => {
    return baseContext.records.value.filter(network => network.PIFs.length > 0)
  })

  const hostInternalNetworks = computed(() => {
    return baseContext.records.value.filter(network => network.PIFs.length === 0)
  })

  const context = {
    ...baseContext,
    networksWithPIFs,
    hostInternalNetworks,
  }
  return createSubscribableStoreContext({ context, ...restConfig }, {})
})
