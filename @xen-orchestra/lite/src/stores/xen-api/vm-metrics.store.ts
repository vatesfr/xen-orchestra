import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVmMetricsStore = defineStore('xen-api-vm-metrics', () => {
  const config = createXapiStoreConfig('vm_metrics')

  return createSubscribableStoreContext(config, {})
})
