import type { FormValidationConfig } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupRepositoryDetailsForm<TData extends Record<string, unknown>>(
  initialFormData: TData,
  config: FormValidationConfig<TData>,
  // Fields whose values differ between the edited BRs (multi-edition)
  mixedFields: (keyof TData)[] = []
) {
  const { t } = useI18n()

  const formData = reactive({ ...initialFormData }) as TData

  const { useField, validate, reset: resetValidation } = useValidatedForm(formData, config)

  function reset() {
    Object.assign(formData, initialFormData)
    resetValidation()
  }

  function getMixedPlaceholder(field: keyof TData, defaultPlaceholder?: string) {
    return mixedFields.includes(field) ? t('mixed') : defaultPlaceholder
  }

  return { formData, useField, validate, reset, getMixedPlaceholder }
}
