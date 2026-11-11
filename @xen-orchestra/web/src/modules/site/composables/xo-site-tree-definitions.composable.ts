import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { XoSite } from '@/modules/site/types/xo-site.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

export function useXoSiteTreeDefinitions(predicate: (node: TreeNodeBase) => boolean | undefined) {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hostsByPool, areHostsReady } = useXoHostCollection()
  const { vmsByHost, hostLessVmsByPool, areVmsReady } = useXoVmCollection()

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
        discriminator: 'site',
      },
      () => [
        ...defineTree(
          'pools',
          pools.value,
          {
            getLabel: 'name_label',
            predicate,
            discriminator: 'pool',
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
                  discriminator: 'vm',
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

  return {
    definitions,
    isReady,
  }
}
