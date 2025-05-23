import { createXapiStoreConfig } from '@/stores/xen-api/create-xapi-store-config'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePciStore = defineStore('xen-api-pci', () => {
  const config = createXapiStoreConfig('pci')

  return createSubscribableStoreContext(config, {})
})
