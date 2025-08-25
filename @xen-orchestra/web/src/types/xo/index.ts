import type { XoAlarm } from '@/types/xo/alarm.type.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { XoPci } from '@/types/xo/pci.type.ts'
import type { XoPgpu } from '@/types/xo/pgpu.type.ts'
import type { XoPif } from '@/types/xo/pif.type.ts'
import type { XoPool } from '@/types/xo/pool.type.ts'
import type { XoServer } from '@/types/xo/server.type.ts'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import type { XoVbd } from '@/types/xo/vbd.type.ts'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import type { XoVif } from '@/types/xo/vif.type.ts'
import type { XoVmController } from '@/types/xo/vm-controller.type.ts'
import type { XoVmTemplate } from '@/types/xo/vm-template.type.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'

export type XoRecord =
  | XoAlarm
  | XoPool
  | XoHost
  | XoVm
  | XoSr
  | XoTask
  | XoPif
  | XoVbd
  | XoVdi
  | XoVif
  | XoNetwork
  | XoVmTemplate
  | XoVmController
  | XoServer
  | XoPci
  | XoPgpu
