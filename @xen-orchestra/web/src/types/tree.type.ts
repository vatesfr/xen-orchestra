import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSite } from '@/types/xo/site.type.ts'
import type { XoVm } from '@/types/xo/vm.type'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'

export type VmLeaf = Leaf<XoVm, 'vm'>

export type HostBranch = Branch<XoHost, VmLeaf, 'host'>

export type PoolBranch = Branch<XoPool, HostBranch | VmLeaf, 'pool'>

export type SiteBranch = Branch<XoSite, PoolBranch, 'site'>
