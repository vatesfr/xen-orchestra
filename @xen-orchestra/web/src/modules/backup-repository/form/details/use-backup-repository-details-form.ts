import type { FormValidationConfig } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'

export function useBackupRepositoryDetailsForm<TData extends Record<string, unknown>>(
  initialFormData: TData,
  config: FormValidationConfig<TData>
) {
  const formData = reactive({ ...initialFormData }) as TData

  const { useField, validate, reset: resetValidation } = useValidatedForm(formData, config)

  function reset() {
    Object.assign(formData, initialFormData)
    resetValidation()
  }

  return { formData, useField, validate, reset }
}
