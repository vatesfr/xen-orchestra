import type { V2V_VM_STATUSES } from '@/modules/v2v/utils/v2v-vm-status.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vVm } from '@vates/types'

export type V2vVmStatus = (typeof V2V_VM_STATUSES)[number]

export type V2vUnsupportedReason = 'rdm' | 'independent' | 'encrypted'

// A resumed import sends the delta since its last sync, or the whole disks again
export type V2vNextTransfer = 'delta' | 'full'

// Field names double as the query builder property names
export type V2vVmRow = {
  id: XoV2vVm['id']
  name: string
  power: XoV2vVm['powerState']
  datastore: string[]
  size: number
  migration: V2vVmStatus
  supported: boolean
  unsupportedReason?: V2vUnsupportedReason
  lastSyncAt?: number
  isInList: boolean
  importVm?: FrontXoVm
  vm: XoV2vVm
}

export type V2vVmViewRow = V2vVmRow & {
  isSelectable: boolean
  isSelected: boolean
}

export type V2vVmDatastoreViewRow = V2vVmViewRow & {
  otherDatastores: string[]
  sizeOnDatastore: number
}

// The table shows all the VMs, or those of one datastore with what concerns that datastore
export type V2vVmsTableView =
  | { type: 'all'; rows: V2vVmViewRow[] }
  | { type: 'datastore'; rows: V2vVmDatastoreViewRow[] }
