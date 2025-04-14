import type { useFlagRegistry } from '@core/packages/collection/use-flag-registry.ts'
import type { ComputedRef } from 'vue'

export type FlagsConfig<TFlag extends string> = TFlag[] | { [K in TFlag]: { multiple?: boolean } }

export type CollectionOptions<TSource, TId, TFlag extends string, TProperties extends Record<string, ComputedRef>> = {
  identifier: (source: TSource) => TId
  properties?: (source: TSource) => TProperties
  flags?: FlagsConfig<TFlag>
  flagRegistry?: FlagRegistry<TFlag>
}

export type CollectionItem<TSource, TId, TFlag extends string, TProperties extends Record<string, any>> = {
  id: TId
  source: TSource
  flags: Record<TFlag, boolean>
  properties: TProperties
  toggleFlag: (flag: TFlag, forcedValue?: boolean) => void
}

export type FlagRegistry<TFlag extends string> = ReturnType<typeof useFlagRegistry<TFlag>>
