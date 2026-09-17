import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import { useTreeCollapse } from '@core/composables/tree-collapse.composable.ts'
import { useTreeFilter } from '@core/composables/tree-filter.composable.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { useTree } from '@core/packages/tree/use-tree.ts'
import { logicAnd, logicOr } from '@vueuse/math'
import { computed } from 'vue'

const NO_HOST_REF = 'OpaqueRef:NULL' as XenApiHost['$ref']

export function usePoolTree() {
  const { pool, isReady: isPoolReady, hasError: hasPoolError } = usePoolStore().subscribe()
  const { records: hosts, isReady: areHostsReady, hasError: hasHostError } = useHostStore().subscribe()
  const { recordsByHostRef, isReady: areVmsReady, hasError: hasVmError } = useVmStore().subscribe()

  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const isReady = logicAnd(isPoolReady, areHostsReady, areVmsReady)

  const hasError = logicOr(hasPoolError, hasHostError, hasVmError)

  const pools = computed(() => (pool.value === undefined ? [] : [pool.value]))

  const definitions = computed(() =>
    defineTree(
      'pools',
      pools.value,
      {
        getId: pool => `pool:${pool.uuid}`,
        getLabel: 'name_label',
        predicate,
        discriminator: 'pool',
      },
      () => [
        ...defineTree(
          'hosts',
          hosts.value,
          {
            getId: host => `host:${host.uuid}`,
            getLabel: 'name_label',
            predicate,
            discriminator: 'host',
          },
          host =>
            defineTree('vms', recordsByHostRef.value.get(host.$ref) ?? [], {
              getId: vm => `vm:${vm.uuid}`,
              getLabel: 'name_label',
              predicate,
              discriminator: 'vm',
            })
        ),
        ...defineTree('vms', recordsByHostRef.value.get(NO_HOST_REF) ?? [], {
          getId: vm => `vm:${vm.uuid}`,
          getLabel: 'name_label',
          predicate,
          discriminator: 'vm',
        }),
      ]
    )
  )

  const collapsedIds = useTreeCollapse('pool.collapsed', filter, hasFilter)

  const { flatNodes, flatNodeIndexById, expandToNode } = useTree(definitions, { collapsedIds })

  return {
    isReady,
    hasError,
    treeItems: flatNodes,
    treeItemIndexById: flatNodeIndexById,
    filter,
    isSearching,
    expandToNode,
  }
}
