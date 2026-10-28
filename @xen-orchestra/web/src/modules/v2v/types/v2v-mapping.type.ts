import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { XoV2vDisk, XoV2vNic } from '@vates/types'

export type V2vTargetOrigin = 'default' | 'overridden'

// A stored target may have left the pool offers since (SR deleted, turned read-only…)
export type V2vResolvedTarget<TId> = {
  value: TId
  origin: V2vTargetOrigin
  isOffered: boolean
}

export type V2vDiskMapping = {
  disk: XoV2vDisk
  sr: V2vResolvedTarget<FrontXoSr['id']>
}

export type V2vNicMapping = {
  nic: XoV2vNic
  network: V2vResolvedTarget<FrontXoNetwork['id']>
}

// What a target select offers, labelled the way the destination step labels it
export type V2vTargetOption<TId> = {
  id: TId
  label: string
}

// The source facts of a disk or a NIC are named after the inventory, ready to show
export type V2vDiskMappingRow = {
  key: XoV2vDisk['key']
  label: string
  datastore: string
  size: number
  sr: V2vResolvedTarget<FrontXoSr['id']>
}

export type V2vNicMappingRow = {
  key: XoV2vNic['key']
  label: string
  portGroupParts: string[]
  macAddress: string
  network: V2vResolvedTarget<FrontXoNetwork['id']>
}

// Whether a mapping is locked is the kind of its VM (resumed), not a state of the mapping
export type V2vVmMappingState = 'complete' | 'incomplete'

export type V2vVmMapping = {
  disks: V2vDiskMapping[]
  nics: V2vNicMapping[]
  template: V2vResolvedTarget<FrontXoVmTemplate['id']>
  state: V2vVmMappingState
}

// A source device the import has not paired has no destination
export type V2vActiveDiskMapping = {
  disk: XoV2vDisk
  srId?: FrontXoSr['id']
}

export type V2vActiveNicMapping = {
  nic: XoV2vNic
  networkId?: FrontXoNetwork['id']
  isMacKept: boolean
}

export type V2vActiveMapping = {
  disks: V2vActiveDiskMapping[]
  nics: V2vActiveNicMapping[]
}
