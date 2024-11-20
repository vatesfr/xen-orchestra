import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePifStore = defineStore('xen-api-pif', () => {
  const config = createXapiStoreConfig('pif')

  return createSubscribableStoreContext(config, {})
})
