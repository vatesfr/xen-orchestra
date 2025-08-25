import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { type XoHost } from '@/types/xo/host.type.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'
import { sortByNameLabel } from '@core/utils/sort-by-name-label.util.ts'
import { useSorted } from '@vueuse/core'
import { computed } from 'vue'

export const useXoHostCollection = defineRemoteResource({
  url: '/rest/v0/hosts?fields=id,name_label,name_description,power_state,controlDomain,residentVms,$pool,current_operations,address,startTime,version,bios_strings,cpus,CPUs,memory,tags,iscsiIqn,powerOnMode,build,otherConfig,multipathing,logging,enabled,agentStartTime,PGPUs',
  initialData: () => [] as XoHost[],
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
