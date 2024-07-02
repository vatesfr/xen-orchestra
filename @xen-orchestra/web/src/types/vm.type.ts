import type { RecordId } from '@/types/xo-object.type'
import type { Leaf } from '@core/composables/tree/leaf'

export enum VM_POWER_STATE {
  HALTED = 'Halted',
  PAUSED = 'Paused',
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
}

export type Vm = {
  id: RecordId<'VM'>
  type: 'VM'
  $container: RecordId<'host'> | RecordId<'pool'>
  $pool: RecordId<'pool'>
  _xapiRef: string
  name_label: string
  name_description: string
  power_state: VM_POWER_STATE
  addresses: Record<string, string>
  mainIpAddress: string
  other: { disable_pv_vnc: string }
}

export type VmLeaf = Leaf<Vm, 'vm'>
