import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { computed } from 'vue'

export const useXoServerCollection = defineRemoteResource({
  url: '/rest/v0/servers?fields=host,httpProxy,username,readOnly,allowUnauthorized,label,poolId,poolNameLabel,id,status,master,error,poolNameDescription',
  initialData: () => [] as XoServer[],
  state: (servers, context) => {
    const serverByPool = computed(() => {
      const serverByPoolMap = new Map<XoPool['id'], XoServer[]>()

      servers.value.forEach(server => {
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

    return {
      ...useXoCollectionState(servers, {
        context,
        baseName: 'server',
      }),
      serverByPool,
    }
  },
})
