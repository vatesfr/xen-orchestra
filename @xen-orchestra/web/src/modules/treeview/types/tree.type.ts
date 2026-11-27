import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { XoSite } from '@/modules/site/types/xo-site.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import type { Branch } from '@core/packages/tree/branch.ts'
import type { Leaf } from '@core/packages/tree/leaf.ts'

export type TreeGroup = {
  id: string
  label: string
  icon: IconName
}

export type VmLeaf = Leaf<FrontXoVm, 'vm'>

export type HostBranch = Branch<FrontXoHost, VmLeaf, 'host'>

export type HostGroupBranch = Branch<TreeGroup, VmLeaf, 'group'>

export type PoolBranch = Branch<FrontXoPool, HostGroupBranch | HostBranch | VmLeaf, 'pool'>

export type PoolGroupBranch = Branch<TreeGroup, HostGroupBranch | HostBranch | VmLeaf, 'group'>

export type GroupBranch = HostGroupBranch | PoolGroupBranch

export type SiteBranch = Branch<XoSite, GroupBranch | PoolBranch | HostBranch | VmLeaf, 'site'>
