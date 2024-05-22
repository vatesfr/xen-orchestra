import type { RecordId } from '@/types/xo-object.type'

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
}
