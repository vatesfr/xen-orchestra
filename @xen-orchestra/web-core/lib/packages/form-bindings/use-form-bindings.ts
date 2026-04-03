import type { FormSelectId } from '@core/packages/form-select'
import { computed, type ComputedRef } from 'vue'

export type ModelBinding<T> = {
  modelValue: T
  'onUpdate:modelValue': (value: T) => void
}

export type UseFormBindingsReturn<T extends Record<string, unknown>> = {
  [K in keyof T]: ComputedRef<ModelBinding<T[K]>>
} & {
  useField: {
    <K extends keyof T>(key: K): ComputedRef<ModelBinding<T[K]>>
    <K extends keyof T, E extends Record<string, unknown>>(key: K, extras: () => E): ComputedRef<ModelBinding<T[K]> & E>
  }
  useSelect: {
    (id: FormSelectId): ComputedRef<{ id: FormSelectId }>
    <E extends Record<string, unknown>>(id: FormSelectId, extras: () => E): ComputedRef<{ id: FormSelectId } & E>
  }
}

export function useFormBindings<T extends Record<string, unknown>>(source: T): UseFormBindingsReturn<T> {
  function useField<K extends keyof T>(key: K): ComputedRef<ModelBinding<T[K]>>
  function useField<K extends keyof T, E extends Record<string, unknown>>(
    key: K,
    extras: () => E
  ): ComputedRef<ModelBinding<T[K]> & E>
  function useField<K extends keyof T, E extends Record<string, unknown> = Record<string, unknown>>(
    key: K,
    extras?: () => E
  ) {
    return computed(() => ({
      modelValue: source[key],
      'onUpdate:modelValue': (value: T[K]) => {
        source[key] = value
      },
      ...extras?.(),
    }))
  }

  function useSelect(id: FormSelectId): ComputedRef<{ id: FormSelectId }>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    extras: () => E
  ): ComputedRef<{ id: FormSelectId } & E>
  function useSelect<E extends Record<string, unknown> = Record<string, unknown>>(id: FormSelectId, extras?: () => E) {
    return computed(() => ({
      id,
      ...extras?.(),
    }))
  }

  const mappedBindings = Object.fromEntries(
    Object.keys(source).map(key => [key, useField(key as keyof T)])
  ) as unknown as { [K in keyof T]: ComputedRef<ModelBinding<T[K]>> }

  return {
    ...mappedBindings,
    useField,
    useSelect,
  } as UseFormBindingsReturn<T>
}
