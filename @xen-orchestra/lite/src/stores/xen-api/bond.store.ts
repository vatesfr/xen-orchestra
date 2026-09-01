import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const useBondStore = defineStore('xen-api-bond', () => {
  const config = createXapiStoreConfig('bond')

  return createSubscribableStoreContext(config, {})
})
