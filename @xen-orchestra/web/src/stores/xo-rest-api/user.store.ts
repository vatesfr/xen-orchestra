import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const config = createXoStoreConfig('user')

  return createSubscribableStoreContext(config, {})
})
