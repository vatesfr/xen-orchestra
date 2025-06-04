import type { XoPool } from '@/types/xo/pool.type'
import type { XoServer } from '@/types/xo/server.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useServerStore = defineStore('server', () => {
  const { context: baseContext, ...config } = createXoStoreConfig('server')

  const serverByPool = computed(() => {
    const serverByPoolMap = new Map<XoPool['id'], XoServer[]>()

    baseContext.records.value.forEach(server => {
      const poolId = server.poolId

      if (!poolId) {
        return
      }

      if (!serverByPoolMap.has(poolId)) {
        serverByPoolMap.set(poolId, [])
      }
      serverByPoolMap.get(poolId)!.push(server)
    })

    return serverByPoolMap
  })

  const context = {
    ...baseContext,
    serverByPool,
  }

  return createSubscribableStoreContext({ context, ...config }, {})
})
