import type { XoPool } from '@/types/xo/pool.type'
import type { Branded } from '@core/types/utility.type'

type Disk = {
  bootable: boolean
  device: string
  size: number
  type: string
  SR: string
}

export type XoVmTemplate = {
  id: Branded<'vm-template'>
  boot: { firmware: string; order: string }
  CPUs: { max: number; number: number }
  type: 'VM-template'
  $pool: XoPool['id']
  memory: { dynamic: number[]; static: number[] }
  name_label: string
  name_description: string
  template_info: { disks: Disk[]; install_methods: string[] }
  isDefaultTemplate: boolean
  VIFs: []
  $VBDs: []
  tags: []
}
