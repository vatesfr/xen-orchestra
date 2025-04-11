import type { AvailableFlags, FlagRegistry, FlagsConfig } from '@core/packages/collection/types.ts'
import { defineStore } from 'pinia'
import { type Ref, ref } from 'vue'

export const useFlagStore = defineStore('flag-store', () => {
  const registry = ref(new Map()) as Ref<FlagRegistry>

  const availableFlags = ref(new Map()) as Ref<AvailableFlags>

  function register<TFlag extends string>(instanceId: string, flagsConfig: FlagsConfig<TFlag>) {
    if (!Array.isArray(flagsConfig)) {
      availableFlags.value.set(instanceId, new Map(Object.entries(flagsConfig)))
      return
    }

    availableFlags.value.set(
      instanceId,
      flagsConfig.reduce((acc, flag) => {
        acc.set(flag, {})

        return acc
      }, new Map())
    )
  }

  function isFlagAvailable(instanceId: string, flag: string) {
    return availableFlags.value.get(instanceId)?.get(flag) !== undefined
  }

  function setFlag(instanceId: string, flag: string, itemId: string | number, value: boolean) {
    if (!isFlagAvailable(instanceId, flag)) {
      throw new Error(`Flag ${flag} does not exist ont this instance`)
    }

    if (!registry.value.has(instanceId)) {
      registry.value.set(instanceId, new Map())
    }

    const instanceRegistry = registry.value.get(instanceId)!

    if (!instanceRegistry.has(flag)) {
      instanceRegistry.set(flag, new Map())
    }

    const flagRegistry = instanceRegistry.get(flag)!

    if (!isMultipleAllowed(instanceId, flag)) {
      flagRegistry.clear()
    }

    flagRegistry.set(itemId, value)
  }

  function hasFlag(instanceId: string, flag: string, itemId: string | number) {
    return registry.value.get(instanceId)?.get(flag)?.get(itemId) ?? false
  }

  function clearFlag(instanceId: string, flag: string) {
    registry.value.get(instanceId)?.get(flag)?.clear()
  }

  function isMultipleAllowed(instanceId: string, flag: string) {
    return availableFlags.value.get(instanceId)?.get(flag)?.multiple ?? true
  }

  return {
    register,
    setFlag,
    hasFlag,
    clearFlag,
    isFlagAvailable,
    isMultipleAllowed,
  }
})
