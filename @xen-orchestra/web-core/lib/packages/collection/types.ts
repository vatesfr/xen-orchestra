import { useFlagStore } from '@core/packages/collection/use-flag-store.ts'
import type { ComputedRef, UnwrapRef } from 'vue'

// Map<InstanceId, Map<Flag, Map<ItemId, boolean>>>
export type FlagRegistry = Map<string, Map<string, Map<string | number, boolean>>>

// Map<InstanceId, Map<Flag, { multiple?: boolean }>>
export type AvailableFlags = Map<string, Map<string, { multiple?: boolean }>>

export type FlagsConfig<TFlag extends string> = TFlag[] | { [K in TFlag]: { multiple?: boolean } }

export type CollectionOptions<TSource, TId, TFlag extends string, TProperties extends Record<string, ComputedRef>> = {
  identifier: (source: TSource) => TId
  properties?: (source: TSource) => TProperties
  flags?: FlagsConfig<TFlag>
  collectionId?: string
}

export type CollectionItem<TSource, TId, TFlag extends string, TProperties extends Record<string, ComputedRef>> = {
  id: TId
  source: TSource
  flags: Record<TFlag, boolean>
  properties: UnwrapRef<TProperties>
  toggleFlag: (flag: TFlag, forcedValue?: boolean) => void
}

export type FlagStore = ReturnType<typeof useFlagStore>
