import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVmMetricsStore = defineStore('xen-api-vm-metrics', () => {
  const config = createXapiStoreConfig('vm_metrics')

  return createSubscribableStoreContext(config, {})
})
