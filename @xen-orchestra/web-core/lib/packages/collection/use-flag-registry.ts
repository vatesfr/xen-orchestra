import { objectFromEntries, objectEntries } from '@core/utils/object.util.ts'
import type { CollectionConfigFlags, CollectionItemId, FlagConfig, FlagRegistry } from './types.ts'
import { computed, type ComputedRef, isRef, type Ref, shallowRef, unref, watch } from 'vue'

export function useFlagRegistry<TFlag extends string, TId extends CollectionItemId>(
  config: CollectionConfigFlags<TFlag, TId> = {} as CollectionConfigFlags<TFlag, TId>
): FlagRegistry<TId, TFlag> {
  const flags = objectFromEntries(
    objectEntries(config).map(([flag, flagConfig]): [TFlag, FlagConfig<TId>] => [
      flag,
      flagConfig === true ? {} : flagConfig,
    ])
  )

  const flaggedIdsByFlag = objectFromEntries(
    objectEntries(flags).map(([flag, { ids = shallowRef<TId[]>([]) }]): [TFlag, Ref<TId[]>] => [flag, ids])
  )

  const flaggedIdSetsByFlag = objectFromEntries(
    objectEntries(flaggedIdsByFlag).map(([flag, flaggedIds]): [TFlag, ComputedRef<Set<TId>>] => [
      flag,
      computed(() => new Set(flaggedIds.value)),
    ])
  )

  for (const [flag, { multiple }] of objectEntries(flags)) {
    if (isRef(multiple)) {
      watch(multiple, () => clearFlag(flag))
    }
  }

  function isFlagDefined(flag: TFlag) {
    return Object.prototype.hasOwnProperty.call(flags, flag)
  }

  function assertFlag(flag: TFlag) {
    if (!isFlagDefined(flag)) {
      throw new Error(`Flag "${flag}" is not defined.`)
    }
  }

  function isFlagged(id: TId, flag: TFlag) {
    assertFlag(flag)

    return flaggedIdSetsByFlag[flag].value.has(id)
  }

  function setFlaggedIds(flag: TFlag, ids: TId[]) {
    const flaggedIds = flaggedIdsByFlag[flag]

    if (ids.length === flaggedIds.value.length && ids.every((id, index) => id === flaggedIds.value[index])) {
      return
    }

    flaggedIds.value = ids
  }

  function toggleFlag(id: TId, flag: TFlag, shouldBeFlagged = !isFlagged(id, flag)) {
    toggleFlags([id], flag, shouldBeFlagged)
  }

  function toggleFlags(ids: TId[], flag: TFlag, shouldBeFlagged: boolean) {
    assertFlag(flag)

    if (ids.length === 0) {
      return
    }

    const flaggedIds = flaggedIdsByFlag[flag].value

    if (!shouldBeFlagged) {
      const idSet = new Set(ids)

      setFlaggedIds(
        flag,
        flaggedIds.filter(id => !idSet.has(id))
      )

      return
    }

    if (!isMultipleAllowed(flag)) {
      setFlaggedIds(flag, ids.slice(-1))

      return
    }

    const flaggedIdSet = flaggedIdSetsByFlag[flag].value

    setFlaggedIds(flag, [...flaggedIds, ...ids.filter(id => !flaggedIdSet.has(id))])
  }

  function clearFlag(flag: TFlag) {
    assertFlag(flag)

    setFlaggedIds(flag, [])
  }

  function isMultipleAllowed(flag: TFlag) {
    assertFlag(flag)

    return unref(flags[flag]?.multiple) ?? true
  }

  return {
    isFlagged,
    isFlagDefined,
    toggleFlag,
    toggleFlags,
    clearFlag,
    isMultipleAllowed,
    assertFlag,
  }
}
