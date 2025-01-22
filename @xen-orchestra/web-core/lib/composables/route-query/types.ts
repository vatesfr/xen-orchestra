import type { EmptyObject } from '@core/types/utility.type'
import type { WritableComputedRef } from 'vue'

export type Options = {
  defaultQuery?: string
}

export type Transformers<TData> = {
  toData: (value: string) => TData
  toQuery: (value: TData) => string
}

export type SetActions<TValue> = {
  add: (value: TValue) => void
  delete: (value: TValue) => void
  toggle: (value: TValue, state?: boolean) => void
}

export type MapActions<TKey, TValue> = { set: (key: TKey, value: TValue) => void; delete: (key: TKey) => void }

export type ArrayActions<TValue> = {
  add: (value: TValue) => void
  delete: (index: number) => void
  set: (index: number, value: TValue) => void
}

export type BooleanActions = { toggle: (value?: boolean) => void }

export type Actions = SetActions<any> & MapActions<any, any> & ArrayActions<any> & BooleanActions

export type GuessActions<TData> = TData extends string | number
  ? EmptyObject
  : TData extends Set<infer TValue>
    ? SetActions<TValue>
    : TData extends (infer TValue)[]
      ? ArrayActions<TValue>
      : TData extends boolean
        ? BooleanActions
        : TData extends Map<infer TKey, infer TValue> | Record<infer TKey, infer TValue>
          ? MapActions<TKey, TValue>
          : EmptyObject

export type RouteQuery<TData> = WritableComputedRef<
  TData extends Set<infer V>
    ? ReadonlySet<V>
    : TData extends Map<infer K, infer V>
      ? ReadonlyMap<K, V>
      : TData extends object
        ? Readonly<TData>
        : TData
> &
  GuessActions<TData>
