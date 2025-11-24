import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { watchCollectionWrapper } from '@/utils/sse.util'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import type { XoHost, XoPool } from '@vates/types'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

const hostFields: (keyof XoHost)[] = [
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
] as const

export const useXoHostCollection = defineRemoteResource({
  url: '/rest/v0/hosts?fields='.concat(hostFields.toString()),
  initialData: () => [] as XoHost[],
  watchCollection: watchCollectionWrapper({ resource: 'host', fields: hostFields }),
  state: (rawHosts, context) => {
    const hosts = useSorted(rawHosts, sortByNameLabel)

    const state = useXoCollectionState(hosts, {
      context,
      baseName: 'host',
    })

    const { pools, getPoolById } = useXoPoolCollection(context)

    const hostsByPool = computed(() => {
      const hostsByPoolMap = new Map<XoPool['id'], XoHost[]>()

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
