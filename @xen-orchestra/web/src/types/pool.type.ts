import type { HostBranch } from '@/types/host.type'
import type { VmLeaf } from '@/types/vm.type'
import type { RecordId } from '@/types/xo-object.type'
import type { Branch } from '@core/composables/tree/branch'

export type Pool = {
  id: RecordId<'pool'>
  type: 'pool'
  $pool: RecordId<'pool'>
  master: RecordId<'host'>
  name_description: string
  name_label: string
  _xapiRef: string
}

export type PoolBranch = Branch<Pool, HostBranch | VmLeaf, 'pool'>
