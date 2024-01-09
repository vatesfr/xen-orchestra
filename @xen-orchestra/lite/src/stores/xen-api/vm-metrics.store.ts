import { useXenApiStoreSubscribableContext } from '@/composables/xen-api-store-subscribable-context.composable'
import { createUseCollection } from '@/stores/xen-api/create-use-collection'
import { defineStore } from 'pinia'

export const useVmMetricsStore = defineStore('xen-api-vm-metrics', () => {
  return useXenApiStoreSubscribableContext('vm_metrics')
})

export const useVmMetricsCollection = createUseCollection(useVmMetricsStore)
