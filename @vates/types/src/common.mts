declare const __brand: unique symbol

export type Branded<TBrand extends string, TType = string> = TType & { [__brand]: TBrand }

export const HOST_POWER_STATE = {
  RUNNING: 'Running',
  HALTED: 'Halted',
  UNKNOWN: 'Unknown',
} as const

export type HOST_POWER_STATE = (typeof HOST_POWER_STATE)[keyof typeof HOST_POWER_STATE]

export const TASK_ALLOWED_OPERATIONS = {
  CANCEL: 'cancel',
  DESTROY: 'destroy',
} as const

export type TASK_ALLOWED_OPERATIONS = (typeof TASK_ALLOWED_OPERATIONS)[keyof typeof TASK_ALLOWED_OPERATIONS]

export const TASK_STATUS_TYPE = {
  CANCELLED: 'cancelled',
  CANCELLING: 'cancelling',
  FAILURE: 'failure',
  PENDING: 'pending',
  SUCCESS: 'success',
} as const

export type TASK_STATUS_TYPE = (typeof TASK_STATUS_TYPE)[keyof typeof TASK_STATUS_TYPE]

export const EVENT_OPERATION = {
  ADD: 'add',
  DEL: 'del',
  MOD: 'mod',
} as const

export type EVENT_OPERATION = (typeof EVENT_OPERATION)[keyof typeof EVENT_OPERATION]

export const POOL_ALLOWED_OPERATIONS = {
  APPLY_UPDATES: 'apply_updates',
  CERT_REFRESH: 'cert_refresh',
  CLUSTER_CREATE: 'cluster_create',
  CONFIGURE_REPOSITORIES: 'configure_repositories',
  COPY_PRIMARY_HOST_CERTS: 'copy_primary_host_certs',
  DESIGNATE_NEW_MASTER: 'designate_new_master',
  EJECT: 'eject',
  EXCHANGE_CA_CERTIFICATES_ON_JOIN: 'exchange_ca_certificates_on_join',
  EXCHANGE_CERTIFICATES_ON_JOIN: 'exchange_certificates_on_join',
  GET_UPDATES: 'get_updates',
  HA_DISABLE: 'ha_disable',
  HA_ENABLE: 'ha_enable',
  SYNC_UPDATES: 'sync_updates',
  TLS_VERIFICATION_ENABLE: 'tls_verification_enable',
} as const

export type POOL_ALLOWED_OPERATIONS = (typeof POOL_ALLOWED_OPERATIONS)[keyof typeof POOL_ALLOWED_OPERATIONS]

export const TELEMETRY_FREQUENCY = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
} as const

export type TELEMETRY_FREQUENCY = (typeof TELEMETRY_FREQUENCY)[keyof typeof TELEMETRY_FREQUENCY]

export const UPDATE_SYNC_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
} as const

export type UPDATE_SYNC_FREQUENCY = (typeof UPDATE_SYNC_FREQUENCY)[keyof typeof UPDATE_SYNC_FREQUENCY]

export const AFTER_APPLY_GUIDANCE = {
  RESTART_HOST: 'restartHost',
  RESTART_HVM: 'restartHVM',
  RESTART_PV: 'restartPV',
  RESTART_XAPI: 'restartXAPI',
} as const

export type AFTER_APPLY_GUIDANCE = (typeof AFTER_APPLY_GUIDANCE)[keyof typeof AFTER_APPLY_GUIDANCE]

export const UPDATE_AFTER_APPLY_GUIDANCE = {
  RESTART_HOST: 'restartHost',
  RESTART_HVM: 'restartHVM',
  RESTART_PV: 'restartPV',
  RESTART_XAPI: 'restartXAPI',
} as const

export type UPDATE_AFTER_APPLY_GUIDANCE = (typeof UPDATE_AFTER_APPLY_GUIDANCE)[keyof typeof UPDATE_AFTER_APPLY_GUIDANCE]

export const LIVEPATCH_STATUS = {
  OK: 'ok',
  OK_LIVEPATCH_COMPLETE: 'ok_livepatch_complete',
  OK_LIVEPATCH_INCOMPLETE: 'ok_livepatch_incomplete',
} as const

