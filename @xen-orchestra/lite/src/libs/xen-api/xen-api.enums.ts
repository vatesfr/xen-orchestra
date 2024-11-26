export enum TASK_ALLOWED_OPERATION {
  CANCEL = 'cancel',
  DESTROY = 'destroy',
}

export enum TASK_STATUS_TYPE {
  CANCELLED = 'cancelled',
  CANCELLING = 'cancelling',
  FAILURE = 'failure',
  PENDING = 'pending',
  SUCCESS = 'success',
}

export enum EVENT_OPERATION {
  ADD = 'add',
  DEL = 'del',
  MOD = 'mod',
}

export enum POOL_ALLOWED_OPERATION {
  APPLY_UPDATES = 'apply_updates',
  CERT_REFRESH = 'cert_refresh',
  CLUSTER_CREATE = 'cluster_create',
  CONFIGURE_REPOSITORIES = 'configure_repositories',
  COPY_PRIMARY_HOST_CERTS = 'copy_primary_host_certs',
  DESIGNATE_NEW_MASTER = 'designate_new_master',
  EXCHANGE_CA_CERTIFICATES_ON_JOIN = 'exchange_ca_certificates_on_join',
  EXCHANGE_CERTIFICATES_ON_JOIN = 'exchange_certificates_on_join',
  GET_UPDATES = 'get_updates',
  HA_DISABLE = 'ha_disable',
  HA_ENABLE = 'ha_enable',
  SYNC_UPDATES = 'sync_updates',
  TLS_VERIFICATION_ENABLE = 'tls_verification_enable',
}

export enum TELEMETRY_FREQUENCY {
  DAILY = 'daily',
  MONTHLY = 'monthly',
  WEEKLY = 'weekly',
}

export enum UPDATE_SYNC_FREQUENCY {
  DAILY = 'daily',
  WEEKLY = 'weekly',
}

export enum AFTER_APPLY_GUIDANCE {
  RESTART_HOST = 'restartHost',
  RESTART_HVM = 'restartHVM',
  RESTART_PV = 'restartPV',
  RESTART_XAPI = 'restartXAPI',
}

export enum UPDATE_AFTER_APPLY_GUIDANCE {
  RESTART_HOST = 'restartHost',
  RESTART_HVM = 'restartHVM',
  RESTART_PV = 'restartPV',
  RESTART_XAPI = 'restartXAPI',
}

export enum LIVEPATCH_STATUS {
  OK = 'ok',
  OK_LIVEPATCH_COMPLETE = 'ok_livepatch_complete',
  OK_LIVEPATCH_INCOMPLETE = 'ok_livepatch_incomplete',
}

export enum VM_POWER_STATE {
  HALTED = 'Halted',
  PAUSED = 'Paused',
  RUNNING = 'Running',
  SUSPENDED = 'Suspended',
}

export enum UPDATE_GUIDANCE {
  REBOOT_HOST = 'reboot_host',
  REBOOT_HOST_ON_LIVEPATCH_FAILURE = 'reboot_host_on_livepatch_failure',
  RESTART_DEVICE_MODEL = 'restart_device_model',
  RESTART_TOOLSTACK = 'restart_toolstack',
}

export enum ON_SOFTREBOOT_BEHAVIOR {
  DESTROY = 'destroy',
  PRESERVE = 'preserve',
  RESTART = 'restart',
  SOFT_REBOOT = 'soft_reboot',
}

export enum ON_NORMAL_EXIT {
  DESTROY = 'destroy',
  RESTART = 'restart',
}

export enum HOST_OPERATION {
  SHUTDOWN = 'shutdown',
}

