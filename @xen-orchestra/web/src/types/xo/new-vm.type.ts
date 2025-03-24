import type { XoPool } from '@/types/xo/pool.type'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'

export interface Disk {
  name_label: string
  name_description: string
  size: number
  sr: string
  type?: string
}

export interface NetworkInterface {
  interface: string
  macAddress: string
}

export interface VmState {
  affinity_host: string
  auto_poweron: boolean
  installMode: string
  boot_firmware: string
  boot_vm: boolean
  clone: boolean
  cloudConfig: string
  copyHostBiosStrings: boolean
  defaultNetwork: NetworkInterface | null
  existingDisks: Disk[]
  isDiskTemplateSelected: boolean
  networkConfig: string
  networkInterfaces: NetworkInterface[]
  new_vm_template: XoVmTemplate | null
  pool: XoPool | null
  ram: number
  sshKeys: string[]
  ssh_key: string
  tags: string[]
  topology: string
  vCPU: number
  selectedVCPU: number
  vdis: Disk[]
  vm_description: string
  vm_name: string
}
