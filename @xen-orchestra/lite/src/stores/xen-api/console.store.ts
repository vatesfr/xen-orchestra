import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'

export const useConsoleStore = defineStore('xen-api-console', () => {
  return useXenApiStoreSubscribableContext('console')
})

export const useConsoleCollection = createUseCollection(useConsoleStore)
