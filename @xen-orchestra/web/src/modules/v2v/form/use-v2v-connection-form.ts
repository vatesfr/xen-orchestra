import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { V2V_DEFAULT_PORT } from '@/modules/v2v/utils/v2v-source.util.ts'
import { useCredentialsError } from '@/shared/composables/credentials-error.composable.ts'
import { port, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import type { XoV2vConnection } from '@vates/types'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

function createInitialFormData() {
  return {
    host: '',
    port: String(V2V_DEFAULT_PORT),
    username: '',
    password: '',
    skipSslCheck: true,
    remember: false,
  }
}

export type V2vConnectionForm = ReturnType<typeof useV2vConnectionForm>

export function useV2vConnectionForm() {
  const { t } = useI18n()

  const formData = reactive(createInitialFormData())

  const {
    useField,
    validate,
    reset: resetValidation,
  } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        host: { required: withMessage(required, () => t('host-required')) },
        port: {
          required: withMessage(required, () => t('port-required')),
          port: withMessage(port, () => t('invalid-port')),
        },
        username: { required: withMessage(required, () => t('username-required')) },
        password: { required: withMessage(required, () => t('password-required')) },
      }),
    },
  })

  const { showCredentialsError, withCredentialsError } = useCredentialsError([
    () => formData.username,
    () => formData.password,
  ])

  const connection = computed<XoV2vConnection>(() => ({
    host: formData.host.trim(),
    port: Number(formData.port),
    username: formData.username,
    password: formData.password,
    skipSslCheck: formData.skipSslCheck,
  }))

  function fill(rememberedConnection: V2vRememberedConnection) {
    Object.assign(formData, {
      host: rememberedConnection.host,
      port: String(rememberedConnection.port),
      username: rememberedConnection.username,
      password: rememberedConnection.password ?? '',
      skipSslCheck: rememberedConnection.skipSslCheck,
      // Ticking "remember" again would store a password the user chose to forget
      remember: rememberedConnection.password !== undefined,
    })
  }

  function reset() {
    Object.assign(formData, createInitialFormData())
    resetValidation()
  }

  return {
    formData,
    connection,
    validate,
    fill,
    reset,
    showCredentialsError,
    hostInputBindings: useField('host', () => ({ label: t('host'), required: true })),
    portInputBindings: useField('port', () => ({ label: t('port'), required: true })),
    usernameInputBindings: withCredentialsError(useField('username', () => ({ label: t('username'), required: true }))),
    passwordInputBindings: withCredentialsError(useField('password', () => ({ label: t('password'), required: true }))),
    skipSslCheckCheckboxBindings: useField('skipSslCheck', () => ({ label: t('skip-ssl-check') })),
    rememberCheckboxBindings: useField('remember', () => ({ label: t('remember-connection-in-browser') })),
  }
}
