import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoVm } from '@/types/xo/vm.type'
import type { Branch } from '@core/composables/tree/branch'
import type { Leaf } from '@core/composables/tree/leaf'
import type { Task } from '@core/types/task.type.ts'

export type VmLeaf = Leaf<XoVm, 'vm'>

export type HostBranch = Branch<XoHost, VmLeaf, 'host'>

export type PoolBranch = Branch<XoPool, HostBranch | VmLeaf, 'pool'>

export type TaskBranch = Branch<Task, TaskBranch, 'task'>
