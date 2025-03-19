/* eslint-disable no-use-before-define */

import type {
  ALLOCATION_ALGORITHM,
  BOND_MODE,
  DOMAIN_TYPE,
  HOST_OPERATION,
  IP_CONFIGURATION_MODE,
  IPV6_CONFIGURATION_MODE,
  NETWORK_DEFAULT_LOCKING_MODE,
  NETWORK_OPERATION,
  NETWORK_PURPOSE,
  ON_BOOT,
  ON_CRASH_BEHAVIOUR,
  ON_NORMAL_EXIT,
  ON_SOFTREBOOT_BEHAVIOR,
  PERSISTENCE_BACKEND,
  PGPU_DOM0_ACCESS,
  PIF_IGMP_STATUS,
  PRIMARY_ADDRESS_TYPE,
  SRIOV_CONFIGURATION_MODE,
  TUNNEL_PROTOCOL,
  UPDATE_GUIDANCE,
  VBD_MODE,
  VBD_OPERATION,
  VBD_TYPE,
  VDI_OPERATION,
  VDI_TYPE,
  VGPU_TYPE_IMPLEMENTATION,
  VIF_IPV4_CONFIGURATION_MODE,
  VIF_IPV6_CONFIGURATION_MODE,
  VIF_LOCKING_MODE,
  VIF_OPERATION,
  VM_APPLIANCE_OPERATION,
  VM_OPERATION,
  VM_POWER_STATE,
  VMPP_ARCHIVE_FREQUENCY,
  VMPP_ARCHIVE_TARGET_TYPE,
  VMPP_BACKUP_FREQUENCY,
  VMPP_BACKUP_TYPE,
  VMSS_FREQUENCY,
  VMSS_TYPE,
  VTPM_OPERATION,
  VUSB_OPERATION,
} from '@/libs/xen-api/xen-api.enums'
import type { XEN_API_OBJECT_TYPES } from '@/libs/xen-api/xen-api.utils'

type TypeMapping = typeof XEN_API_OBJECT_TYPES
export type ObjectType = keyof TypeMapping
export type RawObjectType = TypeMapping[ObjectType]

export type RawTypeToType<RawType extends RawObjectType> = Lowercase<RawType>
export type TypeToRawType<Type extends ObjectType> = TypeMapping[Type]

type ObjectTypeToRecordMapping = {
  bond: XenApiBond
  console: XenApiConsole
  host: XenApiHost
  host_metrics: XenApiHostMetrics
  message: XenApiMessage<any>
  network: XenApiNetwork
  pif: XenApiPif
  pif_metrics: XenApiPifMetrics
  pool: XenApiPool
  sr: XenApiSr
  vif: XenApiVif
  vm: XenApiVm
  vm_guest_metrics: XenApiVmGuestMetrics
  vm_metrics: XenApiVmMetrics
}

export type ObjectTypeToRecord<Type extends ObjectType> = Type extends keyof ObjectTypeToRecordMapping
  ? ObjectTypeToRecordMapping[Type]
  : never

export type XenApiRecordBeforeLoadEvent<Type extends ObjectType> = `${Type}.beforeLoad`
export type XenApiRecordAfterLoadEvent<Type extends ObjectType> = `${Type}.afterLoad`
export type XenApiRecordLoadErrorEvent<Type extends ObjectType> = `${Type}.loadError`
export type XenApiRecordAddEvent<Type extends ObjectType> = `${Type}.add`
export type XenApiRecordModEvent<Type extends ObjectType> = `${Type}.mod`
export type XenApiRecordDelEvent<Type extends ObjectType> = `${Type}.del`
export type XenApiRecordEvent<Type extends ObjectType> =
  | XenApiRecordBeforeLoadEvent<Type>
  | XenApiRecordAfterLoadEvent<Type>
  | XenApiRecordLoadErrorEvent<Type>
  | XenApiRecordAddEvent<Type>
  | XenApiRecordModEvent<Type>
  | XenApiRecordDelEvent<Type>

