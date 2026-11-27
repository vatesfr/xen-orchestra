import type { RegisterAppliancePayload } from '@/modules/appliance/jobs/xoa-register.job.ts'
import { email, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type RegisterApplianceFormData = {
  email: string
  password: string
}

export function useRegisterApplianceForm() {
  const { t } = useI18n()

  const formData = reactive<RegisterApplianceFormData>({
    email: '',
    password: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        email: {
          required: withMessage(required, () => t('appliance:registration-email-invalid')),
          email: withMessage(email, () => t('appliance:registration-email-invalid')),
        },
        password: { required: withMessage(required, () => t('appliance:registration-password-required')) },
      }),
    },
  })

  async function validateAndBuildPayload(): Promise<RegisterAppliancePayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      email: formData.email,
      password: formData.password,
    }
  }

  return {
    emailInputBindings: useField('email', () => ({
      label: t('email'),
      placeholder: 'you@example.com',
      required: true,
    })),
    passwordInputBindings: useField('password', () => ({
      label: t('password'),
      required: true,
    })),
    validateAndBuildPayload,
  }
}
