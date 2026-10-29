// shape of `Esxi#getInventory()` in `@xen-orchestra/vmware-explorer`
// the objects reference each other through their VMware managed object references (moref)

export type VmwareDatacenter = {
  id: string
  name: string
}

export type VmwareCluster = {
  id: string
  name: string
  datacenter?: string
}

export type VmwareHost = {
  id: string
  name: string
  /** a cluster, or the compute resource of a standalone host */
  parent?: string
  datacenter?: string
}

export type VmwareDatastore = {
  id: string
  name?: string
  type?: string
  capacity?: number
  freeSpace?: number
  /** the hosts which mount the datastore and can reach it */
  hosts: string[]
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
  vlan?: VmwareVlan
}

export type VmwareNetwork = VmwareStandardNetwork | VmwareDistributedPortgroup

export type VmwareVmDisk = {
  /** node of the disk, as the vmx names it, e.g. `scsi0:0` */
  key: string
  label: string
  capacity: number
  datastore?: string
  diskMode?: string
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
}

export type VmwareVm = {
  id: string
  name?: string
  annotation?: string
  instanceUuid?: string
  firmware?: string
  secureBoot: boolean
  isTemplate: boolean
  cpus?: number
  memory?: number
  powerState?: 'poweredOff' | 'poweredOn' | 'suspended'
  host?: string
  datastores: string[]
  currentSnapshot?: string
  snapshotCount: number
  disks: VmwareVmDisk[]
  nics: VmwareVmNic[]
}

export type VmwareInventory = {
  /** e.g. `VMware vCenter Server`, `VMware ESXi` */
  product?: string
  version?: string
  /** only set by a vCenter */
  instanceUuid?: string
  datacenters: VmwareDatacenter[]
  clusters: VmwareCluster[]
  hosts: VmwareHost[]
  datastores: VmwareDatastore[]
  networks: VmwareNetwork[]
  vms: VmwareVm[]
}
