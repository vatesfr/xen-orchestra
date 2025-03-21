import type { useCollection } from '@core/packages/collection/use-collection.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import type { ComputedRef, Reactive, UnwrapRef } from 'vue'

export type FlagConfig = {
  multiple?: boolean
  default?: boolean
}

export type CollectionOptions<TSource, TId extends string> = {
  identifier: (source: TSource) => TId
  flags?: MaybeArray<string | Record<string, FlagConfig>>
  properties?: (source: TSource) => Record<string, ComputedRef>
  context?: Reactive<{
    flags: ComputedRef<Map<string, FlagConfig>>
    registeredFlags: Map<string, Map<TId, boolean>>
  }>
}

export type ExtractFlags<TOptions extends CollectionOptions<any, any>> = TOptions['flags'] extends (infer U)[]
  ? U extends string
    ? U
    : U extends Record<string, FlagConfig>
      ? keyof U
      : never
  : TOptions['flags'] extends string
    ? TOptions['flags']
    : never

export type ExtractProperties<TOptions extends CollectionOptions<any, any>> = TOptions['properties'] extends (
  source: any
) => infer TProps
  ? {
      [K in keyof TProps]: UnwrapRef<TProps[K]>
    }
  : never

export type CollectionItem<TSource, TId, TFlag extends string, TProperties extends Record<string, any>> = {
  readonly id: TId
  readonly source: TSource
  readonly flags: Record<TFlag, boolean>
  readonly properties: TProperties
  toggleFlag(flag: TFlag, forcedValue?: boolean): void
}

export type Collection<
  TSource,
  TId extends string,
  TFlag extends string,
  TProperties extends Record<string, any>,
> = ReturnType<typeof useCollection<TSource, TId, any, TFlag, TProperties>>
