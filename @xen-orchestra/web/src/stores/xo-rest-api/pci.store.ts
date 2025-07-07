import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePciStore = defineStore('pci', () => {
  const config = createXoStoreConfig('pci')

  return createSubscribableStoreContext(config, {})
})
