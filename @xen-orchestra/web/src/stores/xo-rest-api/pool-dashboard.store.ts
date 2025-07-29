import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePoolDashboardStore = defineStore('pool-dashboard', () => {
  const config = createXoStoreConfig('pool-dashboard')

  return createSubscribableStoreContext(config, {})
})
