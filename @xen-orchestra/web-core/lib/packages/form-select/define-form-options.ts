import type { FormOption, FormOptionValue } from '@core/packages/form-select/form-select.type.ts'
import { useArrayMap } from '@vueuse/shared'
import type { ComputedRef, MaybeRefOrGetter } from 'vue'

export function defineFormOptions<TValue extends FormOptionValue>(
  values: MaybeRefOrGetter<MaybeRefOrGetter<TValue>[]>
): ComputedRef<FormOption<TValue>[]>

export function defineFormOptions<TItem, TData = TItem>(
  items: MaybeRefOrGetter<MaybeRefOrGetter<TItem>[]>,
  fn: (item: TItem, index: number) => Omit<FormOption<TItem>, 'data'> & { data?: TData }
): ComputedRef<FormOption<TData>[]>

export function defineFormOptions<TItem, TData = TItem>(
  items: MaybeRefOrGetter<MaybeRefOrGetter<TItem>[]>,
  fn: (item: TItem, index: number) => Omit<FormOption<TItem>, 'data'> & { data?: TData } = (item: TItem) => ({
    value: item as FormOptionValue,
  })
): ComputedRef<FormOption<TData>[]> {
  return useArrayMap(items, (item, index) => ({
    data: item as unknown as TData,
    ...fn(item, index),
  }))
}
