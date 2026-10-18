// shape of `Esxi#getInventory()` in `@xen-orchestra/vmware-explorer`
// the objects reference each other through their VMware managed object references (moref)

export type VmwareDatacenter = {
  id: string
  name: string
  datastores: string[]
  networks: string[]
}

export type VmwareCluster = {
  id: string
  name: string
  parent?: string
  hosts: string[]
}

export type VmwareHost = {
  id: string
  name: string
  /** a cluster, or the compute resource of a standalone host */
  parent?: string
}

export type VmwareDatastore = {
  id: string
  name?: string
  type?: string
  url?: string
  capacity?: number
  freeSpace?: number
  accessible: boolean
}

export type VmwareVlan = number | { start: number; end: number }[]

export type VmwareStandardNetwork = {
  id: string
  name: string
  distributed: false
}

export type VmwareDistributedPortgroup = {
  id: string
  name: string
  distributed: true
  key: string
  vlan?: VmwareVlan
}

export type VmwareNetwork = VmwareStandardNetwork | VmwareDistributedPortgroup

export type VmwareVmDisk = {
  /** node of the disk, as the vmx names it, e.g. `scsi0:0` */
  key: string
  label: string
  capacity: number
  fileName?: string
  datastore?: string
  diskMode?: string
  backingType?: string
  thinProvisioned: boolean
  rdm: boolean
  encrypted: boolean
}

export type VmwareVmNic = {
  /** device key of the card */
  key: string
  label: string
  macAddress?: string
  addressType?: string
  network?: string
  portgroupKey?: string
  opaqueNetworkId?: string
  /** what the predictable name of the card in the guest derives from (192 → `ens192`) */
  pciSlotNumber?: number
}

export type VmwareVmSnapshot = {
  id: string
  name: string
  description?: string
  createTime?: string
  parent?: string
}

export type VmwareVm = {
  id: string
  name?: string
  annotation?: string
  instanceUuid?: string
  firmware?: string
  secureBoot: boolean
  guestId?: string
  guestFullName?: string
  isTemplate: boolean
  cpus?: number
  memory?: number
  powerState?: 'poweredOff' | 'poweredOn' | 'suspended'
  host?: string
  datastores: string[]
  networks: string[]
  currentSnapshot?: string
  snapshots: VmwareVmSnapshot[]
  disks: VmwareVmDisk[]
  nics: VmwareVmNic[]
}

export type VmwareInventory = {
  /** e.g. `VMware vCenter Server`, `VMware ESXi` */
  product?: string
  /** `VirtualCenter` or `HostAgent` */
  productType?: string
  version?: string
  build?: string
  /** only set by a vCenter */
  instanceUuid?: string
  datacenters: VmwareDatacenter[]
  clusters: VmwareCluster[]
  hosts: VmwareHost[]
  datastores: VmwareDatastore[]
  networks: VmwareNetwork[]
  vms: VmwareVm[]
}
