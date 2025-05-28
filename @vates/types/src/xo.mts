// Types based on xapi-object-to-xo

import type {
  Branded,
  DOMAIN_TYPE,
  HOST_ALLOWED_OPERATIONS,
  HOST_POWER_STATE,
  IP_CONFIGURATION_MODE,
  IPV6_CONFIGURATION_MODE,
  NETWORK_OPERATIONS,
  POOL_ALLOWED_OPERATIONS,
  PRIMARY_ADDRESS_TYPE,
  STORAGE_OPERATIONS,
  VDI_OPERATIONS,
  VDI_TYPE,
  VIF_LOCKING_MODE,
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
  cpuCap?: number
  cpuMask?: number[]
  cpuWeight?: number
  creation: Record<string, string>
  current_operations: Record<string, VM_OPERATIONS>
  docker?: {
    containers?: string[]
    enabled: boolean
    info?: string
    /** @deprecated */
    process?: string
    version?: string
  }
  /**
   * @deprecated use isNestedVirtEnabled instead
   */
  expNestedHvm: boolean
  isNestedVirtEnabled: boolean
  hasVendorDevice: boolean
  high_availability: string
  installTime?: number
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
  startTime?: number
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

export type XoAlarm = Omit<XoMessage, '$object' | 'body'> & {
  body: {
    value: string
    name: string
  }
  object: {
    type: XapiXoRecord['type'] | 'unknown'
    uuid: XapiXoRecord['uuid']
    href?: string
  }
}

export type XoGroup = {
  id: Branded<'group'>
  name: string
  provider?: string
  providerGroupId?: string
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

  address: string
  agentStartTime: null | number
  bios_string: Record<string, string>
  build: string
  certificates?: {
    fingerprint: string
    notAfter: number
  }[]
  chipset_info: {
    iommu?: boolean
  }
  controlDomain?: XoVm['id']
  cpus: {
    cores?: number
    sockets?: number
  }
  current_operations: Record<string, HOST_ALLOWED_OPERATIONS>
  enabled: boolean
  hostname: string
  hvmCapable: boolean
  id: Branded<'host'>
  iscsiIqn: string
  license_expiry: null | number
  license_params: Record<string, string>
  license_server: Record<string, string>
  logging: Record<string, string>
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

export type XoMessage = BaseXapiXo & {
  $object: XapiXoRecord['id']

  body: string
  id: Branded<'message'>
  name: string
  time: number
  type: 'message'
}

export type XoNetwork = BaseXapiXo & {
  MTU: number
  PIFs: XoPif['id'][]
  VIFs: XoVif['id'][]

  automatic: boolean
  bridge: string
  current_operations: Record<string, NETWORK_OPERATIONS>
  defaultIsLocked: boolean
  id: Branded<'network'>
  insecureNbd?: boolean
  name_description: string
  name_label: string
  nbd?: boolean
  other_config: Record<string, string>
  tags: string[]
  type: 'network'
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
  $host: XoHost['id']
  $network: XoNetwork['id']

  attached: boolean
  bondMaster?: XoPif['id']
  bondSalves?: XoPif['id'][]
  carrier: boolean
  device: string
  deviceName?: string
  disallowUnplug: boolean
  dns: string
  gateway: string
  id: Branded<'PIF'>
  ip: string
  ipv6: string[]
  ipv6Mode: IPV6_CONFIGURATION_MODE
  isBondMaster: boolean
  isBondSlave: boolean
  mac: string
  management: boolean
  mode: IP_CONFIGURATION_MODE
  mtu: number
  netmask: string
  physical: boolean
  primaryAddressType: PRIMARY_ADDRESS_TYPE
  speed?: number
  type: 'PIF'
  vlan: number
}

export type XoPool = BaseXapiXo & {
  auto_poweron: boolean
  cpus: {
    cores?: number
    sockets?: number
  }
  crashDumpSr?: XoSr['id']
  current_operations: Record<string, POOL_ALLOWED_OPERATIONS>
  defaultSr?: XoSr['id']
  HA_enabled: boolean
  haSrs: XoSr['id'][]
  id: Branded<'pool'>
  master: XoHost['id']
  migrationCompression?: boolean
  name_description: string
  name_label: string
  otherConfig: Record<string, string>
  platform_version: string
  suspendSr?: XoSr['id']
  tags: string[]
  type: 'pool'
  vtpmSupported: boolean
  xosanPackInstallationTime: number | null
  zstdSupported: boolean
}

export type XoJob = {
  id: Branded<'job'>
}

export type XoSchedule = {
  cron: string
  enable: boolean
  id: Branded<'schedule'>
  jobId: XoJob['id']
  name?: string
  timezone?: string
}

export type XoServer = {
  allowUnauthorized: boolean
  enabled: boolean
  error?: Record<string, unknown>
  host: string
  httpProxy?: string
  id: Branded<'server'>
  label?: string
  master?: XoHost['id']
  poolId?: XoPool['id']
  poolNameDescription?: string
  poolNameLabel?: string
  readOnly: boolean
  status: 'connected' | 'disconnected' | 'connecting'
  username: string
}

export type XoSr = BaseXapiXo & {
  $PBDs: XoPbd['id'][]

  $container: XoPool['id'] | XoHost['id']

  VDIs: XoVdi['id'][]

  allocationStrategy: 'thin' | 'thick' | 'unknown'
  content_type: string
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
  SR_type: string
  tags: string[]
  type: 'SR'
  usage: number
}

export type XoUser = {
  authProviders?: Record<string, string>
  email: string
  groups: XoGroup['id'][]
  id: Branded<'user'>
  name?: string
  permission: string
  pw_hash?: string
  preferences: Record<string, string>
}

export type XoVbd = BaseXapiXo & {
  attached: boolean
  bootable: boolean
  device: string | null
  id: Branded<'VBD'>
  is_cd_drive: boolean
  position: string
  read_only: boolean
  type: 'VBD'
  VDI: XoVdi['id']
  VM: XoVm['id']
}

type BaseXoVdi = BaseXapiXo & {
  $SR: XoSr['id']
  $VBDs: XoVbd['id'][]

  VDI_type: VDI_TYPE

  cbt_enabled?: boolean
  current_operations: Record<string, VDI_OPERATIONS>
  missing: boolean
  name_description: string
  name_label: string
  other_config: Record<string, string>
  parent?: XoVdiUnmanaged['id']
  size: number
  snapshots: XoVdiSnapshot['id'][]
  tags: string[]
  usage: number
}

export type XoVdi = BaseXoVdi & {
  id: Branded<'VDI'>
  type: 'VDI'
}

export type XoVdiSnapshot = BaseXoVdi & {
  id: Branded<'VDI-snapshot'>
  snapshot_time: number
  $snapshot_of?: XoVdi['id']
  type: 'VDI-snapshot'
}

export type XoVdiUnmanaged = BaseXoVdi & {
  id: Branded<'VDI-unmanaged'>
  type: 'VDI-unmanaged'
}

export type XoVgpu = BaseXapiXo & {
  id: Branded<'VGPU'>
  type: 'VGPU'
}

export type XoVif = BaseXapiXo & {
  $VM: XoVm['id']

  $network: XoNetwork['id']

  allowedIpv4Addresses: string[]
  allowedIpv6Addresses: string[]
  attached: boolean
  device: string
  id: Branded<'VIF'>
  lockingMode: VIF_LOCKING_MODE
  MAC: string
  MTU: number
  other_config: Record<string, string>
  /**
   * In kB/s
   */
  rateLimit?: number
  txChecksumming: boolean
  type: 'VIF'
}

export type XoVm = BaseXoVm & {
  id: Branded<'VM'>
  type: 'VM'
  vulnerabilities: { xsa468: boolean | { reason: string; driver?: string; version?: string } }
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
  | XoAlarm
  | XoHost
  | XoMessage
  | XoNetwork
  | XoPif
  | XoPool
  | XoSr
  | XoVbd
  | XoVdi
  | XoVdiSnapshot
  | XoVdiUnmanaged
  | XoVgpu
  | XoVif
  | XoVm
  | XoVmController
  | XoVmSnapshot
  | XoVmTemplate
  | XoVtpm

export type NonXapiXoRecord = XoGroup | XoJob | XoSchedule | XoServer | XoUser

export type XoRecord = XapiXoRecord | NonXapiXoRecord
