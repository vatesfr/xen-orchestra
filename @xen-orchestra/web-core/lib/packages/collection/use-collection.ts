import { guessItemId } from '@core/packages/collection/guess-item-id.ts'
import type { EmptyObject } from '@core/types/utility.type.ts'
import type {
  Collection,
  CollectionConfigFlags,
  CollectionItemId,
  CollectionItemProperties,
  ExtractSourceId,
  GetItemId,
} from './types.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { createCollection } from './create-collection.ts'
import { createItem } from './create-item.ts'
import { useFlagRegistry } from './use-flag-registry.ts'

// Overload #1: Source is CollectionItemId

export function useCollection<
  TSource extends CollectionItemId,
  TFlag extends string = never,
  TProperties extends CollectionItemProperties = EmptyObject,
  TGetId extends ((source: TSource) => CollectionItemId) | undefined = undefined,
  $TId extends CollectionItemId = ExtractSourceId<TSource, TGetId>,
>(
  source: MaybeRefOrGetter<TSource[]>,
  config?: {
    itemId?: TGetId | ((source: TSource) => CollectionItemId)
    flags?: CollectionConfigFlags<TFlag>
    properties?: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties, $TId>

// Overload #2: Source is an object with id

export function useCollection<
  TSource extends { id: CollectionItemId },
  TFlag extends string = never,
  TProperties extends CollectionItemProperties = EmptyObject,
  TGetId extends GetItemId<TSource> = undefined,
  $TId extends CollectionItemId = ExtractSourceId<TSource, TGetId>,
>(
  source: MaybeRefOrGetter<TSource[]>,
  config?: {
    itemId?: TGetId | ((source: TSource) => CollectionItemId)
    flags?: CollectionConfigFlags<TFlag>
    properties?: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties, $TId>

// Overload #3: Any other case

export function useCollection<
  TSource,
  TFlag extends string = never,
  TProperties extends CollectionItemProperties = EmptyObject,
  TGetId extends GetItemId<TSource> = never,
  $TId extends CollectionItemId = ExtractSourceId<TSource, TGetId>,
>(
  source: MaybeRefOrGetter<TSource[]>,
  config: {
    itemId: TGetId | ((source: TSource) => CollectionItemId)
    flags?: CollectionConfigFlags<TFlag>
    properties?: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties, $TId>

// Implementation

export function useCollection<
  TSource,
  TFlag extends string,
  TProperties extends CollectionItemProperties,
  TGetId extends GetItemId<TSource>,
  $TId extends CollectionItemId,
>(
  _sources: MaybeRefOrGetter<TSource[]>,
  config?: {
    itemId?: TGetId
    flags?: CollectionConfigFlags<TFlag>
    properties?: (source: TSource) => TProperties
  }
): Collection<TSource, TFlag, TProperties, $TId> {
  const flagRegistry = useFlagRegistry<TFlag, $TId>(config?.flags)

  const sources = computed(() => toValue(_sources))

  const items = computed(() =>
    sources.value.map(source => {
      const id = guessItemId(source, config?.itemId) as $TId
      const properties = config?.properties?.(source) ?? ({} as TProperties)

      return createItem<TSource, TFlag, TProperties, $TId>(id, source, properties, flagRegistry)
    })
  )

  return createCollection(items, flagRegistry)
}
