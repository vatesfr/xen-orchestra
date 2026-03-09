import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { XoHost, XoNetwork, XoSr, XoVdi, XoVif } from '@vates/types'

export interface Vdi {
  id?: XoVdi['id']
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

export type InstallMode = 'no-config' | 'ssh-key' | 'cloud-init-config' | 'cdrom' | 'network' | undefined

export interface VmState {
  affinity_host?: XoHost['id']
  autoPoweron: boolean
  installMode?: InstallMode
  bootFirmware: string
  boot_vm: boolean
  clone: boolean
  cloudConfig: string
  copyHostBiosStrings: boolean
  isDiskTemplateSelected: boolean
  networkConfig: string
  vifs: Vif[]
  new_vm_template: FrontXoVmTemplate | undefined
  pool: FrontXoPool | undefined
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
  createVtpm?: boolean
  secureBoot: boolean
}
