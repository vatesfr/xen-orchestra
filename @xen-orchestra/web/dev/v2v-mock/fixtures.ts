import {
  V2V_DISK_MODE,
  V2V_FIRMWARE,
  V2V_VM_POWER_STATE,
  type XoV2vDatacenter,
  type XoV2vDatastore,
  type XoV2vDisk,
  type XoV2vHost,
  type XoV2vInventory,
  type XoV2vNic,
  type XoV2vPortGroup,
  type XoV2vVm,
} from '@vates/types'
import {
  createV2vDatastore,
  createV2vDisk,
  createV2vInventory,
  createV2vNic,
  createV2vVm,
} from '../../src/test/create-v2v-inventory.ts'

const VCENTER_VM_COUNT = 148

const ESXI_VM_COUNT = 9

const SNAPSHOTS_VM_INDEX = 4

// Warm/cold come from real XO VMs, the inventory cannot mock them: to see `app-008` resumed, turn an XO VM of the
// destination pool with 2 VDIs and 2 VIFs into its partial import (`sourceId` is `<host>:<port>` for an ESXi
// source), one VDI paired on a snapshot delta, the other on the base disk:
//   xe vm-param-set uuid=<vm> other-config:xo:v2v:sourceId=mock-vcenter-instance-uuid other-config:sourceVmId=vm-107 \
//     other-config:sourceSnapshotId=2 blocked-operations:start='Esxi migration in progress...'
//   xe vdi-param-set uuid=<1st vdi> other-config:esxi_diskPath=app-008/app-008-000001.vmdk
//   xe vdi-param-set uuid=<2nd vdi> other-config:esxi_diskPath=app-008/app-008_1.vmdk
const WARM_VM_INDEX = 7

// One VM per disk case the VM selection step tells apart: each unsupported disk, and disks on two datastores. The
// last three are past the ESXi VMs, so only the vCenter shows them
const RDM_VM_INDEX = 5

const TWO_DATASTORES_VM_INDEX = 10

const INDEPENDENT_DISK_VM_INDEX = 11

const ENCRYPTED_DISK_VM_INDEX = 12

const DATACENTER_ID = 'datacenter-1' as XoV2vDatacenter['id']

const HOST_ID = 'host-1' as XoV2vHost['id']

const PORT_GROUP_ID = 'network-1' as XoV2vPortGroup['id']

const DATASTORES = [
  { id: 'datastore-11', name: 'ds-prod-01', capacity: 4 * 1024 ** 4, free: 1.1 * 1024 ** 4 },
  { id: 'datastore-12', name: 'ds-prod-02', capacity: 4 * 1024 ** 4, free: 1.1 * 1024 ** 4 },
  { id: 'datastore-13', name: 'ds-local-esx03', capacity: 1024 ** 4, free: 512 * 1024 ** 3 },
].map(({ id, ...datastore }) =>
  createV2vDatastore({ ...datastore, id: id as XoV2vDatastore['id'], hostIds: [HOST_ID] })
)

const SNAPSHOT_COUNTS: Record<number, number> = { [SNAPSHOTS_VM_INDEX]: 1, [WARM_VM_INDEX]: 2 }

// VMware names the deltas of `dir/disk.vmdk` `dir/disk-000001.vmdk`, `dir/disk-000002.vmdk`… one per snapshot
function createChainPaths(directory: string, fileName: string, snapshotCount: number): string[] {
  const deltaPaths = Array.from(
    { length: snapshotCount },
    (_, deltaIndex) => `${directory}/${fileName}-${String(deltaIndex + 1).padStart(6, '0')}.vmdk`
  )

  return [`${directory}/${fileName}.vmdk`, ...deltaPaths]
}

function createDisks(index: number, name: string, snapshotCount: number): XoV2vDisk[] {
  const datastoreId = DATASTORES[index % DATASTORES.length].id

  const disk = createV2vDisk({
    datastoreId,
    capacity: (40 + (index % 5) * 20) * 1024 ** 3,
    mode: index === INDEPENDENT_DISK_VM_INDEX ? V2V_DISK_MODE.INDEPENDENT_PERSISTENT : V2V_DISK_MODE.PERSISTENT,
    isRdm: index === RDM_VM_INDEX,
    isEncrypted: index === ENCRYPTED_DISK_VM_INDEX,
    chainPaths: createChainPaths(name, name, snapshotCount),
  })

  const hasSecondDisk = index === TWO_DATASTORES_VM_INDEX || index === WARM_VM_INDEX

  if (!hasSecondDisk) {
    return [disk]
  }

  const secondDatastoreId =
    index === TWO_DATASTORES_VM_INDEX ? DATASTORES[(index + 1) % DATASTORES.length].id : datastoreId

  return [
    disk,
    createV2vDisk({
      key: 'scsi0:1' as XoV2vDisk['key'],
      label: 'Hard disk 2',
      datastoreId: secondDatastoreId,
      capacity: 200 * 1024 ** 3,
      chainPaths: createChainPaths(name, `${name}_1`, snapshotCount),
    }),
  ]
}

function createNics(index: number): XoV2vNic[] {
  const nicCount = index === WARM_VM_INDEX ? 2 : 1

  return Array.from({ length: nicCount }, (_, nicIndex) =>
    createV2vNic({
      key: `ethernet${nicIndex}` as XoV2vNic['key'],
      label: `Network adapter ${nicIndex + 1}`,
      portGroupId: PORT_GROUP_ID,
      macAddress: `00:50:56:9a:0${nicIndex}:${index.toString(16).padStart(2, '0')}`,
    })
  )
}

// Varied on purpose: the list must show every power state, firmware and size combination
function createVm(index: number): XoV2vVm {
  const name = `app-${String(index + 1).padStart(3, '0')}`
  const snapshotCount = SNAPSHOT_COUNTS[index] ?? 0
  const disks = createDisks(index, name, snapshotCount)

  return createV2vVm({
    id: `vm-${index + 100}` as XoV2vVm['id'],
    instanceUuid: `vm-instance-${index + 100}`,
    name,
    powerState: index % 3 === 0 ? V2V_VM_POWER_STATE.POWERED_OFF : V2V_VM_POWER_STATE.POWERED_ON,
    hostId: HOST_ID,
    nCpus: 2 + (index % 4),
    memory: (4 + (index % 4) * 4) * 1024 ** 3,
    firmware: index % 2 === 0 ? V2V_FIRMWARE.UEFI : V2V_FIRMWARE.BIOS,
    datastoreIds: [...new Set(disks.map(disk => disk.datastoreId))],
    snapshotCount,
    // The vmsd numbers snapshots from 1, the last taken is the current one
    currentSnapshotId: snapshotCount > 0 ? String(snapshotCount) : undefined,
    disks,
    nics: createNics(index),
  })
}

export function createMockInventory(host: string): XoV2vInventory {
  const isVcenter = host.includes('vcenter')

  return createV2vInventory({
    product: isVcenter ? 'VMware vCenter Server' : 'VMware ESXi',
    version: isVcenter ? '8.0.2' : '7.0.3',
    instanceUuid: isVcenter ? 'mock-vcenter-instance-uuid' : undefined,
    datacenters: [{ id: DATACENTER_ID, name: 'DC-Paris' }],
    hosts: [{ id: HOST_ID, name: 'esx01.lab.local', datacenterId: DATACENTER_ID }],
    datastores: DATASTORES,
    portGroups: [{ id: PORT_GROUP_ID, name: 'PG-Prod', vlan: 10 }],
    vms: Array.from({ length: isVcenter ? VCENTER_VM_COUNT : ESXI_VM_COUNT }, (_, index) => createVm(index)),
  })
}
