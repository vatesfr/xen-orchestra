import type { EditXoUserPayload } from '@/modules/user/jobs/xo-user-edit.job.ts'
import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import type { XoUser } from '@vates/types'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type EditAccountFormData = {
  username: string
  firstname: string
  lastname: string
  email: string
}

export function useEditAccountForm(user: XoUser) {
  const { t } = useI18n()

  const formData = reactive<EditAccountFormData>({
    username: user.username ?? user.name ?? '',
    firstname: user.firstname ?? '',
    lastname: user.lastname ?? '',
    email: user.email,
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        username: { required: withMessage(required, () => t('username-required')) },
      }),
    },
  })

  async function validateAndBuildPayload(): Promise<EditXoUserPayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return {
      username: formData.username,
      firstname: formData.firstname,
      lastname: formData.lastname,
      ...(formData.email !== user.email && { email: formData.email }),
    }
  }

  return {
    validateAndBuildPayload,
    usernameInputBindings: useField('username', () => ({ label: t('username'), required: true })),
    firstnameInputBindings: useField('firstname', () => ({ label: t('first-name') })),
    lastnameInputBindings: useField('lastname', () => ({ label: t('last-name') })),
    emailInputBindings: useField('email', () => ({ label: t('email-address') })),
  }
}
