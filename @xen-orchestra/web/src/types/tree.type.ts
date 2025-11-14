import type { XoSite } from '@/types/xo/site.type.ts'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'
import type { XoHost, XoPool, XoVm } from '@vates/types'

export type VmLeaf = Leaf<XoVm, 'vm'>

export type HostBranch = Branch<XoHost, VmLeaf, 'host'>

export type PoolBranch = Branch<XoPool, HostBranch | VmLeaf, 'pool'>

export type SiteBranch = Branch<XoSite, PoolBranch, 'site'>
