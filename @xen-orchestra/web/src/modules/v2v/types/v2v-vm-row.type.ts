import type { V2vImportState } from '@/modules/v2v/utils/v2v-import-markers.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { XoV2vVm } from '@vates/types'

export type V2vVmStatus = 'none' | 'running' | V2vImportState

export type V2vUnsupportedReason = 'rdm' | 'independent' | 'encrypted'

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
