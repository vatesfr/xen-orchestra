import type { XenApiHost, XenApiNetwork, XenApiSr, XenApiVdi, XenApiVm } from '@/libs/xen-api/xen-api.types'
import { type OPAQUE_REF_NULL, type VDI_TYPE } from '@vates/types/common'

export interface Vdi {
  name_label: string
  name_description: string
  size: number
  SR: XenApiSr['$ref']
  type?: VDI_TYPE
}

export interface NetworkInterface {
  interface: XenApiNetwork['$ref']
  macAddress: string
}

export interface VmState {
  name: string
  description: string
  toggle: boolean
  installMode: string
  tag: string
  tags: string[]
  affinity_host: XenApiHost['$ref'] | OPAQUE_REF_NULL
  boot_firmware: string
  new_vm_template: XenApiVm | undefined
  boot_vm: boolean
  auto_power: boolean
  fast_clone: boolean
  ssh_key: string
  selectedVdi: XenApiVdi['$ref'] | undefined
  networkConfig: string
  cloudConfig: string
  vCPU: number
  VCPUs_max: number
  ram: number
  topology: number | null
  copyHostBiosStrings: boolean
  sshKeys: string[]
  existingVdis: Vdi[]
  vdis: Vdi[]
  networkInterfaces: NetworkInterface[]
  defaultNetwork: NetworkInterface | undefined
}
