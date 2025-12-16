// Types based on xapi-object-to-xo

import type {
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
import type * as CMType from './lib/complex-matcher.mjs'
import type { XenApiHost, XenApiPool } from './xen-api.mjs'

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
    value?: string
    name: string
  }
  object: {
    type: XapiXoRecord['type'] | 'unknown'
    uuid: XapiXoRecord['uuid']
    href?: string
  }
}

// TODO: to be typed when Bastien.N has finished working on the XO task
type BaseXoLog = {
  id: Branded<'xo-log'>
  infos?: { data: unknown; message: string }[]
  [key: string]: unknown
}
export type XoBackupLog = BaseXoLog & {
  status: 'success' | 'skipped' | 'interrupted' | 'failure' | 'pending'
  message: 'backup'
  start: number
  end?: number
  tasks?: XoTask[]
  jobId?: AnyXoBackupJob['id']
}
export type XoRestoreLog = BaseXoLog & {
  message: 'restore'
}
export type XoVmBackupArchive = {
  id: Branded<'vm-backup-archive'>
  type: 'xo-vm-backup'
  backupRepository: XoBackupRepository['id']
  disks: { id: string; name: string; uuid: XoVdiSnapshot['uuid'] }[]
  isImmutable?: boolean
  jobId: XoVmBackupJob['id']
  mode: XoVmBackupJob['mode']
  scheduleId: XoSchedule['id']
  size: number
  timestamp: number
  vm: {
    uuid: XoVm['uuid']
    name_description: string
    name_label: string
    tags: XoVm['tags']
  }
  differencingVhds?: number
  dynamicVhds?: number
  withMemory: boolean
}

type XoMetadataBackupArchive = {
  id: Branded<'metadata-backup-archive'>
  backupRepository: XoBackupRepository['id']
  jobId: XoVmBackupJob['id']
  jobName: XoVmBackupJob['name']
  scheduleId: XoSchedule['id']
  scheduleName: XoSchedule['name']
  timestamp: number
}
export type XoConfigBackupArchive = XoMetadataBackupArchive & {
  id: Branded<'config-backup-archive'>
  data: string
  type: 'xo-config-backup'
}

export type XoPoolBackupArchive = XoMetadataBackupArchive & {
  id: Branded<'pool-backup-archive'>
  pool: XenApiPool
  poolMaster: XenApiHost
  type: 'xo-pool-metadata-backup'
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
  bios_strings: Record<string, string>
  build: string
  certificates?: {
    fingerprint: string
    notAfter: number
  }[]
  chipset_info: {
    iommu?: boolean
  }
  controlDomain?: XoVmController['id']
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
  attached: boolean
  device_config:
    | { device: string }
    | { location: string }
    | { path: string; location: string; legacy_mode: string }
    | { provisioning: string; redundancy: string; 'group-name': string }
    | { server: string; serverpath: string }
    | { type: string; location: string }
    | Record<string, string>
  host: XoHost['id']
  id: Branded<'PBD'>
  otherConfig: Record<string, string>
  SR: XoSr['id']
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
  bondSlaves?: XoPif['id'][]
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
  default_SR?: XoSr['id']
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
  zstdSupported: boolean
}

export type XoProxy = {
  id: Branded<'proxy'>
  url: string
  version?: string
  name: string
} & (
  | { address?: undefined; vmUuid: XoVm['id'] }
  | { address: string; vmUuid?: undefined }
  | { address: string; vmUuid: XoVm['id'] }
)

type BaseXoJob = {
  id: Branded<'job'>
  name?: string
}

type XoBackupJobGeneralSettings = {
  backupReportTpl?: 'compactMjml' | 'mjml'
  reportWhen?: 'always' | 'error' | 'failure' | 'never'
  reportRecipients?: string[]
  hideSuccessfulItems?: boolean
  [key: string]: unknown
}

export type XoVmBackupJobGeneralSettings = XoBackupJobGeneralSettings & {
  cbtDestroySnapshotData?: boolean
  concurrency?: number
  longTermRetention?: {
    daily?: { retention: number; settings: Record<string, unknown> }
    weekly?: { retention: number; settings: Record<string, unknown> }
    monthly?: { retention: number; settings: Record<string, unknown> }
    yearly?: { retention: number; settings: Record<string, unknown> }
  }
  checkpointSnapshot?: boolean
  offlineSnapshot?: boolean
  maxExportRate?: number
  nbdConcurrency?: number
  nRetriesVmBackupFailures?: number
  preferNbd?: boolean
  timezone?: string
  mergeBackupsSynchronously?: boolean
  offlineBackup?: boolean
  timeout?: number
}
export type XoVmBackupJobScheduleSettings = {
  exportRetention?: number
  healthCheckVmsWithTags?: XoVm['tags']
  fullInterval?: number
  copyRetention?: number
  snapshotRetention?: number
  cbtDestroySnapshotData?: boolean
  healthCheckSr?: XoSr['id']
  [key: string]: unknown
}
export type XoVmBackupJob = BaseXoJob & {
  compression?: 'native' | 'zstd' | ''
  proxy?: XoProxy['id']
  mode: 'full' | 'delta'
  remotes?: CMType.IdOr<XoBackupRepository['id']>
  vms: CMType.IdOr<XoVm['id']> | Record<string, unknown>
  srs?: CMType.IdOr<XoSr['id']>
  type: 'backup'
  settings: {
    '': XoVmBackupJobGeneralSettings
    [key: XoSchedule['id']]: XoVmBackupJobScheduleSettings | undefined
  }
}

