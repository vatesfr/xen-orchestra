import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'

export const useNetworkStore = defineStore('xen-api-network', () => {
  return useXenApiStoreSubscribableContext('network')
})

export const useNetworkCollection = createUseCollection(useNetworkStore)
