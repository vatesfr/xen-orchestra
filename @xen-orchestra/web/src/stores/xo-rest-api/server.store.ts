import type { XoPool } from '@/types/xo/pool.type'
import type { XoServer } from '@/types/xo/server.type'
import { createXoStoreConfig } from '@/utils/create-xo-store-config.util'
import { createSubscribableStoreContext } from '@core/utils/create-subscribable-store-context.util'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useServerStore = defineStore('server', () => {
  const { context: baseContext, ...config } = createXoStoreConfig('server')

  const serversByPool = computed(() => {
    const vmServerByPoolMap = new Map<XoPool['id'], XoServer[]>()

    baseContext.records.value.forEach(server => {
      const poolId = server.poolId
      if (!vmServerByPoolMap.has(poolId)) {
        vmServerByPoolMap.set(poolId, [])
      }
      vmServerByPoolMap.get(poolId)!.push(server)
    })

    return vmServerByPoolMap
  })

  const context = {
    ...baseContext,
    serversByPool,
  }

  return createSubscribableStoreContext({ context, ...config }, {})
})
