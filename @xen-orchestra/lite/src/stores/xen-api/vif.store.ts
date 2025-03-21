import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVifStore = defineStore('xen-api-vif', () => {
  const config = createXapiStoreConfig('vif')

  return createSubscribableStoreContext(config, {})
})
