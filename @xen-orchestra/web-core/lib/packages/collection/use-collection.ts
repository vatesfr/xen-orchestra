import { buildItem } from '@core/packages/collection/build-item.ts'
import type { CollectionItem, CollectionOptions } from '@core/packages/collection/types.ts'
import { useFlagRegistry } from '@core/packages/collection/use-flag-registry.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useArrayFilter, useArrayMap } from '@vueuse/core'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue, type UnwrapRef } from 'vue'

export function useCollection<
  TSource,
  TId extends string | number,
  TFlag extends string,
  TProperties extends Record<string, ComputedRef>,
>(sources: MaybeRefOrGetter<TSource[]>, options: CollectionOptions<TSource, TId, TFlag, TProperties>) {
  const flagRegistry = options.flagRegistry ?? useFlagRegistry<TFlag>(options.flags)

  const items = computed(() => toValue(sources).map(source => buildItem(source, options, flagRegistry)))

  function useSubset(filter: (item: CollectionItem<TSource, TId, TFlag, UnwrapRef<TProperties>>) => boolean) {
    return useCollection<TSource, TId, TFlag, TProperties>(
      computed(() => items.value.flatMap(item => (filter(item) ? [item.source] : []))),
      {
        ...options,
        flagRegistry,
      }
    )
  }

  function setFlag(flag: TFlag, value: boolean): void

  function setFlag(ids: MaybeArray<TId>, flag: TFlag, value: boolean): void

  function setFlag(flagOrIds: TFlag | MaybeArray<TId>, flagOrValue: TFlag | boolean, valueOrNone?: boolean) {
    const ids = valueOrNone === undefined ? items.value.map(item => item.id) : toArray(flagOrIds as MaybeArray<TId>)

    const flag = valueOrNone === undefined ? (flagOrIds as TFlag) : (flagOrValue as TFlag)

    const value = valueOrNone ?? (flagOrValue as boolean)

    const allowsMultiple = flagRegistry.isMultipleAllowed(flag)

    if (!allowsMultiple) {
      if (ids.length > 1) {
        throw new Error('This flag is not allowed to be set on multiple items')
      }

      flagRegistry.clearFlag(flag)
    }

    for (const id of ids) {
      flagRegistry.setFlag(id, flag, value)
    }
  }

  function useFlag(flag: TFlag) {
    const flaggedItems = useArrayFilter(items, item => item.flags[flag])

    const ids = useArrayMap(flaggedItems, item => item.id)

    const count = computed(() => flaggedItems.value.length)

    const areAllOn = computed(() => items.value.length === count.value)

    const areSomeOn = computed(() => count.value > 0)

    const areNoneOn = computed(() => count.value === 0)

    const toggle = (forcedValue = !areAllOn.value) =>
      items.value.forEach(item => {
        item.flags[flag] = forcedValue
      })

    return {
      items: flaggedItems,
      ids,
      count,
      areAllOn,
      areSomeOn,
      areNoneOn,
      toggle,
    }
  }

  return {
    items,
    useFlag,
    setFlag,
    useSubset,
  }
}
