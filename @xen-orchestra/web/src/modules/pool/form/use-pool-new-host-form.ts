import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type PoolNewHostFormData = {
  host: string
  username: string
  password: string
  allowUnauthorized: boolean
}

export function usePoolNewHostForm() {
  const { t } = useI18n()

  const formData = reactive<PoolNewHostFormData>({
    host: '',
    username: '',
    password: '',
    allowUnauthorized: false,
  })

  const {
    useField,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        host: { required: withMessage(required, () => t('ip-address-required')) },
        username: { required: withMessage(required, () => t('username-required')) },
        password: { required: withMessage(required, () => t('password-required')) },
      }),
    },
  })

  async function validateAndBuildPayload(): Promise<PoolNewHostFormData | undefined> {
    const isValid = await validate()

    if (!isValid) {
      return undefined
    }

    return { ...formData }
  }

  function reset() {
    Object.assign(formData, { host: '', username: '', password: '', allowUnauthorized: false })
    resetValidation()
  }

  return {
    validateAndBuildPayload,
    reset,
    hostInputBindings: useField('host', () => ({
      label: t('ip-address'),
      required: true,
      placeholder: t('ip-port-placeholder'),
      info: t('pool-add-host:ip-info'),
    })),
    usernameInputBindings: useField('username', () => ({
      label: t('username'),
      required: true,
      info: t('root-by-default'),
    })),
    passwordInputBindings: useField('password', () => ({ label: t('password'), required: true })),
    allowUnauthorizedCheckboxBindings: useField('allowUnauthorized', () => ({
      label: t('accept-self-signed-certificates'),
    })),
  }
}
