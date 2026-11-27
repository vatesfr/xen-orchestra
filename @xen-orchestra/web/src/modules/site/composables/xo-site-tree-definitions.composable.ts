import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { XoSite } from '@/modules/site/types/xo-site.type.ts'
import {
  buildXoSiteTreeLayout,
  createXoSiteTreePoolContent,
  type XoSiteTreePoolContent,
} from '@/modules/site/utils/xo-site-tree.util.ts'
import type { TreeGroup } from '@/modules/treeview/types/tree.type.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { XOA_NAME } from '@/shared/constants.ts'
import type { TreeNodeBase } from '@core/packages/tree/tree-node-base.ts'
import type { TreeNodeDefinition } from '@core/packages/tree/types.ts'
import { defineTree } from '@core/packages/tree/define-tree.ts'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoSiteTreeDefinitions(predicate: (node: TreeNodeBase) => boolean | undefined) {
  const { t } = useI18n()

  const { pools, arePoolsReady } = useXoPoolCollection()
  const { hosts, areHostsReady } = useXoHostCollection()
  const { vms, vmsByHost, areVmsReady } = useXoVmCollection()

  const site: XoSite = {
    id: 'site-root',
    type: 'site',
    name_label: XOA_NAME,
  }

  const sites = computed(() => [site])

  const isReady = logicAnd(arePoolsReady, areHostsReady, areVmsReady)

  const layout = computed(() => buildXoSiteTreeLayout({ pools: pools.value, hosts: hosts.value, vms: vms.value }))

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

  function defineGroupTree<TChildDefinition extends TreeNodeDefinition>(
    group: TreeGroup,
    children: TChildDefinition[]
  ) {
    if (children.length === 0) {
      return []
    }

    return defineTree('groups', [group], { discriminator: 'group' }, () => children)
  }

  function definePoolContentTree(groupId: string, content: XoSiteTreePoolContent) {
    return [
      ...defineGroupTree(
        { id: `host-group:${groupId}`, label: t('restricted-host', content.restrictedHostCount), icon: 'fa:server' },
        defineVmTree(content.restrictedHostVms)
      ),
      ...defineHostTree(content.hosts),
      ...defineVmTree(content.hostLessVms),
    ]
  }

  function definePoolLessTree() {
    const poolLessTree = definePoolContentTree('pool-less', layout.value.poolLessContent)

    if (!layout.value.hasPoolLevel) {
      return poolLessTree
    }

    return defineGroupTree(
      { id: 'pool-group', label: t('restricted-pool', layout.value.restrictedPoolCount), icon: 'fa:city' },
      poolLessTree
    )
  }

  function definePoolTree() {
    return defineTree('pools', pools.value, { getLabel: 'name_label', predicate, discriminator: 'pool' }, pool =>
      definePoolContentTree(pool.id, layout.value.contentByPoolId.get(pool.id) ?? createXoSiteTreePoolContent())
    )
  }

  const definitions = computed(() =>
    defineTree('sites', sites.value, { getLabel: 'name_label', discriminator: 'site' }, () => [
      ...definePoolLessTree(),
      ...definePoolTree(),
    ])
  )

  return {
    definitions,
    isReady,
  }
}
