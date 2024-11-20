import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

// export const usePifStore = defineStore('pif', () => {
//   const { context: baseContext, ...configRest } = createXoStoreConfig('pif', {})
//   const pifs = baseContext.records
//
//   const context = {
//     ...baseContext,
//     pifs,
//   }
//
//   return createSubscribableStoreContext({ context, ...configRest }, {})
// })

export const usePifStore = defineStore('pif', () => {
  const config = createXoStoreConfig('pif', {})

  return createSubscribableStoreContext(config, {})
})
