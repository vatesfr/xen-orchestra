import type { XoHost } from '@/types/xo/host.type'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoVbd } from '@/types/xo/vbd.type'
import type { Branded } from '@core/types/utility.type'
import type { XoSr } from './sr.type'

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
  tags: Array<string>
  os_version: {
    name: string
    uname: string
    distro: string
  }
  virtualizationMode: string
  secureBoot: boolean
  VTPMs: Array<string>
  viridian: boolean
  isNestedVirtEnabled: boolean
  memory: {
    dynamic: [number, number]
    static: [number, number]
    size: number
  }
  VGPUs: Array<string>
  high_availability: 'best-effort' | 'restart' | ''
  auto_poweron: boolean
  startDelay: number
  vga: 'std' | 'cirrus'
  videoram?: number
  pvDriversVersion?: string
  cpuWeight?: number
  cpuCap?: number
  cpuMask?: Array<number>
  coresPerSocket?: number
  nicType?: string
  affinityHost?: XoHost['id']
  suspendSr?: XoSr['id']
}
