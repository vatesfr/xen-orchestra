import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import {
  createV2vCompleteImportSnapshot,
  createV2vImportedDisk,
  createV2vImportVm,
} from '@/test/create-v2v-import-vm.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { V2V_DEFAULT_OFFERS, V2V_SSD_SR } from '@/test/v2v-mapping-fixtures.ts'
import {
  seedV2vMappingStepCollections,
  V2V_DB_IMPORT_VM,
  V2V_DB_SYNC_SNAPSHOT,
  V2V_GONE_VM_ID,
} from '@/test/v2v-mapping-step-fixtures.ts'
import { V2V_DB_VM, V2V_LISTED_VM, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { XoV2vVm } from '@vates/types'

// A list of the review step pool and defaults, on these VMs
export function createV2vReviewStepList(vms: V2vMigrationList['vms']) {
  return createV2vMigrationList({ poolId: V2V_LIST_POOL.id, vms })
}

// The web VM is new, the DB one resumed, the listed one already migrated, the last one gone from the source
export const V2V_REVIEW_STEP_LIST = createV2vReviewStepList([
  { id: V2V_WEB_VM.id },
  { id: V2V_DB_VM.id },
  { id: V2V_LISTED_VM.id },
  { id: V2V_GONE_VM_ID },
])

// Its one VM is gone from the source: nothing to launch
export const V2V_REVIEW_STEP_EXCLUDED_LIST = createV2vReviewStepList([{ id: V2V_GONE_VM_ID }])

export const V2V_MIGRATED_VM_POOL = createPool({ id: 'pool-forcair' as FrontXoPool['id'], name_label: 'forcair' })

export const V2V_MIGRATED_VM_SR = createSr({ id: 'sr-migrated' as FrontXoSr['id'], name_label: 'sr-ssd-03' })

// The disk an import made of the first disk of a source VM, on an SR
function createImportedDisk(vm: XoV2vVm, sr: FrontXoSr) {
  return createV2vImportedDisk(vm.id, sr.id, vm.disks[0].chainPaths[0])
}

const RESUMED_DISK = createImportedDisk(V2V_DB_VM, V2V_SSD_SR)

const MIGRATED_DISK = createImportedDisk(V2V_LISTED_VM, V2V_MIGRATED_VM_SR)

// The DB VM synced its first disk to the SSD SR of the pool of the list
export const V2V_REVIEW_DB_IMPORT_VM: FrontXoVm = { ...V2V_DB_IMPORT_VM, $VBDs: [RESUMED_DISK.vbd.id] }

// The listed VM was cut over to another pool
export const V2V_MIGRATED_IMPORT_VM = createV2vImportVm(
  { isWarm: false, sourceVmId: V2V_LISTED_VM.id },
  {
    id: 'xo-vm-migrated' as FrontXoVm['id'],
    name_label: 'listed-01 (imported)',
    $pool: V2V_MIGRATED_VM_POOL.id,
    $VBDs: [MIGRATED_DISK.vbd.id],
  }
)

export const V2V_CUTOVER_SNAPSHOT = createV2vCompleteImportSnapshot({ $snapshot_of: V2V_MIGRATED_IMPORT_VM.id })

// The mapping step collections, plus the import, the pool, the SR and the cutover snapshot of the migrated VM, and the
// disks of both imports
export function seedV2vReviewStepCollections() {
  seedV2vMappingStepCollections()
  destinationCollectionsMock.pools.value = [V2V_LIST_POOL, V2V_MIGRATED_VM_POOL]
  destinationCollectionsMock.srs.value = [...V2V_DEFAULT_OFFERS.srs, V2V_SSD_SR, V2V_MIGRATED_VM_SR]
  v2vVmRowsCollectionsMock.vms.value = [V2V_REVIEW_DB_IMPORT_VM, V2V_MIGRATED_IMPORT_VM]
  v2vVmRowsCollectionsMock.snapshots.value = [V2V_DB_SYNC_SNAPSHOT, V2V_CUTOVER_SNAPSHOT]
  vmDeviceCollectionsMock.vbds.value = [RESUMED_DISK.vbd, MIGRATED_DISK.vbd]
  vmDeviceCollectionsMock.vdis.value = [RESUMED_DISK.vdi, MIGRATED_DISK.vdi]
}
