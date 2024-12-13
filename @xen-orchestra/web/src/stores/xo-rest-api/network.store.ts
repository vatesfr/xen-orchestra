import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const useNetworkStore = defineStore('network', () => {
  const { context: baseContext, ...restConfig } = createXoStoreConfig('network')

  const context = {
    ...baseContext,
  }
  return createSubscribableStoreContext({ context, ...restConfig }, {})
})
