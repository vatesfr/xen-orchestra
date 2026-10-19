import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { V2V_VM_OTHER_CONFIG, VM_OPERATIONS } from '@vates/types'

export type V2vImportState = 'warm' | 'cold'

export type V2vImportCounts = Record<V2vImportState, number>

type V2vImportVm = Pick<FrontXoVm, 'id' | 'other' | 'blockedOperations'>

// Clones, restores and replicas inherit `other_config`: only the VM whose recorded UUID is its own is the import.
// Imports made before the UUID was recorded cannot be told from their copies and are trusted.
function isGenuineImport(vm: V2vImportVm) {
  const importedVmUuid = vm.other[V2V_VM_OTHER_CONFIG.IMPORTED_VM_UUID]

  return vm.other[V2V_VM_OTHER_CONFIG.SOURCE_VM_ID] !== undefined && (importedVmUuid ?? vm.id) === vm.id
}

// The start lock tells warm from cold (spec): locked without a source snapshot to resume from, the import is still
// running, which only the tasks can tell, so it is neither
export function getV2vImportState(vm: V2vImportVm): V2vImportState | undefined {
  if (!isGenuineImport(vm)) {
    return undefined
  }

  const isStartBlocked = Boolean(vm.blockedOperations[VM_OPERATIONS.START])

  if (!isStartBlocked) {
    return 'cold'
  }

  const hasSourceSnapshot = vm.other[V2V_VM_OTHER_CONFIG.SOURCE_SNAPSHOT_ID] !== undefined

  return hasSourceSnapshot ? 'warm' : undefined
}

export function countV2vImportsBySource(vms: V2vImportVm[], sourceId: string): V2vImportCounts {
  const counts: V2vImportCounts = { warm: 0, cold: 0 }

  for (const vm of vms) {
    const state = vm.other[V2V_VM_OTHER_CONFIG.SOURCE_ID] === sourceId ? getV2vImportState(vm) : undefined

    if (state !== undefined) {
      counts[state]++
    }
  }

  return counts
}
