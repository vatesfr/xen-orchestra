import type { XoPool } from '@/types/xo/pool.type'
import type { XoVbd } from '@/types/xo/vbd.type.ts'
import type { XoVif } from '@/types/xo/vif.type.ts'
import type { Branded } from '@core/types/utility.type'

type Disk = {
  bootable: boolean
  device: string
  size: number
  type: string
  SR: string
}

export type XoVmTemplate = {
  $VBDs: XoVbd['id'][]
  $pool: XoPool['id']
  CPUs: { max: number; number: number }
  VIFs: XoVif['id'][]
  boot: { firmware: string; order: string }
  id: Branded<'vm-template'>
  uuid: Branded<'vm-template'>
  isDefaultTemplate: boolean
  memory: { dynamic: number[]; static: number[]; size: number }
  name_description: string
  name_label: string
  tags: string[]
  template_info: { disks: Disk[]; install_methods: string[] }
}
