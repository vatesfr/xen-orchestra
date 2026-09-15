import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useVdiStore = defineStore('xen-api-vdi', () => {
  const config = createXapiStoreConfig('vdi')

  return createSubscribableStoreContext(config, {})
})
