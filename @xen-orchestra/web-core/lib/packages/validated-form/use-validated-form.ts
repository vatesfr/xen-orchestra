import type { FormErrorSummaryItem } from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
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
import { focusField } from '@core/utils/focus-field.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, ref, type Ref, toRef, useId } from 'vue'

export type ModelBinding<T> = { modelValue: T; 'onUpdate:modelValue': (value: T) => void }

export type FieldMetadata = {
  error: InputWrapperMessage | undefined
  warning: InputWrapperMessage | undefined
  onBlur: () => void
}

export type FieldIdentity = {
  id: string
}

export type ValidateOptions = {
  focus?: boolean
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
  const {
    errors: rawErrors,
    warnings: rawWarnings,
    validate: validateFields,
    reset: resetFields,
    handleBlur,
  } = useFormValidation(data, config)

  const formId = useId()

  const fieldElementIds = new Map<keyof TData, string>()

  const isSubmitted = ref(false)

  const errorSummary = computed<FormErrorSummaryItem[]>(() => {
    if (!isSubmitted.value) {
      return []
    }

    return [...fieldElementIds].flatMap(([key, id]) => {
      const message = rawErrors.value[key]

      return message === undefined ? [] : [{ id, message }]
    })
  })

  async function validate({ focus = true }: ValidateOptions = {}) {
    isSubmitted.value = true

    const isValid = await validateFields()

    if (isValid || !focus) {
      return isValid
    }

    const [firstError] = errorSummary.value

    if (firstError !== undefined) {
      focusField(firstError.id)
    }

    return isValid
  }

  function reset() {
    isSubmitted.value = false
    resetFields()
  }

  const selectRegistry = new Map<FormSelectId, keyof TData>()

  function fieldMetadata<E extends Record<string, unknown> = EmptyObject>(
    key: keyof TData,
    extras?: () => E
  ): () => FieldMetadata & E {
    return () => ({
      error: toMessage(rawErrors.value[key], 'danger'),
      warning: toMessage(rawWarnings.value[key], 'warning'),
      onBlur: () => handleBlur(key),
      ...(extras?.() as E),
    })
  }

  function useField<K extends keyof TData>(key: K): ComputedRef<ModelBinding<TData[K]> & FieldIdentity & FieldMetadata>
  function useField<K extends keyof TData, E extends Record<string, unknown>>(
    key: K,
    extras: () => E
  ): ComputedRef<ModelBinding<TData[K]> & FieldIdentity & FieldMetadata & E>
  function useField<K extends keyof TData, E extends Record<string, unknown> = Record<string, unknown>>(
    key: K,
    extras?: () => E
  ) {
    const id = `${formId}-${String(key)}`
    const metadata = fieldMetadata(key, extras)

    fieldElementIds.set(key, id)

    return _useField(key, () => ({ id, ...metadata() }))
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
    fieldElementIds.set(key, result.elementId)

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
      return _useSelect(id, fieldMetadata(keyOrExtras as keyof TData, extras))
    }

    const extrasFromRegistry = keyOrExtras as (() => E) | undefined
    const registryKey = selectRegistry.get(id)

    if (registryKey !== undefined) {
      return _useSelect(id, fieldMetadata(registryKey, extrasFromRegistry))
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
    errorSummary,
  }
}
