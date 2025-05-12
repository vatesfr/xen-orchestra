import { createCollection } from '@core/packages/collection/create-collection.ts'
import { createItem } from '@core/packages/collection/create-item.ts'
import type { Collection, CollectionConfigFlags, CollectionConfigProperties } from '@core/packages/collection/types.ts'
import { useFlagRegistry } from '@core/packages/collection/use-flag-registry.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useCollection<
  TSource extends { id: unknown },
  TFlag extends string = never,
  TProperties extends CollectionConfigProperties = { id?: unknown },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: {
    flags?: CollectionConfigFlags<TFlag>
    properties?: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties>

export function useCollection<
  TSource,
  TFlag extends string = never,
  TProperties extends CollectionConfigProperties & { id: unknown } = never,
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config: {
    flags?: CollectionConfigFlags<TFlag>
    properties: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties>

export function useCollection<
  TSource,
  TFlag extends string = never,
  TProperties extends CollectionConfigProperties = { id?: unknown },
>(
  sources: MaybeRefOrGetter<TSource[]>,
  config?: {
    flags?: CollectionConfigFlags<TFlag>
    properties?: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties> {
  const flagRegistry = useFlagRegistry(config?.flags)

  const items = computed(() => toValue(sources).map(source => createItem(source, config?.properties, flagRegistry)))

  return createCollection(items, flagRegistry)
}
