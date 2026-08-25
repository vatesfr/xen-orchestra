import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useConsoleStore = defineStore('xen-api-console', () => {
  const config = createXapiStoreConfig('console')

  return createSubscribableStoreContext(config, {})
})
