import type { FlagsConfig } from '@core/packages/collection/types.ts'
import { reactive } from 'vue'

export function useFlagRegistry<TFlag extends string>(_flags: FlagsConfig<TFlag> = []) {
  const registry = reactive(new Map()) as Map<TFlag, Set<PropertyKey> | undefined>

  const flags = Array.isArray(_flags) ? Object.fromEntries(_flags.map(flag => [flag, { multiple: true }])) : _flags

  function isFlagDefined(flag: TFlag) {
    return flags[flag] !== undefined
  }

  function isFlagged(id: PropertyKey, flag: TFlag) {
    return registry.get(flag)?.has(id) ?? false
  }

  function toggleFlag(id: PropertyKey, flag: TFlag, forcedValue = !isFlagged(id, flag)) {
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
    registry.set(flag, new Set())
  }

  function isMultipleAllowed(flag: TFlag) {
    return flags[flag]?.multiple ?? false
  }

  return {
    isFlagged,
    isFlagDefined,
    toggleFlag,
    clearFlag,
    isMultipleAllowed,
  }
}
