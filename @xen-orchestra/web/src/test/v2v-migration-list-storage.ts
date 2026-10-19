import type { V2vMigrationList, V2vMigrationListKey } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { getV2vMigrationListStorageKey } from '@/modules/v2v/utils/v2v-migration-list.util.ts'
import { createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { readLocalStorageJson } from '@/test/local-storage.ts'

export function seedV2vMigrationList(list: V2vMigrationList) {
  localStorage.setItem(getV2vMigrationListStorageKey(list), JSON.stringify(list))
}

export function readV2vMigrationListStorage(key: V2vMigrationListKey = createV2vMigrationList()) {
  return readLocalStorageJson(getV2vMigrationListStorageKey(key))
}
