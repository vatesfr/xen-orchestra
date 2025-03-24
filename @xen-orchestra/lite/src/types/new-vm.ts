import type { XenApiNetwork, XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types'

export interface Disk {
  name_label: string
  name_description: string
  size: number
  SR: string | undefined
  type?: string
}

export interface NetworkInterface {
  interface: XenApiNetwork['$ref'] | string
  macAddress: string
}

export interface VmState {
  name: string
  description: string
  toggle: boolean
  installMode: string
  tags: string[]
  affinity_host: string
  boot_firmware: string
  new_vm_template: XenApiVm | null
  boot_vm: boolean
  auto_power: boolean
  fast_clone: boolean
  ssh_key: string
  selectedVdi: XenApiVdi['$ref'] | null
  networkConfig: string
  cloudConfig: string
  vCPU: number
  VCPUs_max: number
  ram: number
  topology: string
  copyHostBiosStrings: boolean
  sshKeys: string[]
  existingDisks: Disk[]
  vdis: Disk[]
  networkInterfaces: NetworkInterface[]
  defaultNetwork: NetworkInterface | null
}