export enum VM_OPERATION {
  ASSERT_OPERATION_VALID = 'assert_operation_valid',
  AWAITING_MEMORY_LIVE = 'awaiting_memory_live',
  CALL_PLUGIN = 'call_plugin',
  CHANGING_DYNAMIC_RANGE = 'changing_dynamic_range',
  CHANGING_MEMORY_LIMITS = 'changing_memory_limits',
  CHANGING_MEMORY_LIVE = 'changing_memory_live',
  CHANGING_NVRAM = 'changing_NVRAM',
  CHANGING_SHADOW_MEMORY = 'changing_shadow_memory',
  CHANGING_SHADOW_MEMORY_LIVE = 'changing_shadow_memory_live',
  CHANGING_STATIC_RANGE = 'changing_static_range',
  CHANGING_VCPUS = 'changing_VCPUs',
  CHANGING_VCPUS_LIVE = 'changing_VCPUs_live',
  CHECKPOINT = 'checkpoint',
  CLEAN_REBOOT = 'clean_reboot',
  CLEAN_SHUTDOWN = 'clean_shutdown',
  CLONE = 'clone',
  COPY = 'copy',
  CREATE_TEMPLATE = 'create_template',
  CREATE_VTPM = 'create_vtpm',
  CSVM = 'csvm',
  DATA_SOURCE_OP = 'data_source_op',
  DESTROY = 'destroy',
  EXPORT = 'export',
  GET_BOOT_RECORD = 'get_boot_record',
  HARD_REBOOT = 'hard_reboot',
  HARD_SHUTDOWN = 'hard_shutdown',
  IMPORT = 'import',
  MAKE_INTO_TEMPLATE = 'make_into_template',
  METADATA_EXPORT = 'metadata_export',
  MIGRATE_SEND = 'migrate_send',
  PAUSE = 'pause',
  POOL_MIGRATE = 'pool_migrate',
  POWER_STATE_RESET = 'power_state_reset',
  PROVISION = 'provision',
  QUERY_SERVICES = 'query_services',
  RESUME = 'resume',
  RESUME_ON = 'resume_on',
  REVERT = 'revert',
  REVERTING = 'reverting',
  SEND_SYSRQ = 'send_sysrq',
  SEND_TRIGGER = 'send_trigger',
  SHUTDOWN = 'shutdown',
  SNAPSHOT = 'snapshot',
  SNAPSHOT_WITH_QUIESCE = 'snapshot_with_quiesce',
  START = 'start',
  START_ON = 'start_on',
  SUSPEND = 'suspend',
  UNPAUSE = 'unpause',
  UPDATE_ALLOWED_OPERATIONS = 'update_allowed_operations',
}

export enum ON_CRASH_BEHAVIOUR {
  COREDUMP_AND_DESTROY = 'coredump_and_destroy',
  COREDUMP_AND_RESTART = 'coredump_and_restart',
  DESTROY = 'destroy',
  PRESERVE = 'preserve',
  RENAME_RESTART = 'rename_restart',
  RESTART = 'restart',
}

export enum DOMAIN_TYPE {
  HVM = 'hvm',
  PV = 'pv',
  PVH = 'pvh',
  PV_IN_PVH = 'pv_in_pvh',
  UNSPECIFIED = 'unspecified',
}

export enum TRISTATE_TYPE {
  NO = 'no',
  UNSPECIFIED = 'unspecified',
  YES = 'yes',
}

export enum VMPP_BACKUP_TYPE {
  CHECKPOINT = 'checkpoint',
  SNAPSHOT = 'snapshot',
}

export enum VMPP_BACKUP_FREQUENCY {
  DAILY = 'daily',
  HOURLY = 'hourly',
  WEEKLY = 'weekly',
}

export enum VMPP_ARCHIVE_FREQUENCY {
  ALWAYS_AFTER_BACKUP = 'always_after_backup',
  DAILY = 'daily',
  NEVER = 'never',
  WEEKLY = 'weekly',
}

export enum VMPP_ARCHIVE_TARGET_TYPE {
  CIFS = 'cifs',
  NFS = 'nfs',
  NONE = 'none',
}

export enum VMSS_FREQUENCY {
  DAILY = 'daily',
  HOURLY = 'hourly',
  WEEKLY = 'weekly',
}

export enum VMSS_TYPE {
  CHECKPOINT = 'checkpoint',
  SNAPSHOT = 'snapshot',
  SNAPSHOT_WITH_QUIESCE = 'snapshot_with_quiesce',
}

export enum VM_APPLIANCE_OPERATION {
  CLEAN_SHUTDOWN = 'clean_shutdown',
  HARD_SHUTDOWN = 'hard_shutdown',
  SHUTDOWN = 'shutdown',
  START = 'start',
}

export enum HOST_ALLOWED_OPERATION {
  APPLY_UPDATES = 'apply_updates',
  EVACUATE = 'evacuate',
  POWER_ON = 'power_on',
  PROVISION = 'provision',
  REBOOT = 'reboot',
  SHUTDOWN = 'shutdown',
  VM_MIGRATE = 'vm_migrate',
  VM_RESUME = 'vm_resume',
  VM_START = 'vm_start',
}

