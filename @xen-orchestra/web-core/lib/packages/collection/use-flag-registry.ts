import { objectFromEntries, objectEntries } from '@core/utils/object.util.ts'
import type { CollectionConfigFlags, CollectionItemId, FlagConfig, FlagRegistry } from './types.ts'
import { isRef, reactive, toValue, watch } from 'vue'

export function useFlagRegistry<TFlag extends string, TId extends CollectionItemId>(
  config: CollectionConfigFlags<TFlag> = [] as TFlag[]
): FlagRegistry<TId, TFlag> {
  const registry = reactive(new Map()) as Map<TFlag, Set<TId>>

  const flags = Array.isArray(config)
    ? objectFromEntries(config.map(flag => [flag, { multiple: true } as FlagConfig]))
    : config

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

    return registry.get(flag)?.has(id) ?? false
  }

  function toggleFlag(id: TId, flag: TFlag, shouldBeFlagged = !isFlagged(id, flag)) {
    assertFlag(flag)

    if (!registry.has(flag)) {
      registry.set(flag, new Set())
    }

    const flagSet = registry.get(flag)!

    if (shouldBeFlagged === flagSet.has(id)) {
      return
    }

    if (!shouldBeFlagged) {
      flagSet.delete(id)
      return
    }

    if (!isMultipleAllowed(flag) && flagSet.size > 0) {
      clearFlag(flag)
    }

    flagSet.add(id)
  }

  function clearFlag(flag: TFlag) {
    assertFlag(flag)

    if (!registry.has(flag) || registry.get(flag)!.size === 0) {
      return
    }

    registry.get(flag)!.clear()
  }

  function isMultipleAllowed(flag: TFlag) {
    assertFlag(flag)

    return toValue(flags[flag]?.multiple) ?? true
  }

  return {
    isFlagged,
    isFlagDefined,
    toggleFlag,
    clearFlag,
    isMultipleAllowed,
    assertFlag,
  }
}
