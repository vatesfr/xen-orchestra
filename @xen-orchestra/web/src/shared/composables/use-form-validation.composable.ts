import { toInputWrapperMessage } from '@/shared/utils/input-wrapper-message.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormFieldMessages, FormValidationConfig, UseFormValidationReturn } from '@core/packages/form-validation'
import { useFormValidation as useCoreFormValidation } from '@core/packages/form-validation'
import { computed, type ComputedRef } from 'vue'

type XoFormFieldMetadata = {
  error: InputWrapperMessage | undefined
  warning: InputWrapperMessage | undefined
  onBlur: () => void
}

type XoFormMessages<TData extends Record<string, unknown>> = {
  [K in keyof TData]: InputWrapperMessage | undefined
}

type XoFormValidationReturn<TData extends Record<string, unknown>> = Pick<
  UseFormValidationReturn<TData>,
  'validate' | 'handleBlur' | 'reset'
> & {
  errors: ComputedRef<XoFormMessages<TData>>
  warnings: ComputedRef<XoFormMessages<TData>>
  useFieldMetadata: {
    (field: keyof TData): () => XoFormFieldMetadata
    <E extends Record<string, unknown>>(field: keyof TData, extras: () => E): () => XoFormFieldMetadata & E
  }
}

function mapMessages<TData extends Record<string, unknown>>(
  messages: FormFieldMessages<TData>,
  accent: 'danger' | 'warning'
): XoFormMessages<TData> {
  return Object.fromEntries(
    Object.entries(messages).map(([key, msg]) => [key, toInputWrapperMessage(msg, accent)])
  ) as XoFormMessages<TData>
}

/**
 * App-level wrapper around `useFormValidation` from `@core/packages/form-validation`.
 *
 * Automatically maps raw validation messages to `InputWrapperMessage` objects:
 * - errors → accent `'danger'`
 * - warnings → accent `'warning'`
 *
 * Form composables should import from here instead of `@core/packages/form-validation`
 * to get ready-to-use `errors`, `warnings`, and `useFieldMetadata` without any manual mapping.
 */
export function useFormValidation<TData extends Record<string, unknown>>(
  data: TData,
  config: FormValidationConfig<TData>
): XoFormValidationReturn<TData> {
  const {
    errors: errorMessages,
    warnings: warningMessages,
    validate,
    handleBlur,
    reset,
  } = useCoreFormValidation(data, config)

  const errors = computed<XoFormMessages<TData>>(() => mapMessages(errorMessages.value, 'danger'))

  const warnings = computed<XoFormMessages<TData>>(() => mapMessages(warningMessages.value, 'warning'))

  function useFieldMetadata(field: keyof TData): () => XoFormFieldMetadata
  function useFieldMetadata<E extends Record<string, unknown>>(
    field: keyof TData,
    extras: () => E
  ): () => XoFormFieldMetadata & E
  function useFieldMetadata<E extends Record<string, unknown> = Record<string, unknown>>(
    field: keyof TData,
    extras?: () => E
  ) {
    return () => ({
      error: errors.value[field],
      warning: warnings.value[field],
      onBlur: () => handleBlur(field),
      ...extras?.(),
    })
  }

  return { errors, warnings, validate, handleBlur, reset, useFieldMetadata }
}
