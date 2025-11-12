import type { XoHost, XoNetwork, XoPool, XoSr, XoVdi, XoVif, XoVmTemplate } from '@vates/types'

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
  autoPoweron: boolean
  installMode?: InstallMode
  bootFirmware: 'bios' | 'uefi' | undefined
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
