import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePoolDashboardStore = defineStore('pool-dashboard', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('pool-dashboard')

  const context = {
    ...baseContext,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
