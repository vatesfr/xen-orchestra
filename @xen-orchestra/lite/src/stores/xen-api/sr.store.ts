import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'

export const useSrStore = defineStore('xen-api-sr', () => {
  return useXenApiStoreSubscribableContext('sr')
})

export const useSrCollection = createUseCollection(useSrStore)
