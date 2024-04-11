import { createXoStoreConfig, type Host, type RecordId } from '@/stores/xo-rest-api/create-xo-store-config'
import { sortByNameLabel } from '@/utils/sort-by-name-label.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useHostStore = defineStore('host', () => {
  const { context: baseContext, ...configRest } = createXoStoreConfig('host', {
    sortBy: sortByNameLabel,
  })

  const hostsByPool = computed(() => {
    const hostsByPoolMap = new Map<RecordId<'pool'>, Host[]>()

    baseContext.records.value.forEach(host => {
      const poolId = host.$pool
      if (!hostsByPoolMap.has(poolId)) {
        hostsByPoolMap.set(poolId, [])
      }

      hostsByPoolMap.get(poolId)?.push(host)
    })

    return hostsByPoolMap
  })

  const context = {
    ...baseContext,
    hostsByPool,
  }

  return createSubscribableStoreContext({ context, ...configRest }, {})
})
