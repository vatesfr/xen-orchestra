import type { CollectionItem, FlagRegistry } from '@core/packages/collection/types.ts'
import { useArrayFilter, useArrayMap } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

export function createCollection<
  TSource,
  TId extends PropertyKey,
  TFlag extends string,
  TProperties extends Record<string, any>,
>(items: ComputedRef<CollectionItem<TSource, TId, TFlag, TProperties>[]>, flagRegistry: FlagRegistry<TFlag>) {
  function useFlag(flag: TFlag) {
    const flaggedItems = useArrayFilter(items, item => item.flags[flag])

    const ids = useArrayMap(flaggedItems, item => item.id)

    const count = computed(() => flaggedItems.value.length)

    const areAllOn = computed(() => items.value.length === count.value)

    const areSomeOn = computed(() => count.value > 0)

    const areNoneOn = computed(() => count.value === 0)

    function toggle(id: TId, forcedValue?: boolean) {
      flagRegistry.toggleFlag(id, flag, forcedValue)
    }

    function toggleAll(forcedValue = !areAllOn.value) {
      for (const item of items.value) {
        flagRegistry.toggleFlag(item.id, flag, forcedValue)
      }
    }

    return {
      items: flaggedItems,
      ids,
      count,
      areAllOn,
      areSomeOn,
      areNoneOn,
      toggle,
      toggleAll,
    }
  }

  function useSubset(filter: (item: CollectionItem<TSource, TId, TFlag, TProperties>) => boolean) {
    const filteredItems = useArrayFilter(items, item => filter(item))

    return createCollection(filteredItems, flagRegistry)
  }

  const count = computed(() => items.value.length)

  return {
    items,
    count,
    useFlag,
    useSubset,
  }
}
