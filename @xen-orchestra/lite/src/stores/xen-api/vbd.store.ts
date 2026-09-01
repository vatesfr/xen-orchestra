import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVbdStore = defineStore('xen-api-vbd', () => {
  const config = createXapiStoreConfig('vbd')

  return createSubscribableStoreContext(config, {})
})
