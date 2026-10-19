import type {
  V2vDestinationDefaults,
  V2vMigrationList,
  V2vMigrationListKey,
  V2vMigrationListVm,
} from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { isPlainObject } from 'lodash-es'

const DEFAULTS_FIELDS = ['sr', 'network', 'template'] as const

function isDestinationDefaults(value: unknown): value is V2vDestinationDefaults {
  return (
    isPlainObject(value) &&
    DEFAULTS_FIELDS.every(field => typeof (value as Record<string, unknown>)[field] === 'string')
  )
}

function isMigrationListVm(value: unknown): value is V2vMigrationListVm {
  return isPlainObject(value) && typeof (value as Record<string, unknown>).id === 'string'
}

export function getV2vMigrationListStorageKey({ sourceId, poolId }: V2vMigrationListKey) {
  return `v2v:migration-list:${sourceId}:${poolId}`
}

export function buildV2vMigrationList(
  { sourceId, poolId }: V2vMigrationListKey,
  defaults: V2vDestinationDefaults,
  vms: V2vMigrationListVm[] = []
): V2vMigrationList {
  return { version: 1, sourceId, poolId, defaults, vms }
}

// The list lives in a storage any script or older XO version may have written: anything unexpected is no list
export function parseV2vMigrationList(raw: unknown, key: V2vMigrationListKey): V2vMigrationList | undefined {
  if (!isPlainObject(raw)) {
    return undefined
  }

  const list = raw as Record<string, unknown>

  const isValidList =
    list.version === 1 &&
    list.sourceId === key.sourceId &&
    list.poolId === key.poolId &&
    isDestinationDefaults(list.defaults) &&
    Array.isArray(list.vms) &&
    list.vms.every(isMigrationListVm)

  if (!isValidList) {
    return undefined
  }

  return buildV2vMigrationList(key, list.defaults as V2vDestinationDefaults, list.vms as V2vMigrationListVm[])
}
