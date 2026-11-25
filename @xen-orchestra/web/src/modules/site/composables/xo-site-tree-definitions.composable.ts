import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { XoSite } from '@/modules/site/types/xo-site.type.ts'
import { findXoSiteTreeOrphans } from '@/modules/site/utils/xo-site-tree.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'

export function useXoSiteTreeDefinitions(predicate: (node: TreeNodeBase) => boolean | undefined) {
  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hosts, hostsByPool, areHostsReady } = useXoHostCollection()
  const { vms, vmsByHost, areVmsReady } = useXoVmCollection()

  const site: XoSite = {
    id: 'site-root',
    type: 'site',
    name_label: XOA_NAME,
  }

  const sites = computed(() => [site])

  const isReady = logicAnd(arePoolsReady, areHostsReady, areVmsReady)

  const orphans = computed(() => findXoSiteTreeOrphans({ pools: pools.value, hosts: hosts.value, vms: vms.value }))

  function defineVmTree(vms: FrontXoVm[]) {
    return defineTree('vms', vms, {
      getLabel: 'name_label',
      predicate,
      discriminator: 'vm',
    })
  }

  function defineHostTree(hosts: FrontXoHost[]) {
    return defineTree(
      'hosts',
      hosts,
      {
        getLabel: 'name_label',
        predicate,
        discriminator: 'host',
      },
      host => defineVmTree(vmsByHost.value.get(host.id) ?? [])
    )
  }

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
            ...defineHostTree(hostsByPool.value.get(pool.id) ?? []),
            ...defineVmTree(orphans.value.hostLessVmsByPool.get(pool.id) ?? []),
          ]
        ),
        ...defineHostTree(orphans.value.poolLessHosts),
        ...defineVmTree(orphans.value.parentLessVms),
      ]
    )
  )

  return {
    definitions,
    isReady,
  }
}
