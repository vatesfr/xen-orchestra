import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import type { XoVif } from '@/types/xo/vif.type.ts'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'

export interface Vdi {
  name_label: string
  name_description: string
  size: number
  sr: XoSr['id'] | undefined
  userdevice?: string
}

export interface Vif {
  id?: XoVif['id']
  network: XoNetwork['id']
  mac: string
  device?: string
}

export interface VifToSend {
  network?: XoNetwork['id']
  mac?: string
  device?: string
  destroy?: boolean
}

export type InstallMode = 'no-config' | 'ssh-key' | 'custom_config' | 'cdrom' | 'network' | undefined

export interface VmState {
  affinity_host?: XoHost['id']
  auto_poweron: boolean
  installMode?: InstallMode
  boot_firmware: string
  boot_vm: boolean
  clone: boolean
  cloudConfig?: string
  copyHostBiosStrings: boolean
  isDiskTemplateSelected: boolean
  networkConfig?: string
  vifs: Vif[]
  new_vm_template: XoVmTemplate | undefined
  pool: XoPool | undefined
  ram: number
  selectedVdi: XoVdi['id'] | undefined
  sshKeys: string[]
  ssh_key: string
  tags: string[]
  topology: string
  vCPU: number
  selectedVcpu: number
  vdis: Vdi[]
  description: string
  existingVdis: Vdi[]
  name: string
}
