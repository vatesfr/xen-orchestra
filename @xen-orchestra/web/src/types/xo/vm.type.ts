import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoVbd } from '@/types/xo/vbd.type'
import type { Branded } from '@core/types/utility.type'

export enum VM_POWER_STATE {
  HALTED = 'Halted',
  PAUSED = 'Paused',
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
}

export enum VM_OPERATION {
  CLEAN_REBOOT = 'clean_reboot',
  CLEAN_SHUTDOWN = 'clean_shutdown',
  HARD_REBOOT = 'hard_reboot',
  HARD_SHUTDOWN = 'hard_shutdown',
  PAUSE = 'pause',
  SUSPEND = 'suspend',
  SHUTDOWN = 'shutdown',
}

export type XoVm = {
  id: Branded<'vm'>
  type: 'VM'
  $container: XoPool['id'] | XoHost['id']
  $pool: XoPool['id']
  $VBDs: XoVbd['id']
  _xapiRef: string
  current_operations: Record<string, VM_OPERATION>
  name_label: string
  name_description: string
  power_state: VM_POWER_STATE
  addresses: Record<string, string>
  mainIpAddress: string
  other: { disable_pv_vnc: string }
  CPUs: {
    max: number
    number: number
  }
}