export type LIVEPATCH_STATUS = (typeof LIVEPATCH_STATUS)[keyof typeof LIVEPATCH_STATUS]

export const VM_POWER_STATE = {
  HALTED: 'Halted',
  PAUSED: 'Paused',
  RUNNING: 'Running',
  SUSPENDED: 'Suspended',
} as const

export type VM_POWER_STATE = (typeof VM_POWER_STATE)[keyof typeof VM_POWER_STATE]

export const UPDATE_GUIDANCES = {
  REBOOT_HOST: 'reboot_host',
  REBOOT_HOST_ON_KERNEL_LIVEPATCH_FAILURE: 'reboot_host_on_kernel_livepatch_failure',
  REBOOT_HOST_ON_LIVEPATCH_FAILURE: 'reboot_host_on_livepatch_failure',
  REBOOT_HOST_ON_XEN_LIVEPATCH_FAILURE: 'reboot_host_on_xen_livepatch_failure',
  RESTART_DEVICE_MODEL: 'restart_device_model',
  RESTART_TOOLSTACK: 'restart_toolstack',
  RESTART_VM: 'restart_vm',
} as const

export type UPDATE_GUIDANCES = (typeof UPDATE_GUIDANCES)[keyof typeof UPDATE_GUIDANCES]

export const ON_SOFTREBOOT_BEHAVIOR = {
  DESTROY: 'destroy',
  PRESERVE: 'preserve',
  RESTART: 'restart',
  SOFT_REBOOT: 'soft_reboot',
} as const

export type ON_SOFTREBOOT_BEHAVIOR = (typeof ON_SOFTREBOOT_BEHAVIOR)[keyof typeof ON_SOFTREBOOT_BEHAVIOR]

export const ON_NORMAL_EXIT = {
  DESTROY: 'destroy',
  RESTART: 'restart',
} as const

export type ON_NORMAL_EXIT = (typeof ON_NORMAL_EXIT)[keyof typeof ON_NORMAL_EXIT]

export const VM_OPERATIONS = {
  ASSERT_OPERATION_VALID: 'assert_operation_valid',
  AWAITING_MEMORY_LIVE: 'awaiting_memory_live',
  CALL_PLUGIN: 'call_plugin',
  CHANGING_DYNAMIC_RANGE: 'changing_dynamic_range',
  CHANGING_MEMORY_LIMITS: 'changing_memory_limits',
  CHANGING_MEMORY_LIVE: 'changing_memory_live',
  CHANGING_NVRAM: 'changing_NVRAM',
  CHANGING_SHADOW_MEMORY: 'changing_shadow_memory',
  CHANGING_SHADOW_MEMORY_LIVE: 'changing_shadow_memory_live',
  CHANGING_STATIC_RANGE: 'changing_static_range',
  CHANGING_VCPUS: 'changing_VCPUs',
  CHANGING_VCPUS_LIVE: 'changing_VCPUs_live',
  CHECKPOINT: 'checkpoint',
  CLEAN_REBOOT: 'clean_reboot',
  CLEAN_SHUTDOWN: 'clean_shutdown',
  CLONE: 'clone',
  COPY: 'copy',
  CREATE_TEMPLATE: 'create_template',
  CREATE_VTPM: 'create_vtpm',
  CSVM: 'csvm',
  DATA_SOURCE_OP: 'data_source_op',
  DESTROY: 'destroy',
  EXPORT: 'export',
  GET_BOOT_RECORD: 'get_boot_record',
  HARD_REBOOT: 'hard_reboot',
  HARD_SHUTDOWN: 'hard_shutdown',
  IMPORT: 'import',
  MAKE_INTO_TEMPLATE: 'make_into_template',
  METADATA_EXPORT: 'metadata_export',
  MIGRATE_SEND: 'migrate_send',
  PAUSE: 'pause',
  POOL_MIGRATE: 'pool_migrate',
  POWER_STATE_RESET: 'power_state_reset',
  PROVISION: 'provision',
  QUERY_SERVICES: 'query_services',
  RESUME: 'resume',
  RESUME_ON: 'resume_on',
  REVERT: 'revert',
  REVERTING: 'reverting',
  SEND_SYSRQ: 'send_sysrq',
  SEND_TRIGGER: 'send_trigger',
  SHUTDOWN: 'shutdown',
  SNAPSHOT: 'snapshot',
  SNAPSHOT_WITH_QUIESCE: 'snapshot_with_quiesce',
  START: 'start',
  START_ON: 'start_on',
  SUSPEND: 'suspend',
  UNPAUSE: 'unpause',
  UPDATE_ALLOWED_OPERATIONS: 'update_allowed_operations',
} as const

