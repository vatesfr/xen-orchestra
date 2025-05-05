import type {
  Collection,
  CollectionConfigProperties,
  CollectionItem,
  FlagRegistry,
  GuessItemId,
  UseFlagReturn,
} from '@core/packages/collection/types.ts'
import { useArrayFilter, useArrayMap } from '@vueuse/core'
import { computed, type ComputedRef } from 'vue'

export function createCollection<TSource, TFlag extends string, TProperties extends CollectionConfigProperties>(
  items: ComputedRef<CollectionItem<TSource, TFlag, TProperties>[]>,
  flagRegistry: FlagRegistry<TFlag>
): Collection<TSource, TFlag, TProperties> {
  function useFlag(flag: TFlag): UseFlagReturn<TSource, TFlag, TProperties> {
    flagRegistry.assertFlag(flag)

    const flaggedItems = useArrayFilter(items, item => item.flags[flag])

    const ids = useArrayMap(flaggedItems, item => item.id)

    const count = computed(() => flaggedItems.value.length)

    const areAllOn = computed(() => items.value.length === count.value)

    const areSomeOn = computed(() => count.value > 0)

    const areNoneOn = computed(() => count.value === 0)

    function toggle(id: GuessItemId<TSource, TProperties>, forcedValue?: boolean) {
      flagRegistry.toggleFlag(id, flag, forcedValue)
    }

    function toggleAll(forcedValue = !areAllOn.value) {
      for (const item of items.value) {
        flagRegistry.toggleFlag(item.id, flag, forcedValue)
      }
    }

    function useSubset(
      filter: (item: CollectionItem<TSource, TFlag, TProperties>) => boolean
    ): Collection<TSource, TFlag, TProperties> {
      return createCollection(useArrayFilter(flaggedItems, filter), flagRegistry)
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
      useSubset,
    }
  }

  function useSubset(
    filter: (item: CollectionItem<TSource, TFlag, TProperties>) => boolean
  ): Collection<TSource, TFlag, TProperties> {
    return createCollection(useArrayFilter(items, filter), flagRegistry)
  }

  const count = computed(() => items.value.length)

  return {
    items,
    count,
    useFlag,
    useSubset,
  }
}
