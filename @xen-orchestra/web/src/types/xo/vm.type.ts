import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { Branded } from '@core/types/utility.type'

export enum VM_POWER_STATE {
  HALTED = 'Halted',
  PAUSED = 'Paused',
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
}

export type XoVm = {
  id: Branded<'vm'>
  type: 'VM'
  $container: XoPool['id'] | XoHost['id']
  $pool: XoPool['id']
  _xapiRef: string
  name_label: string
  name_description: string
  power_state: VM_POWER_STATE
  addresses: Record<string, string>
  mainIpAddress: string
  other: { disable_pv_vnc: string }
}
