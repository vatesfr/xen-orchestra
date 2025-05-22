import { createCollection } from '@core/packages/collection/create-collection.ts'
import type {
  Collection,
  CollectionItem,
  CollectionItemId,
  CollectionItemProperties,
  FlagRegistry,
} from '@core/packages/collection/types.ts'
import type { ArrayFilterPredicate } from '@core/types/utility.type.ts'
import { useArrayFilter } from '@vueuse/core'
import type { ComputedRef } from 'vue'

export function createUseSubset<
  TSource,
  TFlag extends string,
  TProperties extends CollectionItemProperties,
  TId extends CollectionItemId,
  $TItem extends CollectionItem<TSource, TFlag, TProperties, TId> = CollectionItem<TSource, TFlag, TProperties, TId>,
>(items: ComputedRef<$TItem[]>, flagRegistry: FlagRegistry<TId, TFlag>) {
  return function useSubset(filter: ArrayFilterPredicate<$TItem>): Collection<TSource, TFlag, TProperties, TId> {
    return createCollection(useArrayFilter(items, filter), flagRegistry)
  }
}
