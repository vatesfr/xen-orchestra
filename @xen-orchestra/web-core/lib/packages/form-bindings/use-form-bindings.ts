import type { FormSelectId } from '@core/packages/form-select'
import { computed, type ComputedRef } from 'vue'

export type ModelBinding<T> = {
  modelValue: T
  'onUpdate:modelValue': (value: T) => void
}

export type UseFormBindingsReturn<T extends Record<string, unknown>> = {
  useField: {
    <K extends keyof T>(key: K): ComputedRef<ModelBinding<T[K]>>
    <K extends keyof T, E extends Record<string, unknown>>(
      key: K,
      metadata: () => E
    ): ComputedRef<ModelBinding<T[K]> & E>
  }
  useSelect: {
    (id: FormSelectId): ComputedRef<{ id: FormSelectId }>
    <E extends Record<string, unknown>>(id: FormSelectId, metadata: () => E): ComputedRef<{ id: FormSelectId } & E>
  }
}

export function useFormBindings<T extends Record<string, unknown>>(source: T): UseFormBindingsReturn<T> {
  function useField<K extends keyof T>(key: K): ComputedRef<ModelBinding<T[K]>>
  function useField<K extends keyof T, E extends Record<string, unknown>>(
    key: K,
    metadata: () => E
  ): ComputedRef<ModelBinding<T[K]> & E>
  function useField<K extends keyof T, E extends Record<string, unknown> = Record<string, unknown>>(
    key: K,
    metadata?: () => E
  ) {
    return computed(() => ({
      modelValue: source[key],
      'onUpdate:modelValue': (value: T[K]) => {
        source[key] = value
      },
      ...metadata?.(),
    }))
  }

  function useSelect(id: FormSelectId): ComputedRef<{ id: FormSelectId }>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    metadata: () => E
  ): ComputedRef<{ id: FormSelectId } & E>
  function useSelect<E extends Record<string, unknown> = Record<string, unknown>>(
    id: FormSelectId,
    metadata?: () => E
  ) {
    return computed(() => ({
      id,
      ...metadata?.(),
    }))
  }

  return {
    useField,
    useSelect,
  }
}
