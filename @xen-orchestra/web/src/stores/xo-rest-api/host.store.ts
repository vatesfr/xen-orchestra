import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { HOST_OPERATION, type XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util'
import { castArray } from 'lodash-es'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useHostStore = defineStore('host', () => {
  const deps = {
    poolStore: usePoolStore(),
  }

  const poolContext = deps.poolStore.getContext()

  const { context: baseContext, ...configRest } = createXoStoreConfig('host', {
    sortBy: sortByNameLabel,
  })

  const isMasterHost = (hostId: XoHost['id']) => !!poolContext.records.value.find(pool => pool.master === hostId)

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

  const getMasterHostByPoolId = (poolId: XoPool['id']) => {
    const masterHostId = poolContext.get(poolId)?.master

    if (masterHostId === undefined) {
      return
    }

    return baseContext.get(masterHostId)
  }

  const isHostOperationPending = (host: XoHost, operations: HOST_OPERATION[] | HOST_OPERATION) => {
    const currentOperations = Object.values(host.current_operations)

    return castArray(operations).some(operation => currentOperations.includes(operation))
  }

  const context = {
    ...baseContext,
    isMasterHost,
    hostsByPool,
    getMasterHostByPoolId,
    isHostOperationPending,
  }

  return createSubscribableStoreContext({ context, ...configRest }, deps)
})
