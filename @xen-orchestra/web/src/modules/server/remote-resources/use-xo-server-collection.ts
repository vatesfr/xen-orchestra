import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoPool, XoServer } from '@vates/types'
import { computed } from 'vue'

export type FrontXoServer = Pick<XoServer, (typeof serverFields)[number]>

const serverFields = [
  'id',
  'label',
  'poolId',
  'poolNameLabel',
  'poolNameDescription',
  'master',
  'host',
  'httpProxy',
  'username',
  'readOnly',
  'allowUnauthorized',
  'status',
  'error',
] as const satisfies readonly (keyof XoServer)[]

export const useXoServerCollection = defineRemoteResource({
  url: `${BASE_URL}/servers?fields=${serverFields.join(',')}`,
  initialData: () => [] as FrontXoServer[],
  state: (servers, context) => {
    const serverByPool = computed(() => {
      const serverByPoolMap = new Map<XoPool['id'], FrontXoServer[]>()

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
