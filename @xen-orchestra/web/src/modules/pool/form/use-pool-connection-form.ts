import { required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export type PoolConnectionFormData = {
  host: string
  httpProxy: string
  username: string
  password: string
  readOnly: boolean
  allowUnauthorized: boolean
}

export function usePoolConnectionForm() {
  const { t } = useI18n()

  const formData = reactive<PoolConnectionFormData>({
    host: '',
    httpProxy: '',
    username: '',
    password: '',
    readOnly: false,
    allowUnauthorized: false,
  })

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        host: { required: withMessage(required, () => t('host-required')) },
        username: { required: withMessage(required, () => t('username-required')) },
        password: { required: withMessage(required, () => t('password-required')) },
      }),
    },
  })

  const payload = computed(() => ({
    host: formData.host,
    username: formData.username,
    password: formData.password,
    ...(formData.httpProxy && { httpProxy: formData.httpProxy }),
    ...(formData.readOnly && { readOnly: formData.readOnly }),
    ...(formData.allowUnauthorized && { allowUnauthorized: formData.allowUnauthorized }),
  }))

  return {
    formData,
    validate,
    payload,
    hostInputBindings: useField('host', () => ({
      label: t('ip-address'),
      required: true,
      placeholder: t('ip-port-placeholder'),
      info: t('pool-connection-ip-info'),
    })),
    httpProxyInputBindings: useField('httpProxy', () => ({ label: t('proxy-url') })),
    usernameInputBindings: useField('username', () => ({
      label: t('username'),
      required: true,
      info: t('root-by-default'),
    })),
    passwordInputBindings: useField('password', () => ({ label: t('password'), required: true })),
  }
}
