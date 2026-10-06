import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVifStore = defineStore('xen-api-vif', () => {
  const config = createXapiStoreConfig('vif')

  return createSubscribableStoreContext(config, {})
})