export type VM_OPERATIONS = (typeof VM_OPERATIONS)[keyof typeof VM_OPERATIONS]

export const ON_CRASH_BEHAVIOUR = {
  COREDUMP_AND_DESTROY: 'coredump_and_destroy',
  COREDUMP_AND_RESTART: 'coredump_and_restart',
  DESTROY: 'destroy',
  PRESERVE: 'preserve',
  RENAME_RESTART: 'rename_restart',
  RESTART: 'restart',
} as const

export type ON_CRASH_BEHAVIOUR = (typeof ON_CRASH_BEHAVIOUR)[keyof typeof ON_CRASH_BEHAVIOUR]

export const DOMAIN_TYPE = {
  HVM: 'hvm',
  PV: 'pv',
  PVH: 'pvh',
  PV_IN_PVH: 'pv_in_pvh',
  UNSPECIFIED: 'unspecified',
} as const

export type DOMAIN_TYPE = (typeof DOMAIN_TYPE)[keyof typeof DOMAIN_TYPE]

export const TRISTATE_TYPE = {
  NO: 'no',
  UNSPECIFIED: 'unspecified',
  YES: 'yes',
} as const

export type TRISTATE_TYPE = (typeof TRISTATE_TYPE)[keyof typeof TRISTATE_TYPE]

export const VMPP_BACKUP_TYPE = {
  CHECKPOINT: 'checkpoint',
  SNAPSHOT: 'snapshot',
} as const

export type VMPP_BACKUP_TYPE = (typeof VMPP_BACKUP_TYPE)[keyof typeof VMPP_BACKUP_TYPE]

export const VMPP_BACKUP_FREQUENCY = {
  DAILY: 'daily',
  HOURLY: 'hourly',
  WEEKLY: 'weekly',
} as const

export type VMPP_BACKUP_FREQUENCY = (typeof VMPP_BACKUP_FREQUENCY)[keyof typeof VMPP_BACKUP_FREQUENCY]

export const VMPP_ARCHIVE_FREQUENCY = {
  ALWAYS_AFTER_BACKUP: 'always_after_backup',
  DAILY: 'daily',
  NEVER: 'never',
  WEEKLY: 'weekly',
} as const

export type VMPP_ARCHIVE_FREQUENCY = (typeof VMPP_ARCHIVE_FREQUENCY)[keyof typeof VMPP_ARCHIVE_FREQUENCY]

export const VMPP_ARCHIVE_TARGET_TYPE = {
  CIFS: 'cifs',
  NFS: 'nfs',
  NONE: 'none',
} as const

export type VMPP_ARCHIVE_TARGET_TYPE = (typeof VMPP_ARCHIVE_TARGET_TYPE)[keyof typeof VMPP_ARCHIVE_TARGET_TYPE]

export const VMSS_FREQUENCY = {
  DAILY: 'daily',
  HOURLY: 'hourly',
  WEEKLY: 'weekly',
} as const

export type VMSS_FREQUENCY = (typeof VMSS_FREQUENCY)[keyof typeof VMSS_FREQUENCY]

export const VMSS_TYPE = {
  CHECKPOINT: 'checkpoint',
  SNAPSHOT: 'snapshot',
  SNAPSHOT_WITH_QUIESCE: 'snapshot_with_quiesce',
} as const

export type VMSS_TYPE = (typeof VMSS_TYPE)[keyof typeof VMSS_TYPE]

export const VM_APPLIANCE_OPERATION = {
  CLEAN_SHUTDOWN: 'clean_shutdown',
  HARD_SHUTDOWN: 'hard_shutdown',
  SHUTDOWN: 'shutdown',
  START: 'start',
} as const

export type VM_APPLIANCE_OPERATION = (typeof VM_APPLIANCE_OPERATION)[keyof typeof VM_APPLIANCE_OPERATION]

