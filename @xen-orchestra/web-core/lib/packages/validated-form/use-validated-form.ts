import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { CollectionItemProperties, GetItemId } from '@core/packages/collection'
import { useFormBindings } from '@core/packages/form-bindings'
import { useFormSelect as _useFormSelect } from '@core/packages/form-select'
import type {
  ExtractValue,
  FormSelectId,
  GetOptionLabel,
  GetOptionValue,
  UseFormSelectReturn,
} from '@core/packages/form-select/types.ts'
import { useFormValidation } from '@core/packages/form-validation'
import type { FormValidationConfig } from '@core/packages/form-validation/types.ts'
import type { EmptyObject, MaybeArray } from '@core/types/utility.type.ts'
import { toRef, type MaybeRefOrGetter, type ComputedRef, type Ref } from 'vue'

export type ModelBinding<T> = { modelValue: T; 'onUpdate:modelValue': (value: T) => void }

export type FieldMetadata = {
  error: InputWrapperMessage | undefined
  warning: InputWrapperMessage | undefined
  onBlur: () => void
}

function toMessage(content: string | undefined, accent: 'danger' | 'warning'): InputWrapperMessage | undefined {
  return content !== undefined ? { content, accent } : undefined
}

export type UseFormSelectConfig<TSource, TCustomProperties extends CollectionItemProperties> = {
  multiple?: MaybeRefOrGetter<boolean>
  disabled?: MaybeRefOrGetter<boolean>
  selectedLabel?: (count: number, labels: string[]) => string | undefined
  placeholder?: MaybeRefOrGetter<string>
  searchPlaceholder?: MaybeRefOrGetter<string>
  loading?: MaybeRefOrGetter<boolean>
  required?: MaybeRefOrGetter<boolean>
  searchable?: MaybeRefOrGetter<boolean>
  emptyOption?: MaybeRefOrGetter<{
    value: unknown
    properties?: TCustomProperties
    label: string
    selectedLabel?: string
  }>
  option?: {
    id?: GetItemId<TSource>
    value?:
      | GetOptionValue<TSource, TCustomProperties>
      | ((source: TSource, properties: TCustomProperties, index: number) => unknown)
    properties?: (source: TSource) => TCustomProperties
    label?: GetOptionLabel<TSource, TCustomProperties>
    selectedLabel?: (source: TSource, properties: TCustomProperties) => string
    disabled?: (source: TSource, properties: TCustomProperties) => boolean
    searchableTerm?: (source: TSource, properties: TCustomProperties) => MaybeArray<string>
  }
}

export function useValidatedForm<TData extends Record<string, unknown>>(
  data: TData,
  config: FormValidationConfig<TData>
) {
  const { useField: _useField, useSelect: _useSelect } = useFormBindings(data)
  const { errors: rawErrors, warnings: rawWarnings, validate, reset, handleBlur } = useFormValidation(data, config)

  const selectRegistry = new Map<FormSelectId, keyof TData>()

  function fieldMetadata(key: keyof TData): () => FieldMetadata {
    return () => ({
      error: toMessage(rawErrors.value[key], 'danger'),
      warning: toMessage(rawWarnings.value[key], 'warning'),
      onBlur: () => handleBlur(key),
    })
  }

  function fieldMetadataWithExtras<E extends Record<string, unknown>>(
    key: keyof TData,
    extras: () => E
  ): () => FieldMetadata & E {
    return () => ({
      error: toMessage(rawErrors.value[key], 'danger'),
      warning: toMessage(rawWarnings.value[key], 'warning'),
      onBlur: () => handleBlur(key),
      ...extras(),
    })
  }

  function useField<K extends keyof TData>(key: K): ComputedRef<ModelBinding<TData[K]> & FieldMetadata>
  function useField<K extends keyof TData, E extends Record<string, unknown>>(
    key: K,
    extras: () => E
  ): ComputedRef<ModelBinding<TData[K]> & FieldMetadata & E>
  function useField<K extends keyof TData, E extends Record<string, unknown> = Record<string, unknown>>(
    key: K,
    extras?: () => E
  ) {
    if (extras !== undefined) {
      return _useField(key, fieldMetadataWithExtras(key, extras))
    }

    return _useField(key, fieldMetadata(key))
  }

  function useFormSelect<
    TSource,
    TCustomProperties extends CollectionItemProperties = EmptyObject,
    TGetValue extends GetOptionValue<TSource, TCustomProperties> = undefined,
    TMultiple extends boolean = false,
    TEmptyValue = never,
    $TValue = ExtractValue<TSource, TGetValue>,
  >(
    key: keyof TData,
    sources: MaybeRefOrGetter<TSource[]>,
    formSelectConfig?: UseFormSelectConfig<TSource, TCustomProperties>
  ): UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple> {
    const model = toRef(data, key) as Ref<unknown>

    const result = (
      _useFormSelect as unknown as (
        sources: MaybeRefOrGetter<TSource[]>,
        config: UseFormSelectConfig<TSource, TCustomProperties> & { model: Ref<unknown> }
      ) => UseFormSelectReturn<TCustomProperties, TSource, $TValue | TEmptyValue, TMultiple>
    )(sources, {
      ...formSelectConfig,
      model,
    })

    selectRegistry.set(result.id, key)

    return result
  }

  function useSelect(id: FormSelectId): ComputedRef<{ id: FormSelectId } & FieldMetadata>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    extras: () => E
  ): ComputedRef<{ id: FormSelectId } & FieldMetadata & E>
  function useSelect<E extends Record<string, unknown>>(
    id: FormSelectId,
    key: keyof TData,
    extras?: () => E
  ): ComputedRef<{ id: FormSelectId } & FieldMetadata & E>
  function useSelect<E extends Record<string, unknown> = Record<string, unknown>>(
    id: FormSelectId,
    keyOrExtras?: keyof TData | (() => E),
    extras?: () => E
  ) {
    if (typeof keyOrExtras === 'string') {
      const key = keyOrExtras as keyof TData
      const metadata = extras !== undefined ? fieldMetadataWithExtras(key, extras) : fieldMetadata(key)

      return _useSelect(id, metadata)
    }

    const extrasFromRegistry = keyOrExtras as (() => E) | undefined
    const registryKey = selectRegistry.get(id)

    if (registryKey !== undefined) {
      const metadata =
        extrasFromRegistry !== undefined
          ? fieldMetadataWithExtras(registryKey, extrasFromRegistry)
          : fieldMetadata(registryKey)

      return _useSelect(id, metadata)
    }

    if (extrasFromRegistry !== undefined) {
      return _useSelect(id, extrasFromRegistry)
    }

    return _useSelect(id)
  }

  return {
    useField,
    useFormSelect,
    useSelect,
    validate,
    reset,
    handleBlur,
  }
}
