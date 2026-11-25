import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { countOccurrences } from '@/shared/utils/count.util.ts'
import { V2V_VM_OTHER_CONFIG, VM_OPERATIONS, type XoV2vVm } from '@vates/types'

const V2V_IMPORT_STATES = ['warm', 'cold'] as const

export type V2vImportState = (typeof V2V_IMPORT_STATES)[number]

export type V2vImportCounts = Record<V2vImportState, number>

export type V2vImportVm = Pick<FrontXoVm, 'id' | 'other' | 'blockedOperations'>

// Clones, restores and replicas inherit `other_config`: only the VM whose recorded UUID is its own is the import.
// Imports made before the UUID was recorded cannot be told from their copies and are trusted.
function isGenuineImport(vm: V2vImportVm) {
  const importedVmUuid = vm.other[V2V_VM_OTHER_CONFIG.IMPORTED_VM_UUID]

  return vm.other[V2V_VM_OTHER_CONFIG.SOURCE_VM_ID] !== undefined && (importedVmUuid ?? vm.id) === vm.id
}

function isFromSource(vm: V2vImportVm, sourceId: string) {
  return vm.other[V2V_VM_OTHER_CONFIG.SOURCE_ID] === sourceId
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
  const states = vms.filter(vm => isFromSource(vm, sourceId)).flatMap(vm => getV2vImportState(vm) ?? [])

  return countOccurrences(V2V_IMPORT_STATES, states)
}

export function getV2vImportVmsBySourceVmId<TVm extends V2vImportVm>(
  vms: TVm[],
  sourceId: string
): Map<XoV2vVm['id'], TVm> {
  const importVmsBySourceVmId = new Map<XoV2vVm['id'], TVm>()

  for (const vm of vms) {
    // `other_config` is untyped storage: the moref recorded at import time is the source VM id
    const sourceVmId = vm.other[V2V_VM_OTHER_CONFIG.SOURCE_VM_ID] as XoV2vVm['id']
    const isNewImport = isFromSource(vm, sourceId) && isGenuineImport(vm) && !importVmsBySourceVmId.has(sourceVmId)

    if (isNewImport) {
      importVmsBySourceVmId.set(sourceVmId, vm)
    }
  }

  return importVmsBySourceVmId
}
