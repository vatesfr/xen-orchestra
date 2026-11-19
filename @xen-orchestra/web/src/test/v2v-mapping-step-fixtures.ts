import { createV2vImportVm, createV2vPartialImportSnapshot } from '@/test/create-v2v-import-vm.ts'
import { createV2vDatacenter, createV2vHost } from '@/test/create-v2v-inventory.ts'
import { createV2vMigrationList, createV2vMigrationListVmsOf } from '@/test/create-v2v-migration-list.ts'
import { v2vVmRowsCollectionsMock } from '@/test/mock-xo-v2v-vm-rows-collections.ts'
import { seedV2vListPool } from '@/test/seed-v2v-list-pool.ts'
import { V2V_DB_VM, V2V_VMS_INVENTORY, V2V_WEB_VM } from '@/test/v2v-vms-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { XoV2vVm } from '@vates/types'

export const V2V_GONE_VM_ID = 'vm-gone' as XoV2vVm['id']

// The web VM is new, the DB one resumed, the last one gone from the source
export const V2V_MAPPING_STEP_LIST = createV2vMigrationList({
  poolId: V2V_LIST_POOL.id,
  vms: createV2vMigrationListVmsOf([V2V_WEB_VM.id, V2V_DB_VM.id, V2V_GONE_VM_ID]),
})

export const V2V_MAPPING_STEP_DATACENTER = createV2vDatacenter()

// Every VM of the inventory runs on its one host
export const V2V_MAPPING_STEP_INVENTORY = {
  ...V2V_VMS_INVENTORY,
  hosts: [createV2vHost()],
  datacenters: [V2V_MAPPING_STEP_DATACENTER],
}

export const V2V_DB_IMPORT_VM = createV2vImportVm(
  { isWarm: true, sourceVmId: V2V_DB_VM.id },
  { $pool: V2V_LIST_POOL.id }
)

export const V2V_DB_SYNC_SNAPSHOT = createV2vPartialImportSnapshot()

// The pool of the list offers its defaults; the DB VM was synced once to it
export function seedV2vMappingStepCollections() {
  seedV2vListPool()
  v2vVmRowsCollectionsMock.vms.value = [V2V_DB_IMPORT_VM]
  v2vVmRowsCollectionsMock.snapshots.value = [V2V_DB_SYNC_SNAPSHOT]
}
