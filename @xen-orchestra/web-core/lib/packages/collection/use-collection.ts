import { buildItem } from '@core/packages/collection/build-item.ts'
import { createCollection } from '@core/packages/collection/create-collection.ts'
import type { CollectionOptions } from '@core/packages/collection/types.ts'
import { useFlagRegistry } from '@core/packages/collection/use-flag-registry.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export function useCollection<
  TSource,
  TId extends PropertyKey,
  TFlag extends string,
  TProperties extends Record<string, ComputedRef>,
>(sources: MaybeRefOrGetter<TSource[]>, options: CollectionOptions<TSource, TId, TFlag, TProperties>) {
  const flagRegistry = useFlagRegistry<TFlag>(options.flags)

  const items = computed(() => toValue(sources).map(source => buildItem(source, options, flagRegistry)))

  return createCollection(items, flagRegistry)
}