declare const __brand: unique symbol

export type RecordRef<Type extends ObjectType> = string & { [__brand]: `${Type}Ref` }
export type RecordUuid<Type extends ObjectType> = string & { [__brand]: `${Type}Uuid` }

export interface XenApiRecord<Type extends ObjectType> {
  $ref: RecordRef<Type>
  uuid: RecordUuid<Type>
}

export type RawXenApiRecord<T extends XenApiRecord<ObjectType>> = Omit<T, '$ref'>

export interface XenApiPool extends XenApiRecord<'pool'> {
  cpu_info: {
    cpu_count: string
  }
  master: XenApiHost['$ref']
  name_label: string
  other_config: Record<string, string>
}

export interface XenApiHost extends XenApiRecord<'host'> {
  address: string
  name_label: string
  metrics: XenApiHostMetrics['$ref']
  resident_VMs: XenApiVm['$ref'][]
  cpu_info: { cpu_count: string }
  software_version: { product_version: string }
  control_domain: XenApiVm['$ref']
  current_operations: Record<string, HOST_OPERATION>
}

export interface XenApiSr extends XenApiRecord<'sr'> {
  content_type: string
  name_label: string
  physical_size: number
  physical_utilisation: number
  shared: boolean
  sm_config: {
    type?: string
  }
}

export interface XenApiVm extends XenApiRecord<'vm'> {
  HVM_boot_params: Record<string, string>
  HVM_boot_policy: string
  HVM_shadow_multiplier: number
  NVRAM: Record<string, string>
  PCI_bus: string
  PV_args: string
  PV_bootloader: string
  PV_bootloader_args: string
  PV_kernel: string
  PV_legacy_args: string
  PV_ramdisk: string
  VBDs: XenApiVbd['$ref'][]
  VCPUs_at_startup: number
  VCPUs_max: number
  VCPUs_params: Record<string, string>
  VGPUs: XenApiVgpu['$ref'][]
  VIFs: XenApiVif['$ref'][]
  VTPMs: XenApiVtpm['$ref'][]
  VUSBs: XenApiVusb['$ref'][]
  actions_after_crash: ON_CRASH_BEHAVIOUR
  actions_after_reboot: ON_NORMAL_EXIT
  actions_after_shutdown: ON_NORMAL_EXIT
  actions_after_softreboot: ON_SOFTREBOOT_BEHAVIOR
  affinity: XenApiHost['$ref']
  allowed_operations: VM_OPERATION[]
  appliance: XenApiVmAppliance['$ref']
  attached_PCIs: XenApiPci['$ref'][]
  bios_strings: Record<string, string>
  blobs: Record<string, XenApiBlob['$ref']>
  blocked_operations: Record<VM_OPERATION, string>
  children: XenApiVm['$ref'][]
  consoles: XenApiConsole['$ref'][]
  crash_dumps: XenApiCrashdump['$ref'][]
  current_operations: Record<string, VM_OPERATION>
  domain_type: DOMAIN_TYPE
  domarch: string
  domid: number
  generation_id: string
  guest_metrics: XenApiVmGuestMetrics['$ref']
  ha_always_run: boolean
  ha_restart_priority: string
  hardware_platform_version: number
  has_vendor_device: boolean
  is_a_snapshot: boolean
  is_a_template: boolean
  is_control_domain: boolean
  is_default_template: boolean
  is_snapshot_from_vmpp: boolean
  is_vmss_snapshot: boolean
  last_boot_CPU_flags: Record<string, string>
  last_booted_record: string
  memory_dynamic_max: number
  memory_dynamic_min: number
  memory_overhead: number
  memory_static_max: number
  memory_static_min: number
  memory_target: number
  metrics: XenApiVmMetrics['$ref']
  name_description: string
  name_label: string
  order: number
  other_config: Record<string, string>
  parent: XenApiVm['$ref']
  pending_guidances: UPDATE_GUIDANCE[]
  platform: Record<string, string>
  power_state: VM_POWER_STATE
  protection_policy: XenApiVmpp['$ref']
  recommendations: string
  reference_label: string
  requires_reboot: boolean
  resident_on: XenApiHost['$ref']
  scheduled_to_be_resident_on: XenApiHost['$ref']
  shutdown_delay: number
  snapshot_info: Record<string, string>
  snapshot_metadata: string
  snapshot_of: XenApiVm['$ref']
  snapshot_schedule: XenApiVmss['$ref']
  snapshot_time: string
  snapshots: XenApiVm['$ref'][]
  start_delay: number
  suspend_SR: XenApiSr['$ref']
  suspend_VDI: XenApiVdi['$ref']
  tags: string[]
  transportable_snapshot_id: string
  user_version: number
  version: number
  xenstore_data: Record<string, string>
}

