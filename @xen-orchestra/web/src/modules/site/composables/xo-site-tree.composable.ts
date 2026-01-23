import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { XoSite } from '@/modules/site/types/xo-site.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import type { TreeNodeId } from '@core/packages/tree/types'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { defineTree } from '@core/packages/tree/define-tree'
import { useTree } from '@core/packages/tree/use-tree'
import { useLocalStorage } from '@vueuse/core'
import { logicAnd } from '@vueuse/math'
import { computed, reactive, ref, watch } from 'vue'

export function useXoSiteTree() {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hostsByPool, areHostsReady } = useXoHostCollection()
  const { vmsByHost, hostLessVmsByPool, areVmsReady } = useXoVmCollection()
  const { filter, predicate, isSearching, hasFilter } = useTreeFilter()

  const site: XoSite = {
    id: 'site-root',
    type: 'site',
    name_label: XOA_NAME,
  }

  const sites = computed(() => [site])

  const isReady = logicAnd(arePoolsReady, areHostsReady, areVmsReady)

  const definitions = computed(() =>
    defineTree(
      'sites',
      sites.value,
      {
        getLabel: 'name_label',
      },
      () => [
        ...defineTree(
          'pools',
          pools.value,
          {
            getLabel: 'name_label',
            predicate,
          },
          pool => [
            ...defineTree(
              'hosts',
              hostsByPool.value.get(pool.id) ?? [],
              {
                getLabel: 'name_label',
                predicate,
                discriminator: 'host',
              },
              host =>
                defineTree('vms', vmsByHost.value.get(host.id) ?? [], {
                  getLabel: 'name_label',
                  predicate,
                })
            ),
            ...defineTree('vms', hostLessVmsByPool.value.get(pool.id) ?? [], {
              getLabel: 'name_label',
              predicate,
              discriminator: 'vm',
            }),
          ]
        ),
      ]
    )
  )

  const collapseState = reactive({
    default: useLocalStorage('site.collapsed', new Set<TreeNodeId>()),
    filtered: ref(new Set<TreeNodeId>()),
  })

  watch(filter, () => collapseState.filtered.clear())

  const collapsedIds = computed({
    get: () => (hasFilter.value ? collapseState.filtered : collapseState.default),
    set: value => {
      if (hasFilter.value) {
        collapseState.filtered = value
      } else {
        collapseState.default = value
      }
    },
  })

  const { nodes, scrollToNodeElement } = useTree(definitions, { collapsedIds })

  return {
    isReady,
    sites: nodes,
    filter,
    isSearching,
    scrollToNodeElement,
  }
}
