import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import type { XoServer } from '@vates/types'
import { ref, watch } from 'vue'

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
    const serverByPool = ref(new Map<FrontXoPool['id'], FrontXoServer[]>())

    watch(servers, _servers => {
      const tmpServerByPool = new Map<FrontXoPool['id'], FrontXoServer[]>()

      _servers.forEach(server => {
        if (server.poolId !== undefined) {
          safePushInMap(tmpServerByPool, server.poolId, server)
        }
      })

      serverByPool.value = tmpServerByPool
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
