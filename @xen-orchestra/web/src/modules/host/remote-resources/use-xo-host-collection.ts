import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoCollectionState } from '@/shared/composables/xo-collection-state/use-xo-collection-state.ts'
import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { watchCollectionWrapper } from '@/shared/utils/sse.util.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoHost, XoPool } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

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
  watchCollection: watchCollectionWrapper({ resource: 'host', fields: hostFields }),
  state: (rawHosts, context) => {
    const hosts = useSorted(rawHosts, sortByNameLabel)

    const state = useXoCollectionState(hosts, {
      context,
      baseName: 'host',
    })

    const { pools, getPoolById } = useXoPoolCollection(context)

    const hostsByPool = computed(() => {
      const hostsByPoolMap = new Map<XoPool['id'], FrontXoHost[]>()

      hosts.value.forEach(host => {
        const poolId = host.$pool

        if (!hostsByPoolMap.has(poolId)) {
          hostsByPoolMap.set(poolId, [])
        }

        hostsByPoolMap.get(poolId)!.push(host)
      })

      return hostsByPoolMap
    })

    function isMasterHost(hostId: XoHost['id']) {
      return !!pools.value.find(pool => pool.master === hostId)
    }

    function getMasterHostByPoolId(poolId: XoPool['id']) {
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
