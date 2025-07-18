import type { XoHost } from '@/types/xo/host.type.ts'
import type { Branded } from '@core/types/utility.type'

export enum VM_CONTROLLER_POWER_STATE {
  HALTED = 'Halted',
  PAUSED = 'Paused',
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
}

export type XoVmController = {
  id: Branded<'vm-controller'>
  name_label: string
  power_state: VM_CONTROLLER_POWER_STATE
  $container: XoHost['id']
  memory: {
    dynamic: number[]
    static: number[]
    size: number
  }
}
