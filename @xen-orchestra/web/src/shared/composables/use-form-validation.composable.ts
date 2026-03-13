import { toInputWrapperMessage } from '@/shared/utils/input-wrapper-message.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormFieldMessages, FormValidationRules } from '@core/packages/form-validation'
import { useFormValidation as useCoreFormValidation } from '@core/packages/form-validation'
import { computed } from 'vue'

type FormMessages<TData extends Record<string, unknown>> = Partial<Record<keyof TData, InputWrapperMessage>>

function mapMessages<TData extends Record<string, unknown>>(
  messages: FormFieldMessages<TData>,
  accent: 'danger' | 'warning'
): FormMessages<TData> {
  return Object.fromEntries(
    Object.entries(messages).map(([key, msg]) => [key, toInputWrapperMessage(msg, accent)])
  ) as FormMessages<TData>
}

/**
 * App-level wrapper around `useFormValidation` from `@core/packages/form-validation`.
 *
 * Automatically maps raw validation messages to `InputWrapperMessage` objects:
 * - errors → accent `'danger'`
 * - warnings → accent `'warning'`
 *
 * Form composables should import from here instead of `@core/packages/form-validation`
 * to get ready-to-use `errors` and `warnings` without any manual mapping.
 */
export function useFormValidation<TData extends Record<string, unknown>>(
  data: TData,
  config: {
    errors: FormValidationRules<TData>
    warnings?: FormValidationRules<TData>
  }
) {
  const {
    errors: errorMessages,
    warnings: warningMessages,
    validate,
    handleBlur,
    reset,
  } = useCoreFormValidation(data, config)

  const errors = computed<FormMessages<TData>>(() => mapMessages(errorMessages.value, 'danger'))

  const warnings = computed<FormMessages<TData>>(() => mapMessages(warningMessages.value, 'warning'))

  return { errors, warnings, validate, handleBlur, reset }
}
