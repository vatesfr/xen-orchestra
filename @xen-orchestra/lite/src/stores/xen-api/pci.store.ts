import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config.ts'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util.ts'
import { defineStore } from 'pinia'

export const usePciStore = defineStore('xen-api-pci', () => {
  const config = createXapiStoreConfig('pci')

  return createSubscribableStoreContext(config, {})
})
