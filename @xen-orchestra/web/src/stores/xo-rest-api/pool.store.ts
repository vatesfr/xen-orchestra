import type { XoPool } from '@/types/xo/pool.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const usePoolStore = defineStore('pool', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('pool', {
    sortBy: sortByNameLabel,
  })
  const pool = computed<XoPool | undefined>(() => baseContext.records.value[0])

  const context = {
    ...baseContext,
    pool,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
