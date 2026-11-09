import type { NewRolePayload } from '@/modules/role/types.ts'
import { required } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

type NewRoleFormData = {
  name: string
  description: string
}

export function useNewRoleForm() {
  const { t } = useI18n()

  const formData = reactive<NewRoleFormData>({
    name: '',
    description: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        name: { required },
      }),
    },
  })

  async function validateAndBuildPayload(): Promise<Omit<NewRolePayload, 'privileges'> | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return {
      name: formData.name,
      ...(formData.description !== '' && { description: formData.description }),
    }
  }

  return {
    nameInputBindings: useField('name', () => ({
      label: t('name'),
      required: true,
      info: t('role:name-info'),
    })),
    descriptionInputBindings: useField('description', () => ({
      label: t('description'),
    })),
    validateAndBuildPayload,
  }
}
