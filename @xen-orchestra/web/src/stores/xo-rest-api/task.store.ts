import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useTaskStore = defineStore('task', () => {
  const config = createXoStoreConfig('task', { pollInterval: 5000 })

  return createSubscribableStoreContext(config, {})
})
