import type { XoHost } from '@/types/xo/host.type.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import type { XoPool } from '@/types/xo/pool.type'
import type { XoSr } from '@/types/xo/sr.type.ts'
import type { XoVdi } from '@/types/xo/vdi.type.ts'
import type { XoVmTemplate } from '@/types/xo/vm-template.type'

export interface Vdi {
  name_label: string
  name_description: string
  size: number
  sr: XoSr['id'] | undefined
}

export interface NetworkInterface {
  interface: XoNetwork['id']
  macAddress: string
}

export type VmState = {
  affinity_host: XoHost['id'] | undefined
  auto_poweron: boolean
  installMode: string
  boot_firmware: string
  boot_vm: boolean
  clone: boolean
  cloudConfig: string
  copyHostBiosStrings: boolean
  defaultNetwork: NetworkInterface | undefined
  isDiskTemplateSelected: boolean
  networkConfig: string
  networkInterfaces: NetworkInterface[]
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
  vdis: XoVdi[]
  description: string
  existingVdis: Vdi[]
  name: string
}

export type InstallMethod = 'no-config' | 'ssh-key' | 'custom_config' | 'cdrom' | 'network' | undefined

type NewVif = {
  network: string
  mac: string
  device?: string
}

export type XoNewVmData = {
  auto_poweron: boolean
  boot: boolean
  clone: boolean
  memory: number
  name_description: string
  name_label: string
  template: XoVmTemplate['uuid']
  vdis: XoVdi[]
  vifs: NewVif[]
  affinity?: XoHost['id']
  cloud_config?: string
  network_config?: string
  install?: {
    method: InstallMethod
    repository: string | undefined
  }
}
