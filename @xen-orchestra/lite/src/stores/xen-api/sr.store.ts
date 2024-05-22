import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useSrStore = defineStore('xen-api-sr', () => {
  const config = createXapiStoreConfig('sr')

  return createSubscribableStoreContext(config, {})
})