export interface XenApiVtpm extends XenApiRecord<'vtpm'> {
  VM: XenApiVm['$ref']
  allowed_operations: VTPM_OPERATION[]
  backend: XenApiVm['$ref']
  current_operations: Record<string, VTPM_OPERATION>
  is_protected: boolean
  is_unique: boolean
  persistence_backend: PERSISTENCE_BACKEND
}

export interface XenApiVusb extends XenApiRecord<'vusb'> {
  USB_group: XenApiUsbGroup['$ref']
  VM: XenApiVm['$ref']
  allowed_operations: VUSB_OPERATION[]
  current_operations: Record<string, VUSB_OPERATION>
  currently_attached: boolean
  other_config: Record<string, string>
}

export interface XenApiUsbGroup extends XenApiRecord<'usb_group'> {
  PUSBs: XenApiPusb['$ref'][]
  VUSBs: XenApiVusb['$ref'][]
  name_description: string
  name_label: string
  other_config: Record<string, string>
}

export interface XenApiPusb extends XenApiRecord<'pusb'> {
  USB_group: XenApiUsbGroup['$ref']
  description: string
  host: XenApiHost['$ref']
  other_config: Record<string, string>
  passthrough_enabled: boolean
  path: string
  product_desc: string
  product_id: string
  serial: string
  speed: number
  vendor_desc: string
  vendor_id: string
  version: string
}

export interface XenApiVgpu extends XenApiRecord<'vgpu'> {
  GPU_group: XenApiGpuGroup['$ref']
  PCI: XenApiPci['$ref']
  VM: XenApiVm['$ref']
  compatibility_metadata: Record<string, string>
  currently_attached: boolean
  device: string
  extra_args: string
  other_config: Record<string, string>
  resident_on: XenApiPgpu['$ref']
  scheduled_to_be_resident_on: XenApiPgpu['$ref']
  type: XenApiVgpuType['$ref']
}

export interface XenApiGpuGroup extends XenApiRecord<'gpu_group'> {
  GPU_types: string[]
  PGPUs: XenApiPgpu['$ref'][]
  VGPUs: XenApiVgpu['$ref'][]
  allocation_algorithm: ALLOCATION_ALGORITHM
  enabled_VGPU_types: XenApiVgpuType['$ref'][]
  name_description: string
  name_label: string
  other_config: Record<string, string>
  supported_VGPU_types: XenApiVgpuType['$ref'][]
}

export interface XenApiPgpu extends XenApiRecord<'pgpu'> {
  GPU_group: XenApiGpuGroup['$ref']
  PCI: XenApiPci['$ref']
  compatibility_metadata: Record<string, string>
  dom0_access: PGPU_DOM0_ACCESS
  enabled_VGPU_types: XenApiVgpuType['$ref'][]
  host: XenApiHost['$ref']
  is_system_display_device: boolean
  other_config: Record<string, string>
  resident_VGPUs: XenApiVgpu['$ref'][]
  supported_VGPU_max_capacities: Record<XenApiVgpuType['$ref'], number>
  supported_VGPU_types: XenApiVgpuType['$ref'][]
}

