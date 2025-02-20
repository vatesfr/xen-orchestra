// Types based on xapi-object-to-xo

import { Branded, DOMAIN_TYPE, VM_OPERATIONS, VM_POWER_STATE } from './common.mjs'

type BaseXoVm = {
  $VBDs: XoVbd['id'][]
  $VGPUs: XoVgpu['id'][]

  $container: XoPool['id'] | XoHost['id']
  $pool: XoPool['id']

  _xapiRef: string

  CPUs: {
    max: number
    number: number
  }
  PV_args?: string
  VGPUs: XoVgpu['id'][]
  VIFs: XoVif['id'][]
  VTPMs: XoVtpm['id'][]

  addresses: Record<string, string>
  affinityHost?: XoHost['id']
  attachedPcis?: string[]
  auto_poweron: boolean
  bios_strings: Record<string, string>
  blockedOperations: Record<VM_OPERATIONS, string>
  boot: Record<string, string>
  coresPerSocket?: number
  cpuCap?: number | null
  cpuMask?: (number | null)[]
  cpuWeight?: number | null
  creation: Record<string, string>
  current_operations: Record<string, VM_OPERATIONS>
  docker?: {
    containers?: string[]
    enabled: boolean
    info?: string
    process?: string
    version?: string
  }
  expNestedHvm: boolean
  hasVendorDevice: boolean
  high_availability: string
  installTime?: number | null
  isFirmwareSupported: boolean
  memory: {
    dynamic: [number, number]
    size: number
    static: [number, number]
    usage?: number
  }
  mainIpAddress?: string
  managementAgentDetected?: boolean
  name_description: string
  name_label: string
  needsVtpm: boolean
  nicType?: string
  notes?: string
  os_version: Record<string, string> | null
  other: Record<string, string>
  parent?: XoVm['id']
  power_state: VM_POWER_STATE
  pvDriversDetected?: boolean
  pvDriversUpToDate?: boolean
  pvDriversVersion?: string
  resourceSet?: string
  secureBoot: boolean
  snapshots: XoVmSnapshot['id'][]
  startDelay: number
  startTime?: number | null
  suspendSr?: XoSr['id']
  tags: string[]
  vga?: string
  videoram?: number
  viridian: boolean
  virtualizationMode: DOMAIN_TYPE
  xenStoreData: Record<string, string>
  /**
   * @deprecated use pvDriversVersion instead
   */
  xentools?:
    | false
    | {
        major: null | number
        minor: null | number
        version: null | string
      }
}

export type XoGroup = {
  id: Branded<'group'>
  name: string
  users: XoUser['id'][]
}

export type XoHost = {
  id: Branded<'host'>
  type: 'host'
}

export type XoPool = {
  id: Branded<'pool'>
  type: 'pool'
}

export type XoSr = {
  id: Branded<'SR'>
  type: 'SR'
}

export type XoUser = {
  authProviders?: Record<string, string>
  email: string
  groups: XoGroup['id'][]
  id: Branded<'user'>
  name: string
  permission: string
  pw_hash: string
  preferences: Record<string, string>
}

export type XoVbd = {
  id: Branded<'VBD'>
  type: 'VBDu'
}

export type XoVdi = {
  id: Branded<'VDI'>
  type: 'VDI'
}

export type XoVgpu = {
  id: Branded<'VGPU'>
  type: 'VGPU'
}

export type XoVif = {
  id: Branded<'VIF'>
  type: 'VIF'
}

export type XoVm = BaseXoVm & {
  id: Branded<'VM'>
  type: 'VM'
}

export type XoVmController = BaseXoVm & {
  id: Branded<'VM-controller'>
  type: 'VM-controller'
}

export type XoVmSnapshot = BaseXoVm & {
  $snapshot_of: XoVm['id']

  id: Branded<'VM-snapshot'>
  snapshot_time: number
  suspendVdi?: XoVdi['id']
  type: 'VM-snapshot'
}

export type XoVmTemplate = BaseXoVm & {
  id: Branded<'VM-template'>
  isDefaultTemplate: boolean
  template_info: {
    arch?: string
    disks: {
      bootable: true
      size: number
      SR: string
      type: string
    }[]
    install_methods: string[]
    install_repository?: string
  }
  type: 'VM-template'
}

export type XoVtpm = {
  id: Branded<'VTPM'>
  type: 'VTPM'
}

export type XoRecord =
  | XoGroup
  | XoHost
  | XoPool
  | XoSr
  | XoUser
  | XoVbd
  | XoVdi
  | XoVgpu
  | XoVif
  | XoVm
  | XoVmController
  | XoVmSnapshot
  | XoVtpm
