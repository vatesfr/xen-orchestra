import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'

export function toComputed<TValue>(value: MaybeRefOrGetter<TValue>): ComputedRef<TValue>

export function toComputed<TValue>(
  value: MaybeRefOrGetter<TValue | undefined>,
  defaultValue: MaybeRefOrGetter<TValue>
): ComputedRef<TValue>

export function toComputed<TValue>(
  value: MaybeRefOrGetter<TValue>,
  defaultValue?: MaybeRefOrGetter<TValue>
): ComputedRef<TValue | undefined> {
  return computed(() => toValue(value) ?? toValue(defaultValue))
}
