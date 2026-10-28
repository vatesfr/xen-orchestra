import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
import { createVm } from '@/test/create-vm.ts'
import { V2V_START_BLOCKED_REASON, V2V_VM_OTHER_CONFIG, VM_OPERATIONS } from '@vates/types'

// `null` leaves a marker out, as on a legacy import or a VM that is not an import
export type V2vImportVmMarkers = {
  isWarm?: boolean
  sourceId?: string | null
  sourceVmId?: string | null
  importedVmUuid?: string | null
}

// Without an explicit `importedVmUuid`, the VM records its own id like a genuine import (not a copy)
export function createV2vImportVm(
  {
    isWarm = true,
    sourceId = V2V_TEST_SOURCE.instanceUuid,
    sourceVmId = 'vm-1',
    importedVmUuid,
  }: V2vImportVmMarkers = {},
  overrides: Partial<FrontXoVm> = {}
): FrontXoVm {
  const id = overrides.id ?? ('xo-vm-1' as FrontXoVm['id'])

  const markers = {
    [V2V_VM_OTHER_CONFIG.SOURCE_VM_ID]: sourceVmId,
    [V2V_VM_OTHER_CONFIG.SOURCE_ID]: sourceId,
    [V2V_VM_OTHER_CONFIG.IMPORTED_VM_UUID]: importedVmUuid === undefined ? id : importedVmUuid,
    [V2V_VM_OTHER_CONFIG.SOURCE_SNAPSHOT_ID]: isWarm ? 'snapshot-1' : null,
  }

  return createVm({
    id,
    other: Object.fromEntries(Object.entries(markers).filter(([, value]) => value !== null)) as FrontXoVm['other'],
    blockedOperations: (isWarm
      ? { [VM_OPERATIONS.START]: V2V_START_BLOCKED_REASON }
      : {}) as FrontXoVm['blockedOperations'],
    ...overrides,
  })
}
