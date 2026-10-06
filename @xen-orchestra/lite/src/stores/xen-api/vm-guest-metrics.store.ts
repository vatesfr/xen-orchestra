import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVmGuestMetricsStore = defineStore('xen-api-vm-guest-metrics', () => {
  const config = createXapiStoreConfig('vm_guest_metrics')

  return createSubscribableStoreContext(config, {})
})
