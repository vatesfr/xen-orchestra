import type { ChangeXoUserPasswordPayload } from '@/modules/account/jobs/xo-user-password-change.job.ts'
import { type Maybe, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type ChangePasswordFormData = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export function useChangePasswordForm() {
  const { t } = useI18n()

  const formData = reactive<ChangePasswordFormData>({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        oldPassword: { required },
        newPassword: { required },
        confirmPassword: {
          required,
          sameAs: withMessage(
            (value: Maybe<string>) => value === formData.newPassword,
            () => t('password-confirmation-different')
          ),
        },
      }),
    },
  })

  async function validateAndBuildPayload(): Promise<ChangeXoUserPasswordPayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    }
  }

  return {
    validateAndBuildPayload,
    oldPasswordInputBindings: useField('oldPassword', () => ({ label: t('old-password'), required: true })),
    newPasswordInputBindings: useField('newPassword', () => ({ label: t('new-password'), required: true })),
    confirmPasswordInputBindings: useField('confirmPassword', () => ({
      label: t('confirm-new-password'),
      required: true,
    })),
  }
}
