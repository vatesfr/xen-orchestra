import type { XenApiHost, XenApiPool, XenApiVm } from '@/libs/xen-api/xen-api.types.ts'
import type { Branch } from '@core/packages/tree/branch.ts'
import type { Leaf } from '@core/packages/tree/leaf.ts'

export type VmLeaf = Leaf<XenApiVm, 'vm'>

export type HostBranch = Branch<XenApiHost, VmLeaf, 'host'>

export type PoolBranch = Branch<XenApiPool, HostBranch | VmLeaf, 'pool'>
