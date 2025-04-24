import type { ComputedRef, Reactive } from 'vue'

export type CollectionConfigProperties = Record<string, unknown> & { id?: unknown }

export type CollectionConfigFlags<TFlag extends string> = TFlag[] | Record<TFlag, { multiple?: boolean }>

export type CollectionItem<
  TSource,
  TFlag extends string = never,
  TProperties extends CollectionConfigProperties = Record<string, never>,
> = {
  id: GuessItemId<TSource, Reactive<TProperties>>
  source: TSource
  flags: Record<TFlag, boolean>
  properties: Reactive<TProperties>
  toggleFlag: (flag: TFlag, forcedValue?: boolean) => void
}

export type FlagRegistry<TFlag extends string> = {
  isFlagged: (id: PropertyKey, flag: TFlag) => boolean
  isFlagDefined: (flag: TFlag) => boolean
  toggleFlag: (id: PropertyKey, flag: TFlag, forcedValue?: boolean) => void
  clearFlag: (flag: TFlag) => void
  isMultipleAllowed: (flag: TFlag) => boolean
  assertFlag: (flag: TFlag) => void
}

export type UseFlagReturn<TSource, TFlag extends string, TProperties extends CollectionConfigProperties> = {
  items: ComputedRef<CollectionItem<TSource, TFlag, TProperties>[]>
  ids: ComputedRef<GuessItemId<TSource, TProperties>[]>
  count: ComputedRef<number>
  areAllOn: ComputedRef<boolean>
  areSomeOn: ComputedRef<boolean>
  areNoneOn: ComputedRef<boolean>
  toggle: (id: GuessItemId<TSource, TProperties>, forcedValue?: boolean) => void
  toggleAll: (forcedValue?: boolean) => void
  useSubset: (
    filter: (item: CollectionItem<TSource, TFlag, TProperties>) => boolean
  ) => Collection<TSource, TFlag, TProperties>
}

export type Collection<TSource, TFlag extends string, TProperties extends CollectionConfigProperties> = {
  items: ComputedRef<CollectionItem<TSource, TFlag, TProperties>[]>
  count: ComputedRef<number>
  useFlag: (flag: TFlag) => UseFlagReturn<TSource, TFlag, TProperties>
  useSubset: (
    filter: (item: CollectionItem<TSource, TFlag, TProperties>) => boolean
  ) => Collection<TSource, TFlag, TProperties>
}

type AssertId<TId> = TId extends PropertyKey ? TId : never

export type GuessItemId<TSource, TProperties> = TProperties extends { id: infer TId }
  ? AssertId<TId>
  : TSource extends { id: infer TId }
    ? AssertId<TId>
    : never