export const HOST_ALLOWED_OPERATIONS = {
  APPLY_UPDATES: 'apply_updates',
  ENABLE: 'enable',
  EVACUATE: 'evacuate',
  POWER_ON: 'power_on',
  PROVISION: 'provision',
  REBOOT: 'reboot',
  SHUTDOWN: 'shutdown',
  VM_MIGRATE: 'vm_migrate',
  VM_RESUME: 'vm_resume',
  VM_START: 'vm_start',
} as const

export type HOST_ALLOWED_OPERATIONS = (typeof HOST_ALLOWED_OPERATIONS)[keyof typeof HOST_ALLOWED_OPERATIONS]

export const LATEST_SYNCED_UPDATES_APPLIED_STATE = {
  NO: 'no',
  UNKNOWN: 'unknown',
  YES: 'yes',
} as const

export type LATEST_SYNCED_UPDATES_APPLIED_STATE =
  (typeof LATEST_SYNCED_UPDATES_APPLIED_STATE)[keyof typeof LATEST_SYNCED_UPDATES_APPLIED_STATE]

export const HOST_DISPLAY = {
  DISABLED: 'disabled',
  DISABLE_ON_REBOOT: 'disable_on_reboot',
  ENABLED: 'enabled',
  ENABLE_ON_REBOOT: 'enable_on_reboot',
} as const

export type HOST_DISPLAY = (typeof HOST_DISPLAY)[keyof typeof HOST_DISPLAY]

export const HOST_SCHED_GRAN = {
  CORE: 'core',
  CPU: 'cpu',
  SOCKET: 'socket',
} as const

export type HOST_SCHED_GRAN = (typeof HOST_SCHED_GRAN)[keyof typeof HOST_SCHED_GRAN]

export const HOST_NUMA_AFFINITY_POLICY = {
  ANY: 'any',
  BEST_EFFORT: 'best_effort',
  DEFAULT_POLICY: 'default_policy',
} as const

export type HOST_NUMA_AFFINITY_POLICY = (typeof HOST_NUMA_AFFINITY_POLICY)[keyof typeof HOST_NUMA_AFFINITY_POLICY]

export const NETWORK_OPERATIONS = {
  ATTACHING: 'attaching',
} as const

export type NETWORK_OPERATIONS = (typeof NETWORK_OPERATIONS)[keyof typeof NETWORK_OPERATIONS]

export const NETWORK_DEFAULT_LOCKING_MODE = {
  DISABLED: 'disabled',
  UNLOCKED: 'unlocked',
} as const

export type NETWORK_DEFAULT_LOCKING_MODE =
  (typeof NETWORK_DEFAULT_LOCKING_MODE)[keyof typeof NETWORK_DEFAULT_LOCKING_MODE]

export const NETWORK_PURPOSE = {
  INSECURE_NBD: 'insecure_nbd',
  NBD: 'nbd',
} as const

export type NETWORK_PURPOSE = (typeof NETWORK_PURPOSE)[keyof typeof NETWORK_PURPOSE]

export const VIF_OPERATIONS = {
  ATTACH: 'attach',
  PLUG: 'plug',
  UNPLUG: 'unplug',
} as const

export type VIF_OPERATIONS = (typeof VIF_OPERATIONS)[keyof typeof VIF_OPERATIONS]

export const VIF_LOCKING_MODE = {
  DISABLED: 'disabled',
  LOCKED: 'locked',
  NETWORK_DEFAULT: 'network_default',
  UNLOCKED: 'unlocked',
} as const

export type VIF_LOCKING_MODE = (typeof VIF_LOCKING_MODE)[keyof typeof VIF_LOCKING_MODE]

export const VIF_IPV4_CONFIGURATION_MODE = {
  NONE: 'None',
  STATIC: 'Static',
} as const

export type VIF_IPV4_CONFIGURATION_MODE = (typeof VIF_IPV4_CONFIGURATION_MODE)[keyof typeof VIF_IPV4_CONFIGURATION_MODE]

export const VIF_IPV6_CONFIGURATION_MODE = {
  NONE: 'None',
  STATIC: 'Static',
} as const