export interface XenApiVgpuType extends XenApiRecord<'vgpu_type'> {
  VGPUs: XenApiVgpu['$ref'][]
  compatible_types_in_vm: XenApiVgpuType['$ref'][]
  enabled_on_GPU_groups: XenApiGpuGroup['$ref'][]
  enabled_on_PGPUs: XenApiPgpu['$ref'][]
  experimental: boolean
  framebuffer_size: number
  identifier: string
  implementation: VGPU_TYPE_IMPLEMENTATION
  max_heads: number
  max_resolution_x: number
  max_resolution_y: number
  model_name: string
  supported_on_GPU_groups: XenApiGpuGroup['$ref'][]
  supported_on_PGPUs: XenApiPgpu['$ref'][]
  vendor_name: string
}

export interface XenApiVmAppliance extends XenApiRecord<'vm_appliance'> {
  VMs: XenApiVm['$ref'][]
  allowed_operations: VM_APPLIANCE_OPERATION[]
  current_operations: Record<string, VM_APPLIANCE_OPERATION>
  name_description: string
  name_label: string
}

export interface XenApiVmpp extends XenApiRecord<'vmpp'> {
  VMs: XenApiVm['$ref'][]
  alarm_config: Record<string, string>
  archive_frequency: VMPP_ARCHIVE_FREQUENCY
  archive_last_run_time: string
  archive_schedule: Record<string, string>
  archive_target_config: Record<string, string>
  archive_target_type: VMPP_ARCHIVE_TARGET_TYPE
  backup_frequency: VMPP_BACKUP_FREQUENCY
  backup_last_run_time: string
  backup_retention_value: number
  backup_schedule: Record<string, string>
  backup_type: VMPP_BACKUP_TYPE
  is_alarm_enabled: boolean
  is_archive_running: boolean
  is_backup_running: boolean
  is_policy_enabled: boolean
  name_description: string
  name_label: string
  recent_alerts: string[]
}

export interface XenApiVmss extends XenApiRecord<'vmss'> {
  VMs: XenApiVm['$ref'][]
  enabled: boolean
  frequency: VMSS_FREQUENCY
  last_run_time: string
  name_description: string
  name_label: string
  retained_snapshots: number
  schedule: Record<string, string>
  type: VMSS_TYPE
}

export interface XenApiConsole extends XenApiRecord<'console'> {
  protocol: string
  location: string
}

export interface XenApiHostMetrics extends XenApiRecord<'host_metrics'> {
  live: boolean
  memory_free: number
  memory_total: number
}

export interface XenApiVmMetrics extends XenApiRecord<'vm_metrics'> {
  VCPUs_number: number
}

export interface XenApiVmGuestMetrics extends XenApiRecord<'vm_guest_metrics'> {
  networks: string
}

export interface XenApiTask extends XenApiRecord<'task'> {
  name_label: string
  resident_on: XenApiHost['$ref']
  created: string
  finished: string
  status: string
  progress: number
}

export interface XenApiMessage<RelationType extends RawObjectType> extends XenApiRecord<'message'> {
  body: string
  cls: RelationType
  name: string
  obj_uuid: ObjectTypeToRecord<RawTypeToType<RelationType>>['uuid']
  priority: number
  timestamp: string
}

export interface XenApiVbd extends XenApiRecord<'vbd'> {
  VDI: XenApiVdi['$ref']
  VM: XenApiVm['$ref']
  allowed_operations: VBD_OPERATION[]
  bootable: boolean
  current_operations: Record<string, VBD_OPERATION>
  currently_attached: boolean
  device: string
  empty: boolean
  metrics: XenApiVbdMetrics['$ref']
  mode: VBD_MODE
  other_config: Record<string, string>
  qos_algorithm_params: Record<string, string>
  qos_algorithm_type: string
  qos_supported_algorithms: string[]
  runtime_properties: Record<string, string>
  status_code: number
  status_detail: string
  storage_lock: boolean
  type: VBD_TYPE
  unpluggable: boolean
  userdevice: string
}

