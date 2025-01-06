import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVdiStore = defineStore('xen-api-vdi', () => {
  const config = createXapiStoreConfig('vdi')

  return createSubscribableStoreContext(config, {})
})
