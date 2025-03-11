// Types based on xapi-object-to-xo

import type {
  Branded,
  DOMAIN_TYPE,
  HOST_ALLOWED_OPERATIONS,
  HOST_POWER_STATE,
  STORAGE_OPERATIONS,
  VM_OPERATIONS,
  VM_POWER_STATE,
} from './common.mjs'

type BaseXapiXo = {
  $pool: XoPool['id']
  /**
   * @deprecated use $pool instead
   */
  $poolId: XoPool['id']

  _xapiRef: string

  uuid: string
}

type BaseXoVm = BaseXapiXo & {
  $VBDs: XoVbd['id'][]
  $VGPUs: XoVgpu['id'][]

  $container: XoPool['id'] | XoHost['id']

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
    dynamic: number[]
    size: number
    static: number[]
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

export type XoHost = BaseXapiXo & {
  $PBDs: XoPbd['id'][]
  $PCIs: XoPci['id'][]
  $PGPUs: XoPgpu['id'][]
  $PIFs: XoPif['id'][]

  PCIs: XoPci['id'][]
  PGPUs: XoPgpu['id'][]
  PIFs: XoPif['id'][]
  /**
   * @deprecated use cpus instead
   */
  CPUs: Record<string, string>

  address?: string
  agentStartTime: null | number
  bios_string: Record<string, string>
  build: string
  certificates?: {
    fingerprint: string
    notAfter: number
  }
  chipset_info: {
    iommu?: boolean
  }
  controlDomain?: XoVm['id']
  cpus: {
    cores?: null | number
    sockets?: null | number
  }
  current_operations: Record<string, HOST_ALLOWED_OPERATIONS>
  enabled: boolean
  hostname?: string
  hvmCapable: boolean
  id: Branded<'host'>
  iscsiIqn: string
  license_expiry: null | number
  license_params: Record<string, string>
  license_server: Record<string, string>
  logging?: Record<string, string>
  memory: {
    size: number
    /**
     * @deprecated
     */
    total?: number
    usage: number
  }
  multipathing: boolean
  name_description: string
  name_label: string
  otherConfig: Record<string, string>
  /**
   * @deprecated
   */
  patches: XoHostPatch['id'][]
  power_state: HOST_POWER_STATE
  powerOnMode: string
  productBrand: string
  rebootRequired: boolean
  residentVms: XoVm['id'][]
  startTime: null | number
  supplementalPacks:
    | {
        author: string
        description: string
        guidance: string
        hosts: XoHost['id'][]
        name: string
        size: number
        version: string
        vdi: XoVdi['id']
      }[]
    | {
        author: string
        description: string
        name: string
        version: string
      }[]
  tags: string[]
  type: 'host'
  version: string
  zstdSupported: boolean
}

export type XoHostPatch = BaseXapiXo & {
  id: Branded<'host_patch'>
  type: 'host_patch'
}

export type XoPbd = BaseXapiXo & {
  id: Branded<'PBD'>
  type: 'PBD'
}

export type XoPci = BaseXapiXo & {
  id: Branded<'PCI'>
  type: 'PCI'
}

export type XoPgpu = BaseXapiXo & {
  id: Branded<'PGPU'>
  type: 'PGPU'
}

export type XoPif = BaseXapiXo & {
  id: Branded<'PIF'>
  type: 'PIF'
}

export type XoPool = BaseXapiXo & {
  id: Branded<'pool'>
  type: 'pool'
}

export type XoSr = BaseXapiXo & {
  $PBDs: XoPbd['id'][]

  $container: XoPool['id'] | XoHost['id']

  VDIs: XoVdi['id'][]

  allocationStrategy: 'thin' | 'thick' | 'unknown'
  content_type?: string
  current_operations: Record<string, STORAGE_OPERATIONS>
  id: Branded<'SR'>
  inMaintenanceMode: boolean
  name_description: string
  name_label: string
  other_config: Record<string, string>
  physical_usage: number | null
  shared: boolean
  size: number | null
  sm_config: Record<string, string>
  SR_type?: string
  tags: string[]
  type: 'SR'
  usage: number | null
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

export type XoVbd = BaseXapiXo & {
  id: Branded<'VBD'>
  type: 'VBD'
}

export type XoVdi = BaseXapiXo & {
  id: Branded<'VDI'>
  type: 'VDI'
}

export type XoVgpu = BaseXapiXo & {
  id: Branded<'VGPU'>
  type: 'VGPU'
}

export type XoVif = BaseXapiXo & {
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

export type XoVtpm = BaseXapiXo & {
  id: Branded<'VTPM'>
  type: 'VTPM'
}

export type XapiXoRecord =
  | XoHost
  | XoPool
  | XoSr
  | XoVbd
  | XoVdi
  | XoVgpu
  | XoVif
  | XoVm
  | XoVmController
  | XoVmSnapshot
  | XoVmTemplate
  | XoVtpm

export type XoRecord = XapiXoRecord | XoGroup | XoUser
