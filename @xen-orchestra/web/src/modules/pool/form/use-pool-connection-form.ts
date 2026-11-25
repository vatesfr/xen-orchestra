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

export type PoolConnectionPayload = Omit<PoolConnectionFormData, 'httpProxy'> & { httpProxy?: string }

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
        host: { required: withMessage(required, () => t('ip-address-required')) },
        username: { required: withMessage(required, () => t('username-required')) },
        password: { required: withMessage(required, () => t('password-required')) },
      }),
    },
  })

  const payload = computed<PoolConnectionPayload>(() => ({
    ...formData,
    httpProxy: formData.httpProxy === '' ? undefined : formData.httpProxy,
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
    readOnlyCheckboxBindings: useField('readOnly', () => ({ label: t('read-only') })),
    allowUnauthorizedCheckboxBindings: useField('allowUnauthorized', () => ({
      label: t('accept-self-signed-certificates'),
    })),
  }
}