export type VIF_IPV6_CONFIGURATION_MODE = (typeof VIF_IPV6_CONFIGURATION_MODE)[keyof typeof VIF_IPV6_CONFIGURATION_MODE]

export const PIF_IGMP_STATUS = {
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  UNKNOWN: 'unknown',
} as const

export type PIF_IGMP_STATUS = (typeof PIF_IGMP_STATUS)[keyof typeof PIF_IGMP_STATUS]

export const IP_CONFIGURATION_MODE = {
  DHCP: 'DHCP',
  NONE: 'None',
  STATIC: 'Static',
} as const

export type IP_CONFIGURATION_MODE = (typeof IP_CONFIGURATION_MODE)[keyof typeof IP_CONFIGURATION_MODE]

export const IPV6_CONFIGURATION_MODE = {
  AUTOCONF: 'Autoconf',
  DHCP: 'DHCP',
  NONE: 'None',
  STATIC: 'Static',
} as const

export type IPV6_CONFIGURATION_MODE = (typeof IPV6_CONFIGURATION_MODE)[keyof typeof IPV6_CONFIGURATION_MODE]

export const PRIMARY_ADDRESS_TYPE = {
  IPV4: 'IPv4',
  IPV6: 'IPv6',
} as const

export type PRIMARY_ADDRESS_TYPE = (typeof PRIMARY_ADDRESS_TYPE)[keyof typeof PRIMARY_ADDRESS_TYPE]

export const BOND_MODE = {
  ACTIVE_BACKUP: 'active-backup',
  BALANCE_SLB: 'balance-slb',
  LACP: 'lacp',
} as const

export type BOND_MODE = (typeof BOND_MODE)[keyof typeof BOND_MODE]

export const STORAGE_OPERATIONS = {
  DESTROY: 'destroy',
  FORGET: 'forget',
  PBD_CREATE: 'pbd_create',
  PBD_DESTROY: 'pbd_destroy',
  PLUG: 'plug',
  SCAN: 'scan',
  UNPLUG: 'unplug',
  UPDATE: 'update',
  VDI_CLONE: 'vdi_clone',
  VDI_CREATE: 'vdi_create',
  VDI_DATA_DESTROY: 'vdi_data_destroy',
  VDI_DESTROY: 'vdi_destroy',
  VDI_DISABLE_CBT: 'vdi_disable_cbt',
  VDI_ENABLE_CBT: 'vdi_enable_cbt',
  VDI_INTRODUCE: 'vdi_introduce',
  VDI_LIST_CHANGED_BLOCKS: 'vdi_list_changed_blocks',
  VDI_MIRROR: 'vdi_mirror',
  VDI_RESIZE: 'vdi_resize',
  VDI_SET_ON_BOOT: 'vdi_set_on_boot',
  VDI_SNAPSHOT: 'vdi_snapshot',
} as const

export type STORAGE_OPERATIONS = (typeof STORAGE_OPERATIONS)[keyof typeof STORAGE_OPERATIONS]

export const SR_HEALTH = {
  HEALTHY: 'healthy',
  RECOVERING: 'recovering',
} as const

export type SR_HEALTH = (typeof SR_HEALTH)[keyof typeof SR_HEALTH]

export const VDI_OPERATIONS = {
  BLOCKED: 'blocked',
  CLONE: 'clone',
  COPY: 'copy',
  DATA_DESTROY: 'data_destroy',
  DESTROY: 'destroy',
  DISABLE_CBT: 'disable_cbt',
  ENABLE_CBT: 'enable_cbt',
  FORCE_UNLOCK: 'force_unlock',
  FORGET: 'forget',
  GENERATE_CONFIG: 'generate_config',
  LIST_CHANGED_BLOCKS: 'list_changed_blocks',
  MIRROR: 'mirror',
  RESIZE: 'resize',
  RESIZE_ONLINE: 'resize_online',
  SET_ON_BOOT: 'set_on_boot',
  SNAPSHOT: 'snapshot',
  UPDATE: 'update',
} as const

export type VDI_OPERATIONS = (typeof VDI_OPERATIONS)[keyof typeof VDI_OPERATIONS]

