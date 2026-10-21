import type {
  V2vDestinationDefaults,
  V2vMigrationList,
  V2vMigrationListKey,
  V2vMigrationListVm,
} from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { isBoolean, isPlainObject, isString } from 'lodash-es'

const DEFAULTS_FIELDS = ['sr', 'network', 'template'] as const

function isDestinationDefaults(value: unknown): value is V2vDestinationDefaults {
  return isPlainObject(value) && DEFAULTS_FIELDS.every(field => isString((value as Record<string, unknown>)[field]))
}

function isStringRecord(value: unknown) {
  return isPlainObject(value) && Object.values(value as Record<string, unknown>).every(isString)
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every(isString)
}

const VM_OVERRIDE_CHECKS: Record<Exclude<keyof V2vMigrationListVm, 'id'>, (value: unknown) => boolean> = {
  disks: isStringRecord,
  nics: isStringRecord,
  template: isString,
  keepMac: isBoolean,
  tags: isStringArray,
}

// Overrides are optional: only those present must have their shape
function isMigrationListVm(value: unknown): value is V2vMigrationListVm {
  if (!isPlainObject(value)) {
    return false
  }

  const vm = value as Record<string, unknown>

  return (
    isString(vm.id) &&
    Object.entries(VM_OVERRIDE_CHECKS).every(([field, isValid]) => vm[field] === undefined || isValid(vm[field]))
  )
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
