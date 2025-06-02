import { useHostStore } from '@/stores/xo-rest-api/host.store'
import { usePoolStore } from '@/stores/xo-rest-api/pool.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoSite } from '@/types/xo/site.type.ts'
import { defineTree } from '@core/composables/tree/define-tree'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { useTree } from '@core/composables/tree.composable'
import { logicAnd } from '@vueuse/math'
import { computed, useId } from 'vue'

export function useSiteTree() {
  const { records: pools, isReady: isPoolReady } = usePoolStore().subscribe()
  const { hostsByPool, isReady: isHostReady } = useHostStore().subscribe()
  const { vmsByHost, hostLessVmsByPool, isReady: isVmReady } = useVmStore().subscribe()
  const { filter, predicate } = useTreeFilter()

  const site: XoSite = {
    id: useId(),
    type: 'site',
    name_label: 'Xen Orchestra Appliance',
  }

  const sites = computed(() => [site])

  const isReady = logicAnd(isPoolReady, isHostReady, isVmReady)

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
  }
}
