import type { Branded } from '../common.mjs'
import type { XoNetwork, XoSr, XoVmTemplate } from '../xo.mjs'

// Stateless API: requests needing the source carry the connection in a POST body (never in URLs or access logs) and
// xo-server stores nothing it reads from the source.

export const V2V_PLATFORM = {
  VMWARE: 'vmware',
} as const

export type V2V_PLATFORM = (typeof V2V_PLATFORM)[keyof typeof V2V_PLATFORM]

// 422 rather than 401 for invalid source credentials: a 401 would open the browser Basic authentication prompt
export const V2V_ERROR_CODE = {
  INVALID_CREDENTIALS: 'V2V_INVALID_CREDENTIALS',
} as const

export type V2V_ERROR_CODE = (typeof V2V_ERROR_CODE)[keyof typeof V2V_ERROR_CODE]

// Clones, restores and replicas inherit `other_config`: the imported VM records its own UUID to be told apart from
// them, and the source identity because a moref is only unique within one vCenter. The source identity is the
// inventory `instanceUuid`, or `<lowercased host>:<port>` for a standalone ESXi which has none.
export const V2V_VM_OTHER_CONFIG = {
  SOURCE_VM_ID: 'sourceVmId',
  SOURCE_SNAPSHOT_ID: 'sourceSnapshotId',
  IMPORTED_VM_UUID: 'xo:v2v:importedVmUuid',
  SOURCE_ID: 'xo:v2v:sourceId',
  SOURCE_VM_INSTANCE_UUID: 'xo:v2v:sourceVmInstanceUuid',
} as const

export type V2V_VM_OTHER_CONFIG = (typeof V2V_VM_OTHER_CONFIG)[keyof typeof V2V_VM_OTHER_CONFIG]

export type XoV2vVmOtherConfig = Partial<Record<V2V_VM_OTHER_CONFIG, string>>

export const V2V_START_BLOCKED_REASON = 'Esxi migration in progress...'

export const V2V_PARTIAL_IMPORT_TAG = 'xo:no-bak=V2V partial import'

export const V2V_SNAPSHOT_NAME = {
  AFTER_PARTIAL_IMPORT: 'after partial import from V2V',
  AFTER_COMPLETE_IMPORT: 'after complete import from V2V',
  COMPLETE_IMPORT: 'complete import from V2V',
} as const

export type V2V_SNAPSHOT_NAME = (typeof V2V_SNAPSHOT_NAME)[keyof typeof V2V_SNAPSHOT_NAME]

// Set on the task of a start so the front can tell which source VMs are being imported
export const V2V_TASK_PROPERTY = {
  SOURCE_VM_IDS: 'sourceVmIds',
} as const

export type XoV2vConnection = {
  host: string
  port: number
  username: string
  password: string
  skipSslCheck: boolean
}

export type XoV2vStatus = {
  vectura: { status: 'success' } | { status: 'error'; error: string }
}

export type XoV2vInventoryPayload = {
  platform: V2V_PLATFORM
  connection: XoV2vConnection
}

export type XoV2vDatacenter = {
  id: Branded<'v2v-datacenter'>
  name: string
}

export type XoV2vCluster = {
  id: Branded<'v2v-cluster'>
  name: string
  datacenterId: XoV2vDatacenter['id']
}

export type XoV2vHost = {
  id: Branded<'v2v-host'>
  name: string
  clusterId?: XoV2vCluster['id']
  datacenterId: XoV2vDatacenter['id']
}

// Sizes are in bytes, as in the rest of XO, not in the KB/MB VMware returns
export type XoV2vDatastore = {
  id: Branded<'v2v-datastore'>
  name: string
  type: string
  capacity: number
  free: number
  hostIds: XoV2vHost['id'][]
}

export type XoV2vPortGroup = {
  id: Branded<'v2v-port-group'>
  name: string
  vlan?: number
}

export const V2V_DISK_MODE = {
  PERSISTENT: 'persistent',
  NON_PERSISTENT: 'nonpersistent',
  INDEPENDENT_PERSISTENT: 'independent_persistent',
  INDEPENDENT_NON_PERSISTENT: 'independent_nonpersistent',
  UNDOABLE: 'undoable',
  APPEND: 'append',
} as const

export type V2V_DISK_MODE = (typeof V2V_DISK_MODE)[keyof typeof V2V_DISK_MODE]

// `key` is the vmx device node (`scsi0:0`, `ethernet0`…), the identifier the import matches the start maps against
export type XoV2vDisk = {
  key: Branded<'v2v-disk'>
  label: string
  datastoreId: XoV2vDatastore['id']
  capacity: number
  mode: V2V_DISK_MODE
  isRdm: boolean
  isEncrypted: boolean
}

// No port group for opaque (NSX) or missing backings
export type XoV2vNic = {
  key: Branded<'v2v-nic'>
  label: string
  portGroupId?: XoV2vPortGroup['id']
  macAddress: string
}

export const V2V_VM_POWER_STATE = {
  POWERED_ON: 'poweredOn',
  POWERED_OFF: 'poweredOff',
  SUSPENDED: 'suspended',
} as const

export type V2V_VM_POWER_STATE = (typeof V2V_VM_POWER_STATE)[keyof typeof V2V_VM_POWER_STATE]

export const V2V_FIRMWARE = {
  BIOS: 'bios',
  UEFI: 'uefi',
} as const

export type V2V_FIRMWARE = (typeof V2V_FIRMWARE)[keyof typeof V2V_FIRMWARE]

export type XoV2vVm = {
  id: Branded<'v2v-vm'>
  instanceUuid: string
  name: string
  description: string
  powerState: V2V_VM_POWER_STATE
  hostId: XoV2vHost['id']
  nCpus: number
  memory: number
  firmware: V2V_FIRMWARE
  secureBoot: boolean
  datastoreIds: XoV2vDatastore['id'][]
  snapshotCount: number
  // Compared with `other_config.sourceSnapshotId` of a partial import: a delta is only possible while they match
  currentSnapshotId?: string
  disks: XoV2vDisk[]
  nics: XoV2vNic[]
}

export type XoV2vInventory = {
  product: string
  version: string
  // Absent on a standalone ESXi, identified by its connection address instead
  instanceUuid?: string
  datacenters: XoV2vDatacenter[]
  clusters: XoV2vCluster[]
  hosts: XoV2vHost[]
  datastores: XoV2vDatastore[]
  portGroups: XoV2vPortGroup[]
  vms: XoV2vVm[]
}

export type XoV2vStartOptions = {
  stopSource: boolean
  startVm: boolean
  cleanup: boolean
}

// A resumed import sends no disk or NIC map: the back end reads its mapping from the existing XCP-ng VM
export type XoV2vStartPayloadVm = Partial<XoV2vStartOptions> & {
  id: XoV2vVm['id']
  disks?: Record<XoV2vDisk['key'], XoSr['id']>
  nics?: Record<XoV2vNic['key'], XoNetwork['id']>
  template?: XoVmTemplate['id']
  tags: string[]
  keepMac: boolean
}

// Body of `POST /pools/{id}/actions/import_vms_from_vmware`: the pool is in the path. Checked against the body of the
// route when the REST API is built, which refuses any extra key
export type XoV2vStartPayload = {
  connection: XoV2vConnection
  defaults: XoV2vStartOptions & {
    sr: XoSr['id']
    network: XoNetwork['id']
    template: XoVmTemplate['id']
  }
  vms: XoV2vStartPayloadVm[]
  stopOnError: boolean
  concurrency: number
}