export enum LATEST_SYNCED_UPDATES_APPLIED_STATE {
  NO = 'no',
  UNKNOWN = 'unknown',
  YES = 'yes',
}

export enum HOST_DISPLAY {
  DISABLED = 'disabled',
  DISABLE_ON_REBOOT = 'disable_on_reboot',
  ENABLED = 'enabled',
  ENABLE_ON_REBOOT = 'enable_on_reboot',
}

export enum HOST_SCHED_GRAN {
  CORE = 'core',
  CPU = 'cpu',
  SOCKET = 'socket',
}

export enum NETWORK_OPERATION {
  ATTACHING = 'attaching',
}

export enum NETWORK_DEFAULT_LOCKING_MODE {
  DISABLED = 'disabled',
  UNLOCKED = 'unlocked',
}

export enum NETWORK_PURPOSE {
  INSECURE_NBD = 'insecure_nbd',
  NBD = 'nbd',
}

export enum VIF_OPERATION {
  ATTACH = 'attach',
  PLUG = 'plug',
  UNPLUG = 'unplug',
}

export enum VIF_LOCKING_MODE {
  DISABLED = 'disabled',
  LOCKED = 'locked',
  NETWORK_DEFAULT = 'network_default',
  UNLOCKED = 'unlocked',
}

export enum VIF_IPV4_CONFIGURATION_MODE {
  NONE = 'None',
  STATIC = 'Static',
}

export enum VIF_IPV6_CONFIGURATION_MODE {
  NONE = 'None',
  STATIC = 'Static',
}

export enum PIF_IGMP_STATUS {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  UNKNOWN = 'unknown',
}

export enum IP_CONFIGURATION_MODE {
  DHCP = 'DHCP',
  NONE = 'None',
  STATIC = 'Static',
}

export enum IPV6_CONFIGURATION_MODE {
  AUTOCONF = 'Autoconf',
  DHCP = 'DHCP',
  NONE = 'None',
  STATIC = 'Static',
}

export enum PRIMARY_ADDRESS_TYPE {
  IPV4 = 'IPv4',
  IPV6 = 'IPv6',
}

export enum BOND_MODE {
  ACTIVE_BACKUP = 'active-backup',
  BALANCE_SLB = 'balance-slb',
  LACP = 'lacp',
}

export enum STORAGE_OPERATION {
  DESTROY = 'destroy',
  FORGET = 'forget',
  PBD_CREATE = 'pbd_create',
  PBD_DESTROY = 'pbd_destroy',
  PLUG = 'plug',
  SCAN = 'scan',
  UNPLUG = 'unplug',
  UPDATE = 'update',
  VDI_CLONE = 'vdi_clone',
  VDI_CREATE = 'vdi_create',
  VDI_DATA_DESTROY = 'vdi_data_destroy',
  VDI_DESTROY = 'vdi_destroy',
  VDI_DISABLE_CBT = 'vdi_disable_cbt',
  VDI_ENABLE_CBT = 'vdi_enable_cbt',
  VDI_INTRODUCE = 'vdi_introduce',
  VDI_LIST_CHANGED_BLOCKS = 'vdi_list_changed_blocks',
  VDI_MIRROR = 'vdi_mirror',
  VDI_RESIZE = 'vdi_resize',
  VDI_SET_ON_BOOT = 'vdi_set_on_boot',
  VDI_SNAPSHOT = 'vdi_snapshot',
}

export enum SR_HEALTH {
  HEALTHY = 'healthy',
  RECOVERING = 'recovering',
}

export enum VDI_OPERATION {
  BLOCKED = 'blocked',
  CLONE = 'clone',
  COPY = 'copy',
  DATA_DESTROY = 'data_destroy',
  DESTROY = 'destroy',
  DISABLE_CBT = 'disable_cbt',
  ENABLE_CBT = 'enable_cbt',
  FORCE_UNLOCK = 'force_unlock',
  FORGET = 'forget',
  GENERATE_CONFIG = 'generate_config',
  LIST_CHANGED_BLOCKS = 'list_changed_blocks',
  MIRROR = 'mirror',
  RESIZE = 'resize',
  RESIZE_ONLINE = 'resize_online',
  SET_ON_BOOT = 'set_on_boot',
  SNAPSHOT = 'snapshot',
  UPDATE = 'update',
}