export const VDI_TYPE = {
  CBT_METADATA: 'cbt_metadata',
  CRASHDUMP: 'crashdump',
  EPHEMERAL: 'ephemeral',
  HA_STATEFILE: 'ha_statefile',
  METADATA: 'metadata',
  PVS_CACHE: 'pvs_cache',
  REDO_LOG: 'redo_log',
  RRD: 'rrd',
  SUSPEND: 'suspend',
  SYSTEM: 'system',
  USER: 'user',
} as const

export type VDI_TYPE = (typeof VDI_TYPE)[keyof typeof VDI_TYPE]

export const ON_BOOT = {
  PERSIST: 'persist',
  RESET: 'reset',
} as const

export type ON_BOOT = (typeof ON_BOOT)[keyof typeof ON_BOOT]

export const VBD_OPERATIONS = {
  ATTACH: 'attach',
  EJECT: 'eject',
  INSERT: 'insert',
  PAUSE: 'pause',
  PLUG: 'plug',
  UNPAUSE: 'unpause',
  UNPLUG: 'unplug',
  UNPLUG_FORCE: 'unplug_force',
} as const

export type VBD_OPERATIONS = (typeof VBD_OPERATIONS)[keyof typeof VBD_OPERATIONS]

export const VBD_TYPE = {
  CD: 'CD',
  DISK: 'Disk',
  FLOPPY: 'Floppy',
} as const

export type VBD_TYPE = (typeof VBD_TYPE)[keyof typeof VBD_TYPE]

export const VBD_MODE = {
  RO: 'RO',
  RW: 'RW',
} as const

export type VBD_MODE = (typeof VBD_MODE)[keyof typeof VBD_MODE]

export const VTPM_OPERATIONS = {
  DESTROY: 'destroy',
} as const

export type VTPM_OPERATIONS = (typeof VTPM_OPERATIONS)[keyof typeof VTPM_OPERATIONS]

export const PERSISTENCE_BACKEND = {
  XAPI: 'xapi',
} as const

export type PERSISTENCE_BACKEND = (typeof PERSISTENCE_BACKEND)[keyof typeof PERSISTENCE_BACKEND]

export const CONSOLE_PROTOCOL = {
  RDP: 'rdp',
  RFB: 'rfb',
  VT100: 'vt100',
} as const

export type CONSOLE_PROTOCOL = (typeof CONSOLE_PROTOCOL)[keyof typeof CONSOLE_PROTOCOL]

export const CLS = {
  CERTIFICATE: 'Certificate',
  HOST: 'Host',
  POOL: 'Pool',
  PVS_PROXY: 'PVS_proxy',
  SR: 'SR',
  VDI: 'VDI',
  VM: 'VM',
  VMPP: 'VMPP',
  VMSS: 'VMSS',
} as const

export type CLS = (typeof CLS)[keyof typeof CLS]

export const TUNNEL_PROTOCOL = {
  GRE: 'gre',
  VXLAN: 'vxlan',
} as const

export type TUNNEL_PROTOCOL = (typeof TUNNEL_PROTOCOL)[keyof typeof TUNNEL_PROTOCOL]

export const SRIOV_CONFIGURATION_MODE = {
  MANUAL: 'manual',
  MODPROBE: 'modprobe',
  SYSFS: 'sysfs',
  UNKNOWN: 'unknown',
} as const

export type SRIOV_CONFIGURATION_MODE = (typeof SRIOV_CONFIGURATION_MODE)[keyof typeof SRIOV_CONFIGURATION_MODE]

export const PGPU_DOM0_ACCESS = {
  DISABLED: 'disabled',
  DISABLE_ON_REBOOT: 'disable_on_reboot',
  ENABLED: 'enabled',
  ENABLE_ON_REBOOT: 'enable_on_reboot',
} as const

export type PGPU_DOM0_ACCESS = (typeof PGPU_DOM0_ACCESS)[keyof typeof PGPU_DOM0_ACCESS]

export const ALLOCATION_ALGORITHM = {
  BREADTH_FIRST: 'breadth_first',
  DEPTH_FIRST: 'depth_first',
} as const

export type ALLOCATION_ALGORITHM = (typeof ALLOCATION_ALGORITHM)[keyof typeof ALLOCATION_ALGORITHM]

