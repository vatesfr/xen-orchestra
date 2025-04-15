import { buildItem, type CollectionOptions, createCollection, useFlagRegistry } from '@core/packages/collection'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useCollection<
  TSource,
  TId extends PropertyKey,
  TFlag extends string,
  TProperties extends Record<string, unknown>,
>(sources: MaybeRefOrGetter<TSource[]>, options: CollectionOptions<TSource, TId, TFlag, TProperties>) {
  const flagRegistry = useFlagRegistry<TFlag>(options.flags)

  const items = computed(() => toValue(sources).map(source => buildItem(source, options, flagRegistry)))

  return createCollection(items, flagRegistry)
}