export enum VDI_TYPE {
  CBT_METADATA = 'cbt_metadata',
  CRASHDUMP = 'crashdump',
  EPHEMERAL = 'ephemeral',
  HA_STATEFILE = 'ha_statefile',
  METADATA = 'metadata',
  PVS_CACHE = 'pvs_cache',
  REDO_LOG = 'redo_log',
  RRD = 'rrd',
  SUSPEND = 'suspend',
  SYSTEM = 'system',
  USER = 'user',
}

export enum ON_BOOT {
  PERSIST = 'persist',
  RESET = 'reset',
}

export enum VBD_OPERATION {
  ATTACH = 'attach',
  EJECT = 'eject',
  INSERT = 'insert',
  PAUSE = 'pause',
  PLUG = 'plug',
  UNPAUSE = 'unpause',
  UNPLUG = 'unplug',
  UNPLUG_FORCE = 'unplug_force',
}

export enum VBD_TYPE {
  CD = 'CD',
  DISK = 'Disk',
  FLOPPY = 'Floppy',
}

export enum VBD_MODE {
  RO = 'RO',
  RW = 'RW',
}

export enum VTPM_OPERATION {
  DESTROY = 'destroy',
}

export enum PERSISTENCE_BACKEND {
  XAPI = 'xapi',
}

export enum CONSOLE_PROTOCOL {
  RDP = 'rdp',
  RFB = 'rfb',
  VT100 = 'vt100',
}

export enum CLS {
  CERTIFICATE = 'Certificate',
  HOST = 'Host',
  POOL = 'Pool',
  PVS_PROXY = 'PVS_proxy',
  SR = 'SR',
  VDI = 'VDI',
  VM = 'VM',
  VMPP = 'VMPP',
  VMSS = 'VMSS',
}

export enum TUNNEL_PROTOCOL {
  GRE = 'gre',
  VXLAN = 'vxlan',
}

export enum SRIOV_CONFIGURATION_MODE {
  MANUAL = 'manual',
  MODPROBE = 'modprobe',
  SYSFS = 'sysfs',
  UNKNOWN = 'unknown',
}

export enum PGPU_DOM0_ACCESS {
  DISABLED = 'disabled',
  DISABLE_ON_REBOOT = 'disable_on_reboot',
  ENABLED = 'enabled',
  ENABLE_ON_REBOOT = 'enable_on_reboot',
}

export enum ALLOCATION_ALGORITHM {
  BREADTH_FIRST = 'breadth_first',
  DEPTH_FIRST = 'depth_first',
}

export enum VGPU_TYPE_IMPLEMENTATION {
  GVT_G = 'gvt_g',
  MXGPU = 'mxgpu',
  NVIDIA = 'nvidia',
  NVIDIA_SRIOV = 'nvidia_sriov',
  PASSTHROUGH = 'passthrough',
}

export enum PVS_PROXY_STATUS {
  CACHING = 'caching',
  INCOMPATIBLE_PROTOCOL_VERSION = 'incompatible_protocol_version',
  INCOMPATIBLE_WRITE_CACHE_MODE = 'incompatible_write_cache_mode',
  INITIALISED = 'initialised',
  STOPPED = 'stopped',
}

export enum SDN_CONTROLLER_PROTOCOL {
  PSSL = 'pssl',
  SSL = 'ssl',
}

export enum VUSB_OPERATION {
  ATTACH = 'attach',
  PLUG = 'plug',
  UNPLUG = 'unplug',
}

export enum CLUSTER_OPERATION {
  ADD = 'add',
  DESTROY = 'destroy',
  DISABLE = 'disable',
  ENABLE = 'enable',
  REMOVE = 'remove',
}

export enum CLUSTER_HOST_OPERATION {
  DESTROY = 'destroy',
  DISABLE = 'disable',
  ENABLE = 'enable',
}

export enum CERTIFICATE_TYPE {
  CA = 'ca',
  HOST = 'host',
  HOST_INTERNAL = 'host_internal',
}

export enum VM_COMPRESSION_TYPE {
  DISABLED = 'false',
  GZIP = 'true',
  ZSTD = 'zstd',
}
