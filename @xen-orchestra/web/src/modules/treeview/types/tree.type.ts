import type { XoSite } from '@/modules/site/types/site.type.ts'
import type { Branch } from '@core/packages/tree/branch.ts'
import type { Leaf } from '@core/packages/tree/leaf.ts'
import type { XoHost, XoPool, XoVm } from '@vates/types'

export type VmLeaf = Leaf<XoVm, 'vm'>

export type HostBranch = Branch<XoHost, VmLeaf, 'host'>

export type PoolBranch = Branch<XoPool, HostBranch | VmLeaf, 'pool'>

export type SiteBranch = Branch<XoSite, PoolBranch, 'site'>
