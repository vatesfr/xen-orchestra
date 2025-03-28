import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'

export const usePoolStore = defineStore('pool', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('pool', {
    sortBy: sortByNameLabel,
  })

  const context = {
    ...baseContext,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
