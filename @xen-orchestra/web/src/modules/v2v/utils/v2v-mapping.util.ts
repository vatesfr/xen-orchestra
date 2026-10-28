import type { V2vResolvedTarget, V2vVmMapping } from '@/modules/v2v/types/v2v-mapping.type.ts'
import type { V2vDestinationDefaults, V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { findOfferedId, type V2vPoolDestinationChoices } from '@/modules/v2v/utils/v2v-destination.util.ts'
import { V2V_PLATFORM, type XoV2vVm } from '@vates/types'
import { isEmpty, isEqual, omit } from 'lodash-es'

// Defaults of the per-VM options: the migration list has no list-level option for them
export const V2V_DEFAULT_KEEP_MAC = true

export const V2V_DEFAULT_TAGS = [`migrated-from:${V2V_PLATFORM.VMWARE}`]

export function resolveV2vTarget<TId>(
  override: TId | undefined,
  defaultValue: TId,
  offered: { id: TId }[]
): V2vResolvedTarget<TId> {
  const value = override ?? defaultValue

  return {
    value,
    origin: override === undefined ? 'default' : 'overridden',
    isOffered: findOfferedId(offered, value) !== undefined,
  }
}

export function getV2vVmMapping(
  vm: Pick<XoV2vVm, 'disks' | 'nics'>,
  listVm: Pick<V2vMigrationListVm, 'disks' | 'nics' | 'template'>,
  defaults: V2vDestinationDefaults,
  offers: V2vPoolDestinationChoices
): V2vVmMapping {
  const disks = vm.disks.map(disk => ({
    disk,
    sr: resolveV2vTarget(listVm.disks?.[disk.key], defaults.sr, offers.srs),
  }))

  const nics = vm.nics.map(nic => ({
    nic,
    network: resolveV2vTarget(listVm.nics?.[nic.key], defaults.network, offers.networks),
  }))

  const template = resolveV2vTarget(listVm.template, defaults.template, offers.templates)

  const targets = [...disks.map(({ sr }) => sr), ...nics.map(({ network }) => network), template]

  return { disks, nics, template, state: targets.every(target => target.isOffered) ? 'complete' : 'incomplete' }
}

// The default value is stored as no override, so that it reads as the default. `undefined` resets it
export function getV2vOverride<TValue>(value: TValue | undefined, defaultValue: TValue): TValue | undefined {
  return isEqual(value, defaultValue) ? undefined : value
}

export function setV2vOverride<TKey extends string, TValue>(
  overrides: Record<TKey, TValue> | undefined,
  key: TKey,
  value: TValue | undefined,
  defaultValue: TValue
): Record<TKey, TValue> | undefined {
  const otherOverrides = omit(overrides, key) as Record<TKey, TValue>

  const override = getV2vOverride(value, defaultValue)

  const nextOverrides = override === undefined ? otherOverrides : { ...otherOverrides, [key]: override }

  return isEmpty(nextOverrides) ? undefined : nextOverrides
}
