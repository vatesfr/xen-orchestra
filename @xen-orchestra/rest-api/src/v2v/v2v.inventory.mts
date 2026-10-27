import {
  V2V_DISK_MODE,
  V2V_FIRMWARE,
  V2V_VM_POWER_STATE,
  type VmwareCluster,
  type VmwareDatastore,
  type VmwareHost,
  type VmwareInventory,
  type VmwareNetwork,
  type VmwareVm,
  type VmwareVmDisk,
  type VmwareVmNic,
  type XoV2vCluster,
  type XoV2vDatacenter,
  type XoV2vDatastore,
  type XoV2vDisk,
  type XoV2vHost,
  type XoV2vInventory,
  type XoV2vNic,
  type XoV2vPortGroup,
  type XoV2vVm,
} from '@vates/types'

// The raw inventory of `@xen-orchestra/vmware-explorer` is shaped after the VMware API: the contract of the wizard
// only keeps what it shows, with relations pointing up (host → cluster → datacenter) instead of down

type LocatedCluster = VmwareCluster & { datacenter: string }
type LocatedHost = VmwareHost & { datacenter: string }
type MigratableVm = VmwareVm & { isTemplate: false }

// a cluster or a host outside of any datacenter cannot be shown in the tree of the source
const isLocatedCluster = (cluster: VmwareCluster): cluster is LocatedCluster => cluster.datacenter !== undefined
const isLocatedHost = (host: VmwareHost): host is LocatedHost => host.datacenter !== undefined

// a VMware template cannot be powered on, so it is not a VM to migrate
const isMigratableVm = (vm: VmwareVm): vm is MigratableVm => !vm.isTemplate

const DISK_MODES = new Set<string>(Object.values(V2V_DISK_MODE))

function toDiskMode(diskMode: string | undefined): V2V_DISK_MODE {
  // `persistent` is the default mode of vSphere when the backing does not say
  return diskMode !== undefined && DISK_MODES.has(diskMode) ? (diskMode as V2V_DISK_MODE) : V2V_DISK_MODE.PERSISTENT
}

function toCluster({ id, name, datacenter }: LocatedCluster): XoV2vCluster {
  return { id: id as XoV2vCluster['id'], name, datacenterId: datacenter as XoV2vDatacenter['id'] }
}

function toHost({ id, name, parent, datacenter }: LocatedHost, clusterIds: ReadonlySet<string>): XoV2vHost {
  // the parent of a standalone host is its own compute resource, not a cluster
  const clusterId = parent !== undefined && clusterIds.has(parent) ? (parent as XoV2vCluster['id']) : undefined
  return { id: id as XoV2vHost['id'], name, clusterId, datacenterId: datacenter as XoV2vDatacenter['id'] }
}

function toDatastore({ id, name, type, capacity, freeSpace, hosts }: VmwareDatastore): XoV2vDatastore {
  return {
    id: id as XoV2vDatastore['id'],
    // an inaccessible datastore can come without its summary
    name: name ?? id,
    type: type ?? '',
    capacity: capacity ?? 0,
    free: freeSpace ?? 0,
    hostIds: hosts as XoV2vHost['id'][],
  }
}

function toPortGroup(network: VmwareNetwork): XoV2vPortGroup {
  // a trunk carries VLAN ranges, which is not a VLAN of the network
  const vlan = network.distributed && typeof network.vlan === 'number' ? network.vlan : undefined
  return { id: network.id as XoV2vPortGroup['id'], name: network.name, vlan }
}

function toDisk({ key, label, datastore, capacity, diskMode, rdm, encrypted }: VmwareVmDisk): XoV2vDisk {
  return {
    key: key as XoV2vDisk['key'],
    label,
    // a disk is always kept, even without a datastore: dropping it would hide it from the import
    datastoreId: (datastore ?? '') as XoV2vDatastore['id'],
    capacity,
    mode: toDiskMode(diskMode),
    isRdm: rdm,
    isEncrypted: encrypted,
  }
}

function toNic({ key, label, network, macAddress }: VmwareVmNic): XoV2vNic {
  return {
    key: key as XoV2vNic['key'],
    label,
    // undefined for an opaque (NSX) network, which is not listed as a port group
    portGroupId: network as XoV2vPortGroup['id'] | undefined,
    macAddress: macAddress ?? '',
  }
}

function toVm(vm: MigratableVm): XoV2vVm {
  return {
    id: vm.id as XoV2vVm['id'],
    instanceUuid: vm.instanceUuid ?? '',
    name: vm.name ?? vm.id,
    description: vm.annotation ?? '',
    powerState: vm.powerState ?? V2V_VM_POWER_STATE.POWERED_OFF,
    hostId: (vm.host ?? '') as XoV2vHost['id'],
    nCpus: vm.cpus ?? 0,
    memory: vm.memory ?? 0,
    firmware: vm.firmware === V2V_FIRMWARE.UEFI ? V2V_FIRMWARE.UEFI : V2V_FIRMWARE.BIOS,
    secureBoot: vm.secureBoot,
    datastoreIds: vm.datastores as XoV2vDatastore['id'][],
    snapshotCount: vm.snapshotCount,
    currentSnapshotId: vm.currentSnapshot,
    disks: vm.disks.map(toDisk),
    nics: vm.nics.map(toNic),
  }
}

export function toXoV2vInventory(inventory: Readonly<VmwareInventory>): XoV2vInventory {
  const clusters = inventory.clusters.filter(isLocatedCluster)
  const clusterIds = new Set(clusters.map(cluster => cluster.id))

  return {
    product: inventory.product ?? '',
    version: inventory.version ?? '',
    instanceUuid: inventory.instanceUuid,
    datacenters: inventory.datacenters.map(({ id, name }) => ({ id: id as XoV2vDatacenter['id'], name })),
    clusters: clusters.map(toCluster),
    hosts: inventory.hosts.filter(isLocatedHost).map(host => toHost(host, clusterIds)),
    datastores: inventory.datastores.map(toDatastore),
    portGroups: inventory.networks.map(toPortGroup),
    vms: inventory.vms.filter(isMigratableVm).map(toVm),
  }
}
