import { createPool, DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import { createV2vMigrationList, createV2vMigrationListVms } from '@/test/create-v2v-migration-list.ts'

// The source the wizard connects to, the lists stored for one of its pools, without VMs then with some, and that pool
export const V2V_WIZARD_SOURCE = { connection: createV2vConnection() }

export const V2V_EMPTY_LIST = createV2vMigrationList()

export const V2V_LIST_WITH_VMS = createV2vMigrationList({ vms: createV2vMigrationListVms(2) })

export const V2V_LIST_POOL = createPool({ id: V2V_EMPTY_LIST.poolId, name_label: DISKOR_POOL_NAME })
