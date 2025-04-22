import type { XoPool } from '@/types/xo/pool.type'
import { type XoVm } from '@/types/xo/vm.type'
import type { Branded } from '@core/types/utility.type'

export enum HOST_POWER_STATE {
  HALTED = 'Halted',
  RUNNING = 'Running',
  UNKNOWN = 'Unknown',
}

export enum HOST_OPERATION {
  SHUTDOWN = 'shutdown',
  REBOOT = 'reboot',
}

export type XoHost = {
  id: Branded<'host'>
  type: 'host'
  $pool: XoPool['id']
  _xapiRef: string
  current_operations: Record<string, HOST_OPERATION>
  address: string
  enabled: boolean
  name_label: string
  name_description: string
  controlDomain: Branded<'vm-controller'>
  power_state: HOST_POWER_STATE
  residentVms: XoVm['id'][]
  startTime: number
  version: string
  iscsiIqn: string
  powerOnMode: string
  build: string
  multipathing: boolean
  bios_strings: {
    'system-manufacturer': string
    'system-product-name': string
  }
  cpus: {
    cores: number
    sockets: number
  }
  logging: {
    syslog_destination?: string
  }
  CPUs: {
    modelname: string
  }
  memory: {
    usage: number
    size: number
  }
  tags: string[]
  otherConfig: {
    agent_start_time: string
  }
}
