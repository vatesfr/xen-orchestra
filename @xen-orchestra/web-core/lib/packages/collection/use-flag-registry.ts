import type { FlagsConfig } from '@core/packages/collection/types.ts'
import { reactive } from 'vue'

type Id = string | number

export function useFlagRegistry<TFlag extends string>(_flags: FlagsConfig<TFlag> = []) {
  const registry = reactive(new Map()) as Map<TFlag, Set<Id> | undefined>

  const flags = Array.isArray(_flags) ? Object.fromEntries(_flags.map(flag => [flag, { multiple: true }])) : _flags

  function checkFlag(flag: TFlag) {
    return flags[flag] !== undefined
  }

  function hasFlag(id: Id, flag: TFlag) {
    return registry.get(flag)?.has(id) ?? false
  }

  function setFlag(id: Id, flag: TFlag, value: boolean) {
    if (!registry.has(flag)) {
      registry.set(flag, new Set())
    }

    if (value) {
      if (!isMultipleAllowed(flag)) {
        clearFlag(flag)
      }
      registry.get(flag)!.add(id)
    } else {
      registry.get(flag)!.delete(id)
    }
  }

  function toggleFlag(id: Id, flag: TFlag, forcedValue = !hasFlag(id, flag)) {
    setFlag(id, flag, forcedValue)
  }

  function clearFlag(flag: TFlag) {
    registry.set(flag, new Set())
  }

  function isMultipleAllowed(flag: TFlag) {
    return flags[flag]?.multiple ?? false
  }

  return {
    hasFlag,
    checkFlag,
    setFlag,
    toggleFlag,
    clearFlag,
    isMultipleAllowed,
  }
}
