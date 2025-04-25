import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const usePbdStore = defineStore('xen-api-pbd', () => {
  const config = createXapiStoreConfig('pbd')

  return createSubscribableStoreContext(config, {})
})
