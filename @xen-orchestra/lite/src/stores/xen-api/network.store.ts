import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useNetworkStore = defineStore('xen-api-network', () => {
  const config = createXapiStoreConfig('network')

  return createSubscribableStoreContext(config, {})
})
