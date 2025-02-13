import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useVdiStore = defineStore('vdi', () => {
  const config = createXoStoreConfig('vdi')

  return createSubscribableStoreContext(config, {})
})
