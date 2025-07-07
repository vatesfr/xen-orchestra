// Types based on xapi-object-to-xo

import type {
  BACKUP_TYPE,
  Branded,
  DOMAIN_TYPE,
  HOST_ALLOWED_OPERATIONS,
  HOST_POWER_STATE,
  IP_CONFIGURATION_MODE,
  IPV6_CONFIGURATION_MODE,
  NETWORK_OPERATIONS,
  PGPU_DOM0_ACCESS,
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

export type XoBackupRepository = {
  benchmarks?: { readRate: number; timestamp: number; writeRate: number }[]
  enabled: boolean
  error?: Record<string, unknown>
  id: Branded<'backup-repository'>
  name: string
  options?: string
  proxy?: XoProxy['id']
  url: string
}

export type XoGpuGroup = BaseXapiXo & {
  id: Branded<'gpu-group'>
  type: 'gpuGroup'
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
  $host?: XoHost['id']

  class_name: string
  device_name: string
  id: Branded<'PCI'>
  pci_id: string
  type: 'PCI'
}

export type XoPgpu = BaseXapiXo & {
  $host: XoHost['id']
  $vgpus: XoVgpu['id'][]

  dom0Access: PGPU_DOM0_ACCESS
  enabledVgpuTypes: XoVgpuType['id'][]
  gpuGroup?: XoGpuGroup['id']
  host: XoHost['id']
  id: Branded<'PGPU'>
  isSystemDisplayDevice: boolean
  pci?: XoPci['id']
  // it seems that supportedVgpuMaxCapcities always return undefined (See: xapi-objet-to-xo)
  /**
   * @deprecated
   */
  supportedVgpuMaxCapcities?: never
  supportedVgpuTypes: XoVgpuType['id'][]
  type: 'PGPU'
  vgpus: XoVgpu['id'][]
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

export type XoProxy = {
  id: Branded<'proxy'>
}

type BaseXoJob = {
  id: Branded<'job'>
}
// @TODO: create type for complex matcher
export type XoBackupJob = BaseXoJob & {
  compression?: 'native' | 'zstd' | ''
  proxy?: XoProxy['id']
  mode: 'full' | 'delta'
  name?: string
  remotes?: {
    id: XoBackupRepository['id'] | { __or: XoBackupRepository['id'][] }
  }
  vms?: {
    id: XoVm['id'] | { __or: XoVm['id'][] } | Record<string, unknown>
  }
  srs: {
    id: XoSr['id'] | { __or: XoSr['id'][] }
  }
  type: BACKUP_TYPE
  settings: {
    '': {
      cbtDestroySnapshotData?: boolean
      concurrency?: number
      longTermRetention?: {
        daily?: { retention: number; settings: Record<string, unknown> }
        weekly?: { retention: number; settings: Record<string, unknown> }
        monthly?: { retention: number; settings: Record<string, unknown> }
        yearly?: { retention: number; settings: Record<string, unknown> }
      }
      maxExportRate?: number
      nbdConcurrency?: number
      nRetriesVmBackupFailures?: number
      preferNbd?: boolean
      timezone?: string
      [key: string]: unknown
    }
    [key: XoSchedule['id']]: {
      exportRetention?: number
      healthCheckSr?: XoSr['id']
      healthCheckVmsWithTags?: string[]
      fullInterval?: number
      copyRetention?: number
      snapshotRetention?: number
      cbtDestroySnapshotData?: boolean
      [key: string]: unknown
    }
  }
}
export type XoJob = BaseXoJob & {}

export type XoSchedule = {
  cron: string
  enabled: boolean
  id: Branded<'schedule'>
  jobId: (XoJob | XoBackupJob)['id']
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

  VDIs: AnyXoVdi['id'][]

  allocationStrategy: 'thin' | 'thick' | 'unknown'
  content_type: string
  current_operations: Record<string, STORAGE_OPERATIONS>
  id: Branded<'SR'>
  inMaintenanceMode: boolean
  name_description: string
  name_label: string
  other_config: Record<string, string>
  physical_usage: number
  shared: boolean
  size: number
  sm_config: Record<string, string>
  SR_type: string
  tags: string[]
  type: 'SR'
  usage: number
}

export type XoSm = BaseXapiXo & {
  id: Branded<'SM'>

  SM_type: string
  vendor: string
  name_label: string
  name_description: string
  configuration: Record<string, string>
  features: Record<string, number>
  driver_filename: string
  required_cluster_stack: string[]
  supported_image_formats: string[]
  type: 'SM'
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
  VDI: AnyXoVdi['id']
  VM: AnyXoVm['id']
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
  image_format?: string
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
  type: 'vgpu'
}

export type XoVgpuType = BaseXapiXo & {
  id: Branded<'vgpu-type'>
  type: 'vgpuType'
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
  | XoGpuGroup
  | XoHost
  | XoMessage
  | XoNetwork
  | XoPci
  | XoPgpu
  | XoPif
  | XoPool
  | XoSr
  | XoVbd
  | XoVdi
  | XoVdiSnapshot
  | XoVdiUnmanaged
  | XoVgpu
  | XoVgpuType
  | XoVif
  | XoVm
  | XoVmController
  | XoVmSnapshot
  | XoVmTemplate
  | XoVtpm
  | XoSm

export type NonXapiXoRecord = XoGroup | XoProxy | XoJob | XoBackupRepository | XoSchedule | XoServer | XoUser

export type XoRecord = XapiXoRecord | NonXapiXoRecord

export type AnyXoVm = XoVm | XoVmSnapshot | XoVmTemplate | XoVmController

export type AnyXoVdi = XoVdi | XoVdiSnapshot | XoVdiUnmanaged

export type AnyXoJob = XoJob | XoBackupJob
