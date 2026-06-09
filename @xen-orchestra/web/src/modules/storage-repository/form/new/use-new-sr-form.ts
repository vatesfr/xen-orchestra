import type { NewSrFormData } from '@/modules/storage-repository/form/new/sr-form.types.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export function useNewSrForm() {
  const formData = reactive<NewSrFormData>({ name: '', description: '' })
  const { t } = useI18n()

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: { required },
        description: { required },
      }),
    },
  })

  const nameInputBindings = useField('name', () => ({ label: t('name'), required: true }))
  const descriptionInputBindings = useField('description', () => ({
    label: t('description'),
    required: true,
  }))

  return { nameInputBindings, descriptionInputBindings, validate }
}
