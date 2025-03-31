import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVbdStore = defineStore('xen-api-vbd', () => {
  const config = createXapiStoreConfig('vbd')

  return createSubscribableStoreContext(config, {})
})
