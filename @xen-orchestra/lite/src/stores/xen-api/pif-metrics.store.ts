import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePifMetricsStore = defineStore('xen-api-pif-metrics', () => {
  const config = createXapiStoreConfig('pif_metrics')

  return createSubscribableStoreContext(config, {})
})
