import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useHostStore = defineStore('host', () => {
  const deps = {
    poolStore: usePoolStore(),
  }

  const { context: baseContext, ...configRest } = createXoStoreConfig('host', {
    sortBy: sortByNameLabel,
  })

  const isMasterHost = (hostId: XoHost['id']) => !!deps.poolStore.$context.records.find(pool => pool.master === hostId)

  const hostsByPool = computed(() => {
    const hostsByPoolMap = new Map<XoPool['id'], XoHost[]>()

    baseContext.records.value.forEach(host => {
      const poolId = host.$pool

      if (!hostsByPoolMap.has(poolId)) {
        hostsByPoolMap.set(poolId, [])
      }

      hostsByPoolMap.get(poolId)!.push(host)
    })

    return hostsByPoolMap
  })

  const context = {
    ...baseContext,
    isMasterHost,
    hostsByPool,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
