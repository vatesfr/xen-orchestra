import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/remote-resources/use-xo-pool-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoSite } from '@/types/xo/site.type.ts'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { useTree } from '@core/composables/tree.composable'
import { logicAnd } from '@vueuse/math'
import { computed, useId } from 'vue'

export function useSiteTree() {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hostsByPool, areHostsReady } = useXoHostCollection()
  const { vmsByHost, hostLessVmsByPool, areVmsReady } = useXoVmCollection()
  const { filter, predicate, isSearching } = useTreeFilter()

  const site: XoSite = {
    id: useId(),
    type: 'site',
    name_label: 'Xen Orchestra Appliance',
  }

  const sites = computed(() => [site])

  const isReady = logicAnd(arePoolsReady, areHostsReady, areVmsReady)

  const definitions = computed(() =>
    defineTree(
      sites.value,
      {
        getLabel: 'name_label',
      },
      () => [
        ...defineTree(
          pools.value,
          {
            getLabel: 'name_label',
            predicate,
          },
          pool => [
            ...defineTree(
              hostsByPool.value.get(pool.id) ?? [],
              {
                getLabel: 'name_label',
                predicate,
                discriminator: 'host',
              },
              host =>
                defineTree(vmsByHost.value.get(host.id) ?? [], {
                  getLabel: 'name_label',
                  predicate,
                })
            ),
            ...defineTree(hostLessVmsByPool.value.get(pool.id) ?? [], {
              getLabel: 'name_label',
              predicate,
              discriminator: 'vm',
            }),
          ]
        ),
      ]
    )
  )

  const { nodes } = useTree(definitions)

  return {
    isReady,
    sites: nodes,
    filter,
    isSearching,
  }
}
