import type { VmLeaf } from '@/types/vm.type'
import type { RecordId } from '@/types/xo-object.type'
import type { Branch } from '@core/composables/tree/branch'

export enum HOST_POWER_STATE {
  HALTED = 'Halted',
  RUNNING = 'Running',
  UNKNOWN = 'Unknown',
}

export type Host = {
  id: RecordId<'host'>
  type: 'host'
  $pool: RecordId<'pool'>
  _xapiRef: string
  address: string
  enabled: boolean
  name_label: string
  name_description: string
  power_state: HOST_POWER_STATE
  residentVms: RecordId<'VM'>[]
}

export type HostBranch = Branch<Host, VmLeaf, 'host'>