export interface XenApiVbdMetrics extends XenApiRecord<'vbd_metrics'> {
  io_read_kbs: number
  io_write_kbs: number
  last_updated: string
  other_config: Record<string, string>
}

export interface XenApiVdi extends XenApiRecord<'vdi'> {
  SR: XenApiSr['$ref']
  VBDs: XenApiVbd['$ref'][]
  allow_caching: boolean
  allowed_operations: VDI_OPERATION[]
  cbt_enabled: boolean
  crash_dumps: XenApiCrashdump['$ref'][]
  current_operations: Record<string, VDI_OPERATION>
  is_a_snapshot: boolean
  is_tools_iso: boolean
  location: string
  managed: boolean
  metadata_latest: boolean
  metadata_of_pool: XenApiPool['$ref']
  missing: boolean
  name_description: string
  name_label: string
  on_boot: ON_BOOT
  other_config: Record<string, string>
  parent: XenApiVdi['$ref']
  physical_utilisation: number
  read_only: boolean
  sharable: boolean
  sm_config: Record<string, string>
  snapshot_of: XenApiVdi['$ref']
  snapshot_time: string
  snapshots: XenApiVdi['$ref'][]
  storage_lock: boolean
  tags: string[]
  type: VDI_TYPE
  virtual_size: number
  xenstore_data: Record<string, string>
}

export interface XenApiCrashdump extends XenApiRecord<'crashdump'> {
  VDI: XenApiVdi['$ref']
  VM: XenApiVm['$ref']
  other_config: Record<string, string>
}

export interface XenApiNetwork extends XenApiRecord<'network'> {
  MTU: number
  PIFs: XenApiPif['$ref'][]
  VIFs: XenApiVif['$ref'][]
  allowed_operations: NETWORK_OPERATION[]
  assigned_ips: Record<XenApiVif['$ref'], string>
  blobs: Record<string, XenApiBlob['$ref']>
  bridge: string
  current_operations: Record<string, NETWORK_OPERATION>
  default_locking_mode: NETWORK_DEFAULT_LOCKING_MODE
  managed: boolean
  name_description: string
  name_label: string
  other_config: Record<string, string>
  purpose: NETWORK_PURPOSE[]
  tags: string[]
}

export interface XenApiBlob extends XenApiRecord<'blob'> {
  last_updated: string
  mime_type: string
  name_description: string
  name_label: string
  public: boolean
  size: number
}

export interface XenApiVif extends XenApiRecord<'vif'> {
  MAC: string
  MAC_autogenerated: boolean
  MTU: number
  VM: XenApiVm['$ref']
  allowed_operations: VIF_OPERATION[]
  current_operations: Record<string, VIF_OPERATION>
  currently_attached: boolean
  device: string
  ipv4_addresses: string[]
  ipv4_allowed: string[]
  ipv4_configuration_mode: VIF_IPV4_CONFIGURATION_MODE
  ipv4_gateway: string
  ipv6_addresses: string[]
  ipv6_allowed: string[]
  ipv6_configuration_mode: VIF_IPV6_CONFIGURATION_MODE
  ipv6_gateway: string
  locking_mode: VIF_LOCKING_MODE
  metrics: XenApiVifMetrics['$ref']
  network: XenApiNetwork['$ref']
  other_config: Record<string, string>
  qos_algorithm_params: Record<string, string>
  qos_algorithm_type: string
  qos_supported_algorithms: string[]
  runtime_properties: Record<string, string>
  status_code: number
  status_detail: string
}

export interface XenApiVifMetrics extends XenApiRecord<'vif_metrics'> {
  io_read_kbs: number
  io_write_kbs: number
  last_updated: string
  other_config: Record<string, string>
}

