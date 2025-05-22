import type { ArrayFilterPredicate, KeyOfByValue } from '@core/types/utility.type.ts'
import type { ComputedRef, MaybeRefOrGetter, Reactive } from 'vue'

export type CollectionItem<
  TSource = unknown,
  TFlag extends string = string,
  TProperties extends CollectionItemProperties = CollectionItemProperties,
  TId extends CollectionItemId = PickSourceId<TSource, 'id'>,
> = {
  id: TId
  source: TSource
  flags: Record<TFlag, boolean>
  properties: Reactive<TProperties>
  toggleFlag: (flag: TFlag, forcedValue?: boolean) => void
}

export type Collection<
  TSource = unknown,
  TFlag extends string = string,
  TProperties extends CollectionItemProperties = CollectionItemProperties,
  TId extends CollectionItemId = PickSourceId<TSource, 'id'>,
  $TItem extends CollectionItem<TSource, TFlag, TProperties, TId> = CollectionItem<TSource, TFlag, TProperties, TId>,
> = {
  items: ComputedRef<$TItem[]>
  count: ComputedRef<number>
  useFlag: (flag: TFlag) => UseFlagReturn<TSource, TFlag, TProperties, TId>
  toggleFlag: (id: TId, flag: TFlag, forcedValue?: boolean) => void
  useSubset: (filter: ArrayFilterPredicate<$TItem>) => Collection<TSource, TFlag, TProperties, TId>
}

export type CollectionItemProperties = Record<PropertyKey, unknown>

export type CollectionItemId = string | number

export type PickSourceId<TSource, TKey> = TKey extends keyof TSource
  ? TSource[TKey] extends CollectionItemId
    ? TSource[TKey]
    : never
  : never

export type ExtractSourceId<TSource, TGetId extends GetItemId<TSource>> = TGetId extends keyof TSource
  ? PickSourceId<TSource, TGetId>
  : TGetId extends (source: TSource) => infer R
    ? R
    : TSource extends CollectionItemId
      ? TSource
      : PickSourceId<TSource, 'id'>

export type FlagConfig = {
  multiple?: MaybeRefOrGetter<boolean>
}

export type CollectionConfigFlags<TFlag extends string> = TFlag[] | Record<TFlag, FlagConfig>

export type FlagRegistry<TId extends CollectionItemId, TFlag extends string> = {
  isFlagged: (id: TId, flag: TFlag) => boolean
  isFlagDefined: (flag: TFlag) => boolean
  toggleFlag: (id: TId, flag: TFlag, forcedValue?: boolean) => void
  clearFlag: (flag: TFlag) => void
  isMultipleAllowed: (flag: TFlag) => boolean
  assertFlag: (flag: TFlag) => void
}

export type UseFlagReturn<
  TSource,
  TFlag extends string,
  TProperties extends CollectionItemProperties,
  TId extends CollectionItemId,
  $TItem extends CollectionItem<TSource, TFlag, TProperties, TId> = CollectionItem<TSource, TFlag, TProperties, TId>,
> = {
  items: ComputedRef<$TItem[]>
  ids: ComputedRef<TId[]>
  count: ComputedRef<number>
  areAllOn: ComputedRef<boolean>
  areSomeOn: ComputedRef<boolean>
  areNoneOn: ComputedRef<boolean>
  toggle: (id: TId, forcedValue?: boolean) => void
  toggleAll: (forcedValue?: boolean) => void
  useSubset: (filter: ArrayFilterPredicate<$TItem>) => Collection<TSource, TFlag, TProperties, TId>
}

export type GetItemId<TSource> =
  | undefined
  | KeyOfByValue<TSource, CollectionItemId>
  | ((source: TSource) => CollectionItemId)
