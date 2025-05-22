import { createUseSubset } from '@core/packages/collection/create-use-subset.ts'
import type {
  Collection,
  CollectionItem,
  CollectionItemId,
  CollectionItemProperties,
  FlagRegistry,
  UseFlagReturn,
} from './types.ts'
import { useArrayFilter, useArrayMap } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

export function createCollection<
  TSource,
  TFlag extends string,
  TProperties extends CollectionItemProperties,
  TId extends CollectionItemId,
  $TItem extends CollectionItem<TSource, TFlag, TProperties, TId>,
>(items: ComputedRef<$TItem[]>, flagRegistry: FlagRegistry<TId, TFlag>): Collection<TSource, TFlag, TProperties, TId> {
  function useFlag(flag: TFlag): UseFlagReturn<TSource, TFlag, TProperties, TId> {
    flagRegistry.assertFlag(flag)

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

    const useSubset = createUseSubset<TSource, TFlag, TProperties, TId>(flaggedItems, flagRegistry)

    return {
      items: flaggedItems,
      ids,
      count,
      areAllOn,
      areSomeOn,
      areNoneOn,
      toggle,
      toggleAll,
      useSubset,
    }
  }

  function toggleFlag(id: TId, flag: TFlag, forcedValue?: boolean) {
    flagRegistry.toggleFlag(id, flag, forcedValue)
  }

  const useSubset = createUseSubset<TSource, TFlag, TProperties, TId>(items, flagRegistry)

  const count = computed(() => items.value.length)

  return {
    items,
    count,
    useFlag,
    toggleFlag,
    useSubset,
  }
}