export interface XenApiPif extends XenApiRecord<'pif'> {
  DNS: string
  IP: string
  IPv6: string[]
  MAC: string
  MTU: number
  PCI: XenApiPci['$ref']
  VLAN: number
  VLAN_master_of: XenApiVlan['$ref']
  VLAN_slave_of: XenApiVlan['$ref'][]
  bond_master_of: XenApiBond['$ref'][]
  bond_slave_of: XenApiBond['$ref']
  capabilities: string[]
  currently_attached: boolean
  device: string
  disallow_unplug: boolean
  gateway: string
  host: XenApiHost['$ref']
  igmp_snooping_status: PIF_IGMP_STATUS
  ip_configuration_mode: IP_CONFIGURATION_MODE
  ipv6_configuration_mode: IPV6_CONFIGURATION_MODE
  ipv6_gateway: string
  managed: boolean
  management: boolean
  metrics: XenApiPifMetrics['$ref']
  netmask: string
  network: XenApiNetwork['$ref']
  other_config: Record<string, string>
  physical: boolean
  primary_address_type: PRIMARY_ADDRESS_TYPE
  properties: Record<string, string>
  sriov_logical_PIF_of: XenApiNetworkSriov['$ref'][]
  sriov_physical_PIF_of: XenApiNetworkSriov['$ref'][]
  tunnel_access_PIF_of: XenApiTunnel['$ref'][]
  tunnel_transport_PIF_of: XenApiTunnel['$ref'][]
}

export interface XenApiNetworkSriov extends XenApiRecord<'network_sriov'> {
  configuration_mode: SRIOV_CONFIGURATION_MODE
  logical_PIF: XenApiPif['$ref']
  physical_PIF: XenApiPif['$ref']
  requires_reboot: boolean
}

export interface XenApiVlan extends XenApiRecord<'vlan'> {
  other_config: Record<string, string>
  tag: number
  tagged_PIF: XenApiPif['$ref']
  untagged_PIF: XenApiPif['$ref']
}

export interface XenApiTunnel extends XenApiRecord<'tunnel'> {
  access_PIF: XenApiPif['$ref']
  other_config: Record<string, string>
  protocol: TUNNEL_PROTOCOL
  status: Record<string, string>
  transport_PIF: XenApiPif['$ref']
}

export interface XenApiPci extends XenApiRecord<'pci'> {
  class_name: string
  dependencies: XenApiPci['$ref'][]
  device_name: string
  driver_name: string
  host: XenApiHost['$ref']
  other_config: Record<string, string>
  pci_id: string
  subsystem_device_name: string
  subsystem_vendor_name: string
  vendor_name: string
}

export interface XenApiPifMetrics extends XenApiRecord<'pif_metrics'> {
  carrier: boolean
  device_id: string
  device_name: string
  duplex: boolean
  io_read_kbs: number
  io_write_kbs: number
  last_updated: string
  other_config: Record<string, string>
  pci_bus_path: string
  speed: number
  vendor_id: string
  vendor_name: string
}

export interface XenApiBond extends XenApiRecord<'bond'> {
  auto_update_mac: boolean
  links_up: number
  master: XenApiPif['$ref']
  mode: BOND_MODE
  other_config: Record<string, string>
  primary_slave: XenApiPif['$ref']
  properties: Record<string, string>
  slaves: XenApiPif['$ref'][]
}

export type XenApiEvent<
  RelationType extends ObjectType = ObjectType,
  XRecord extends ObjectTypeToRecord<RelationType> = ObjectTypeToRecord<RelationType>,
> = {
  id: string
  class: RelationType
  operation: 'add' | 'mod' | 'del'
  ref: XRecord['$ref']
  snapshot: RawXenApiRecord<XRecord>
}

export interface XenApiError extends Error {
  data?: any
}

/* eslint-enable no-use-before-define */
