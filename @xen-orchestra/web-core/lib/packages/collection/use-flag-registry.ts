import type { CollectionConfigFlags, FlagRegistry } from '@core/packages/collection/types.ts'
import { reactive } from 'vue'

export function useFlagRegistry<TFlag extends string>(
  config: CollectionConfigFlags<TFlag> = [] as TFlag[]
): FlagRegistry<TFlag> {
  const registry = reactive(new Map<TFlag, Set<PropertyKey>>())

  const flags = Array.isArray(config) ? Object.fromEntries(config.map(flag => [flag, { multiple: true }])) : config

  function isFlagDefined(flag: TFlag) {
    return Object.prototype.hasOwnProperty.call(flags, flag)
  }

  function assertFlag(flag: TFlag) {
    if (!isFlagDefined(flag)) {
      throw new Error(`Flag "${flag}" is not defined.`)
    }
  }

  function isFlagged(id: PropertyKey, flag: TFlag) {
    assertFlag(flag)

    return registry.get(flag)?.has(id) ?? false
  }

  function toggleFlag(id: PropertyKey, flag: TFlag, forcedValue = !isFlagged(id, flag)) {
    assertFlag(flag)

    if (!registry.has(flag)) {
      registry.set(flag, new Set())
    }

    if (forcedValue) {
      if (!isMultipleAllowed(flag)) {
        clearFlag(flag)
      }
      registry.get(flag)!.add(id)
    } else {
      registry.get(flag)!.delete(id)
    }
  }

  function clearFlag(flag: TFlag) {
    assertFlag(flag)

    registry.set(flag, new Set())
  }

  function isMultipleAllowed(flag: TFlag) {
    assertFlag(flag)

    return flags[flag]?.multiple ?? false
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
