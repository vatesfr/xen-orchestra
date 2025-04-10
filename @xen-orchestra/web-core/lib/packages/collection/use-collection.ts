import { buildItem } from '@core/packages/collection/build-item.ts'
import type { CollectionItem, CollectionOptions } from '@core/packages/collection/types.ts'
import { useFlagStore } from '@core/packages/collection/use-flag-store.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useArrayFilter, useArrayMap } from '@vueuse/core'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue, useId } from 'vue'

export function useCollection<
  TSource,
  TId extends string | number,
  TFlag extends string,
  TProperties extends Record<string, ComputedRef>,
>(sources: MaybeRefOrGetter<TSource[]>, options: CollectionOptions<TSource, TId, TFlag, TProperties>) {
  const flagStore = useFlagStore()

  const collectionId = options.collectionId ?? useId()

  flagStore.register(collectionId, options.flags)

  const items = computed(() => toValue(sources).map(source => buildItem(collectionId, source, options, flagStore)))

  function useSubset(filter: (item: CollectionItem<TSource, TId, TFlag, TProperties>) => boolean) {
    return useCollection<TSource, TId, TFlag, TProperties>(
      computed(() => items.value.flatMap(item => (filter(item) ? [item.source] : []))),
      {
        ...options,
        collectionId,
      }
    )
  }

  function setFlag(flag: TFlag, value: boolean): void

  function setFlag(ids: MaybeArray<TId>, flag: TFlag, value: boolean): void

  function setFlag(flagOrIds: TFlag | MaybeArray<TId>, flagOrValue: TFlag | boolean, valueOrNone?: boolean) {
    const ids = valueOrNone === undefined ? items.value.map(item => item.id) : toArray(flagOrIds as MaybeArray<TId>)

    const flag = valueOrNone === undefined ? (flagOrIds as TFlag) : (flagOrValue as TFlag)

    const value = valueOrNone ?? (flagOrValue as boolean)

    const allowsMultiple = flagStore.isMultipleAllowed(collectionId, flag)

    if (!allowsMultiple) {
      if (ids.length > 1) {
        throw new Error('This flag is not allowed to be set on multiple items')
      }

      flagStore.clearFlag(collectionId, flag)
    }

    for (const id of ids) {
      flagStore.setFlag(collectionId, flag, id, value)
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