export type XoMetadataBackupJobGeneralSettings = XoBackupJobGeneralSettings
export type XoMetadataBackupJobScheduleSettings = {
  retentionPoolMetadata?: number
  retentionXoMetadata?: number
  [key: string]: unknown
}
export type XoMetadataBackupJob = BaseXoJob & {
  type: 'metadataBackup'
  pools?: CMType.IdOr<XoPool['id']>
  remotes: CMType.IdOr<XoBackupRepository['id']>
  settings: {
    ''?: XoMetadataBackupJobGeneralSettings
    [scheduleId: XoSchedule['id']]: XoMetadataBackupJobScheduleSettings | undefined
  }
  xoMetadata?: boolean
  userId: XoUser['id']
  proxy?: XoProxy['id']
}

export type XoMirrorBackupGeneralSettings = XoBackupJobGeneralSettings & {
  concurrency?: number
  nRetriesVmBackupFailures?: number
  mergeBackupsSynchronously?: boolean
  timeout?: number
  maxExportRate?: number
  backupReportTpl?: 'compactMjml'
  reportWhen: 'failure'
}
export type XoMirrorBackupScheduleSettings = {
  exportRetention?: number
  healthCheckVmsWithTags?: XoVm['tags']
  healthCheckSr?: XoSr['id']
  [key: string]: unknown
}
export type XoMirrorBackupJob = BaseXoJob & {
  type: 'mirrorBackup'
  mode: 'full' | 'delta'
  sourceRemote: XoBackupRepository['id']
  remotes: CMType.IdOr<XoBackupRepository['id']>
  proxy?: XoProxy['id']
  settings: {
    '': XoMirrorBackupGeneralSettings
    [scheduleId: XoSchedule['id']]: XoMirrorBackupScheduleSettings | undefined
  }
}

export type XoJob = BaseXoJob & {
  type: 'call'
}

export type XoSchedule = {
  cron: string
  enabled: boolean
  id: Branded<'schedule'>
  jobId: AnyXoJob['id']
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

  allocationStrategy?: 'thin' | 'thick' | 'unknown'
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

export type XoTask = {
  abortionRequestedAt?: number
  data?: Record<string, string>
  end?: number
  id: Branded<'task'>
  infos?: { data: unknown; message: string }[]
  progress?: number
  properties: {
    method?: string
    name?: string
    objectId?: string
    params?: Record<string, unknown>
    progress?: number
    type?: string
    userId?: string
    [key: string]: unknown | undefined
  }
  result: Record<string, unknown>
  start: number
  status: 'failure' | 'interrupted' | 'pending' | 'success'
  tasks?: XoTask[]
  updatedAt?: number
  warnings?: { data: unknown; message: string }[]
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

export type XoAuthenticationToken = {
  client?: {
    id: string
    [key: string]: unknown
  }
  created_at?: number
  description?: string
  user_id: XoUser['id']
  expiration: number
  last_uses?: Record<string, { timestamp: number }>
  id: Branded<'authentication-token'>
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
  VDI?: XoVdi['id'] | XoVdiSnapshot['id']
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

export type XoVdiUnmanaged = Omit<BaseXoVdi, '$VBDs'> & {
  id: Branded<'VDI-unmanaged'>
  type: 'VDI-unmanaged'

  /**
   * Unmanaged VDI have no VBDs
   */
  $VBDs: never[]
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
  | XoPbd
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

export type NonXapiXoRecord =
  | AnyXoBackupArchive
  | AnyXoJob
  | AnyXoLog
  | XoGroup
  | XoProxy
  | XoGroup
  | XoProxy
  | XoJob
  | XoBackupRepository
  | XoSchedule
  | XoServer
  | XoTask
  | XoUser

export type XoRecord = XapiXoRecord | NonXapiXoRecord

export type AnyXoVm = XoVm | XoVmSnapshot | XoVmTemplate | XoVmController

export type AnyXoVdi = XoVdi | XoVdiSnapshot | XoVdiUnmanaged

export type AnyXoJob = XoJob | AnyXoBackupJob

export type AnyXoBackupJob = XoVmBackupJob | XoMetadataBackupJob | XoMirrorBackupJob

export type AnyXoLog = XoBackupLog | XoRestoreLog

export type AnyXoBackupArchive = XoVmBackupArchive | XoConfigBackupArchive | XoPoolBackupArchive
