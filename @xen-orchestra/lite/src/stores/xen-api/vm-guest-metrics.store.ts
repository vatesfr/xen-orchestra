import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVmGuestMetricsStore = defineStore('xen-api-vm_guest_metrics', () => {
  const config = createXapiStoreConfig('vm_guest_metrics')

  return createSubscribableStoreContext(config, {})
})