export const VGPU_TYPE_IMPLEMENTATION = {
  GVT_G: 'gvt_g',
  MXGPU: 'mxgpu',
  NVIDIA: 'nvidia',
  NVIDIA_SRIOV: 'nvidia_sriov',
  PASSTHROUGH: 'passthrough',
} as const

export type VGPU_TYPE_IMPLEMENTATION = (typeof VGPU_TYPE_IMPLEMENTATION)[keyof typeof VGPU_TYPE_IMPLEMENTATION]

export const PVS_PROXY_STATUS = {
  CACHING: 'caching',
  INCOMPATIBLE_PROTOCOL_VERSION: 'incompatible_protocol_version',
  INCOMPATIBLE_WRITE_CACHE_MODE: 'incompatible_write_cache_mode',
  INITIALISED: 'initialised',
  STOPPED: 'stopped',
} as const

export type PVS_PROXY_STATUS = (typeof PVS_PROXY_STATUS)[keyof typeof PVS_PROXY_STATUS]

export const SDN_CONTROLLER_PROTOCOL = {
  PSSL: 'pssl',
  SSL: 'ssl',
} as const

export type SDN_CONTROLLER_PROTOCOL = (typeof SDN_CONTROLLER_PROTOCOL)[keyof typeof SDN_CONTROLLER_PROTOCOL]

export const VUSB_OPERATIONS = {
  ATTACH: 'attach',
  PLUG: 'plug',
  UNPLUG: 'unplug',
} as const

export type VUSB_OPERATIONS = (typeof VUSB_OPERATIONS)[keyof typeof VUSB_OPERATIONS]

export const CLUSTER_OPERATION = {
  ADD: 'add',
  DESTROY: 'destroy',
  DISABLE: 'disable',
  ENABLE: 'enable',
  REMOVE: 'remove',
} as const

export type CLUSTER_OPERATION = (typeof CLUSTER_OPERATION)[keyof typeof CLUSTER_OPERATION]

export const CLUSTER_HOST_OPERATION = {
  DESTROY: 'destroy',
  DISABLE: 'disable',
  ENABLE: 'enable',
} as const

export type CLUSTER_HOST_OPERATION = (typeof CLUSTER_HOST_OPERATION)[keyof typeof CLUSTER_HOST_OPERATION]

export const CERTIFICATE_TYPE = {
  CA: 'ca',
  HOST: 'host',
  HOST_INTERNAL: 'host_internal',
} as const

export type CERTIFICATE_TYPE = (typeof CERTIFICATE_TYPE)[keyof typeof CERTIFICATE_TYPE]

export const OPAQUE_REF = { EMPTY: 'OpaqueRef:NULL' } as const

export type OPAQUE_REF_NULL = (typeof OPAQUE_REF)['EMPTY']

export const BACKUP_TYPE = { backup: 'backup', metadata: 'metadataBackup', mirror: 'mirrorBackup' } as const

export type BACKUP_TYPE = (typeof BACKUP_TYPE)[keyof typeof BACKUP_TYPE]

// ----- XAPI Stats

type XapiStatsResponse<T> = {
  endTimestamp: number
  interval: number
  stats: T
}

export type XapiStatsGranularity = 'seconds' | 'minutes' | 'hours' | 'days'

export type XapiHostStats = XapiStatsResponse<{
  cpus: Record<string, number[]>
  ioThroughput: {
    r: Record<string, number[]>
    w: Record<string, number[]>
  }
  iops: {
    r: Record<string, number[]>
    w: Record<string, number[]>
  }
  iowait: Record<string, number[]>
  latency: {
    r: Record<string, number[]>
    w: Record<string, number[]>
  }
  load: number[]
  memory: number[]
  memoryFree: number[]
  pifs: {
    rx: Record<string, number[]>
    tx: Record<string, number[]>
  }
}>

export type XapiVmStats = XapiStatsResponse<{
  cpus: Record<string, number[]>
  iops: {
    r: Record<string, number[]>
    w: Record<string, number[]>
  }
  memory: number[]
  memoryFree?: number[]
  vifs: {
    rx: Record<string, number[]>
    tx: Record<string, number[]>
  }
  xvds: {
    w: Record<string, number[]>
    r: Record<string, number[]>
  }
}>
