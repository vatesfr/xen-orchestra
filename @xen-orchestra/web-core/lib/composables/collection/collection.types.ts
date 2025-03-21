import type { useCollection } from '@core/composables/collection/collection.composable.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import type { MaybeRefOrGetter } from 'vue'

export type AllowedFlagConfig = {
  multiple?: boolean
  default?: boolean
}

export type CollectionOptions<TSource, TId extends string> = {
  identifier: (source: TSource) => TId
  allowedFlags?: MaybeArray<string | Record<string, AllowedFlagConfig>>
  properties?: Record<string, (source: TSource) => any>
}

export type ExtractAllowedFlag<TOptions extends CollectionOptions<any, any>> =
  TOptions['allowedFlags'] extends (infer U)[]
    ? U extends string
      ? U
      : U extends Record<string, AllowedFlagConfig>
        ? keyof U
        : never
    : TOptions['allowedFlags'] extends string
      ? TOptions['allowedFlags']
      : never

export type ExtractProperties<TOptions extends CollectionOptions<any, any>> =
  TOptions['properties'] extends Record<string, (source: any) => any>
    ? {
        [K in keyof TOptions['properties']]: ReturnType<TOptions['properties'][K]>
      }
    : never

export type CollectionItem<TSource, TId, TAllowedFlag extends string, TProperties extends Record<string, any>> = {
  readonly id: TId
  readonly source: TSource
  readonly flags: Record<TAllowedFlag, boolean>
  readonly properties: TProperties
  toggleFlag(flag: TAllowedFlag, forcedValue?: boolean): void
}

export type CollectionFilterFlags<TAllowedFlag extends string> = MaybeRefOrGetter<MaybeArray<TAllowedFlag>>

export type CollectionFilterProperties<TProperties extends Record<string, any>> = {
  [K in keyof TProperties]?: MaybeRefOrGetter<TProperties[K]>
}

export type Collection<
  TSource,
  TId extends string,
  TAllowedFlag extends string,
  TProperties extends Record<string, any>,
> = ReturnType<typeof useCollection<TSource, TId, any, TAllowedFlag, TProperties>>
