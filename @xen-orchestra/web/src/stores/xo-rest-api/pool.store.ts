import { createXoStoreConfig } from '@/stores/xo-rest-api/create-xo-store-config'
import { sortByNameLabel } from '@/utils/sort-by-name-label.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'

export const usePoolStore = defineStore('pool', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('pool', {
    sortBy: sortByNameLabel,
  })

  const isMasterHost = (hostId: string) => !!baseContext.records.value.find(pool => pool.master === hostId)

  const context = {
    ...baseContext,
    isMasterHost,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
