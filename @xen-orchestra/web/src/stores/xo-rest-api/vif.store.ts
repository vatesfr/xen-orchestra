import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVifStore = defineStore('vif', () => {
  const config = createXoStoreConfig('vif')

  return createSubscribableStoreContext(config, {})
})
