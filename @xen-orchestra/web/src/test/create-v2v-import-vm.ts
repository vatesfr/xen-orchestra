import type { FrontXoVmSnapshot } from '@/modules/snapshot/components/remote-resources/use-xo-vm-snapshot-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { V2V_TEST_SOURCE, V2V_VM_ID } from '@/test/create-v2v-inventory.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVmSnapshot } from '@/test/create-vm-snapshot.ts'
import { createVm } from '@/test/create-vm.ts'
import {
  V2V_SNAPSHOT_NAME,
  V2V_START_BLOCKED_REASON,
  V2V_VDI_OTHER_CONFIG,
  V2V_VM_OTHER_CONFIG,
  VM_OPERATIONS,
} from '@vates/types'

const IMPORT_VM_ID = 'xo-vm-1' as FrontXoVm['id']

// `null` leaves a marker out, as on a legacy import or a VM that is not an import
export type V2vImportVmMarkers = {
  isWarm?: boolean
  isImporting?: boolean
  sourceId?: string | null
  sourceVmId?: string | null
  importedVmUuid?: string | null
}

// Without an explicit `importedVmUuid`, the VM records its own id like a genuine import (not a copy).
// An import in progress has locked the start but recorded no source snapshot yet, whatever `isWarm`.
export function createV2vImportVm(
  {
    isWarm = true,
    isImporting = false,
    sourceId = V2V_TEST_SOURCE.instanceUuid,
    sourceVmId = V2V_VM_ID,
    importedVmUuid,
  }: V2vImportVmMarkers = {},
  overrides: Partial<FrontXoVm> = {}
): FrontXoVm {
  const id = overrides.id ?? IMPORT_VM_ID
  const hasSourceSnapshot = isWarm && !isImporting
  const isStartBlocked = isWarm || isImporting

  const markers = {
    [V2V_VM_OTHER_CONFIG.SOURCE_VM_ID]: sourceVmId,
    [V2V_VM_OTHER_CONFIG.SOURCE_ID]: sourceId,
    [V2V_VM_OTHER_CONFIG.IMPORTED_VM_UUID]: importedVmUuid === undefined ? id : importedVmUuid,
    [V2V_VM_OTHER_CONFIG.SOURCE_SNAPSHOT_ID]: hasSourceSnapshot ? 'snapshot-1' : null,
  }

  return createVm({
    id,
    other: Object.fromEntries(Object.entries(markers).filter(([, value]) => value !== null)) as FrontXoVm['other'],
    blockedOperations: (isStartBlocked
      ? { [VM_OPERATIONS.START]: V2V_START_BLOCKED_REASON }
      : {}) as FrontXoVm['blockedOperations'],
    ...overrides,
  })
}

// One cold and one warm import of the test source, each with its own id
export function createV2vColdAndWarmImportVms(): FrontXoVm[] {
  return [
    createV2vImportVm({ isWarm: false }, { id: 'xo-vm-1' as FrontXoVm['id'] }),
    createV2vImportVm({ isWarm: true }, { id: 'xo-vm-2' as FrontXoVm['id'] }),
  ]
}

// The snapshot each partial import leaves on the VM of `createV2vImportVm`
export function createV2vPartialImportSnapshot(overrides: Partial<FrontXoVmSnapshot> = {}): FrontXoVmSnapshot {
  return createVmSnapshot({
    $snapshot_of: IMPORT_VM_ID,
    name_label: V2V_SNAPSHOT_NAME.AFTER_PARTIAL_IMPORT,
    ...overrides,
  })
}

// The snapshot the cutover leaves on the VM of `createV2vImportVm`
export function createV2vCompleteImportSnapshot(overrides: Partial<FrontXoVmSnapshot> = {}): FrontXoVmSnapshot {
  return createV2vPartialImportSnapshot({ name_label: V2V_SNAPSHOT_NAME.COMPLETE_IMPORT, ...overrides })
}

// The VDI an import made on an SR from the last disk of a source chain, named `vdi-<name>`, and the VBD `vbd-<name>`
// plugging it into the import VM
export function createV2vImportedDisk(name: string, srId: FrontXoSr['id'], diskPath: string) {
  const vdi = createVdi({
    id: `vdi-${name}` as FrontXoVdi['id'],
    $SR: srId,
    other_config: { [V2V_VDI_OTHER_CONFIG.DISK_PATH]: diskPath },
  })

  return { vdi, vbd: createVbd({ id: `vbd-${name}` as FrontXoVbd['id'], VDI: vdi.id }) }
}
