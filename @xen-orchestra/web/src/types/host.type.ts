import type { RecordId } from '@/types/xo-object.type'

export enum HOST_POWER_STATE {
  HALTED = 'halted',
  RUNNING = 'running',
  UNKNOWN = 'unknown',
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
