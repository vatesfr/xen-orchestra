import type { XoPool } from '@/types/xo/pool.type'
import type { XoVm } from '@/types/xo/vm.type'
import type { Branded } from '@core/types/utility.type'

export enum HOST_POWER_STATE {
  HALTED = 'Halted',
  RUNNING = 'Running',
  UNKNOWN = 'Unknown',
}

export type XoHost = {
  id: Branded<'host'>
  type: 'host'
  $pool: XoPool['id']
  _xapiRef: string
  address: string
  enabled: boolean
  name_label: string
  name_description: string
  power_state: HOST_POWER_STATE
  residentVms: XoVm['id'][]
}
