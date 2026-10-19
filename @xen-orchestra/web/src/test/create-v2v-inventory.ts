import {
  V2V_DISK_MODE,
  V2V_FIRMWARE,
  V2V_VM_POWER_STATE,
  type XoV2vDatastore,
  type XoV2vDisk,
  type XoV2vInventory,
  type XoV2vVm,
} from '@vates/types'

export const V2V_TEST_SOURCE = {
  product: 'VMware vCenter Server',
  version: '8.0.2',
  instanceUuid: 'vcenter-uuid-1',
} as const

const DATASTORE_ID = 'datastore-1' as XoV2vDatastore['id']

export function createV2vDatastore(overrides: Partial<XoV2vDatastore> = {}): XoV2vDatastore {
  return {
    id: DATASTORE_ID,
    name: 'ds-prod-01',
    type: 'VMFS',
    capacity: 4 * 1024 ** 4,
    free: 1024 ** 4,
    hostIds: [],
    ...overrides,
  }
}

export function createV2vDisk(overrides: Partial<XoV2vDisk> = {}): XoV2vDisk {
  return {
    key: 'scsi0:0' as XoV2vDisk['key'],
    label: 'Hard disk 1',
    datastoreId: DATASTORE_ID,
    capacity: 80 * 1024 ** 3,
    mode: V2V_DISK_MODE.PERSISTENT,
    isRdm: false,
    isEncrypted: false,
    ...overrides,
  }
}

export function createV2vVm(overrides: Partial<XoV2vVm> = {}): XoV2vVm {
  return {
    id: 'vm-1' as XoV2vVm['id'],
    instanceUuid: 'vm-instance-uuid-1',
    name: 'app-03',
    description: '',
    powerState: V2V_VM_POWER_STATE.POWERED_ON,
    hostId: 'host-1' as XoV2vVm['hostId'],
    nCpus: 4,
    memory: 16 * 1024 ** 3,
    firmware: V2V_FIRMWARE.UEFI,
    secureBoot: false,
    datastoreIds: [DATASTORE_ID],
    snapshotCount: 0,
    disks: [createV2vDisk()],
    nics: [],
    ...overrides,
  }
}

export function createV2vVmWithDisks(disks: Partial<XoV2vDisk>[], overrides: Partial<XoV2vVm> = {}): XoV2vVm {
  return createV2vVm({ disks: disks.map(disk => createV2vDisk(disk)), ...overrides })
}

export function createV2vInventory(overrides: Partial<XoV2vInventory> = {}): XoV2vInventory {
  return {
    ...V2V_TEST_SOURCE,
    datacenters: [],
    clusters: [],
    hosts: [],
    datastores: [createV2vDatastore()],
    portGroups: [],
    vms: [createV2vVm()],
    ...overrides,
  }
}
