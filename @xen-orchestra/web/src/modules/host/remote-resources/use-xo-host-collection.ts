import { useXoPoolCollection, type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useWatchCollection } from '@/shared/composables/watch-collection.composable.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { safePushInMap } from '@/shared/utils/map.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoHost } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { ref, watch } from 'vue'

export type FrontXoHost = Pick<XoHost, (typeof hostFields)[number]>

const hostFields = [
  'id',
  'name_label',
  'name_description',
  'power_state',
  'controlDomain',
  'residentVms',
  '$pool',
  'current_operations',
  'address',
  'startTime',
  'version',
  'bios_strings',
  'cpus',
  'CPUs',
  'memory',
  'tags',
  'iscsiIqn',
  'powerOnMode',
  'build',
  'otherConfig',
  'multipathing',
  'logging',
  'enabled',
  'agentStartTime',
  'PGPUs',
  'type',
] as const satisfies readonly (keyof XoHost)[]

export const useXoHostCollection = defineRemoteResource({
  url: `${BASE_URL}/hosts?fields=${hostFields.join(',')}`,
  initialData: () => [] as FrontXoHost[],
  initWatchCollection: () => useWatchCollection({ resource: 'host', fields: hostFields }),
  state: (rawHosts, context) => {
    const sortedHosts = useSorted(rawHosts, sortByNameLabel)

    const state = useXoCollectionState(sortedHosts, {
      context,
      baseName: 'host',
    })

    const { pools, getPoolById } = useXoPoolCollection(context)

    const hostsByPool = ref(new Map<FrontXoPool['id'], FrontXoHost[]>())

    watch(sortedHosts, hosts => {
      const tmpHostsByPool = new Map<FrontXoPool['id'], FrontXoHost[]>()

      hosts.forEach(host => {
        safePushInMap(tmpHostsByPool, host.$pool, host)
      })

      hostsByPool.value = tmpHostsByPool
    })

    function isMasterHost(hostId: FrontXoHost['id']) {
      return !!pools.value.find(pool => pool.master === hostId)
    }

    function getMasterHostByPoolId(poolId: FrontXoPool['id']) {
      const masterHostId = getPoolById(poolId)?.master

      if (masterHostId === undefined) {
        return
      }

      return state.getHostById(masterHostId)
    }

    return {
      ...state,
      hostsByPool,
      isMasterHost,
      getMasterHostByPoolId,
    }
  },
})
