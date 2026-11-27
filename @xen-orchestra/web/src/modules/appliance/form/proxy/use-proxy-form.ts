import { useXoaProxyTestJob } from '@/modules/appliance/jobs/xoa-proxy-test.job.ts'
import type { XoaProxy, XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { port, required, withMessage } from '@core/packages/form-validation'
import { useValidatedForm } from '@core/packages/validated-form'
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type ProxyFormData = {
  host: string
  port: string
  username: string
  password: string
}

export type ProxyTestState = { status: 'success' | 'failure'; address: string } | undefined

function getInitialFormData(proxy: XoaProxy | undefined): ProxyFormData {
  if (proxy === undefined) {
    return { host: '', port: '', username: '', password: '' }
  }

  return {
    host: proxy.host,
    port: String(proxy.port),
    username: proxy.username ?? '',
    password: '',
  }
}

export function useProxyForm(proxy?: XoaProxy) {
  const { t } = useI18n()

  const formData = reactive<ProxyFormData>(getInitialFormData(proxy))

  const { useField, validate } = useValidatedForm(formData, {
    errors: {
      onSubmit: () => ({
        host: { required: withMessage(required, () => t('appliance:proxy-host-required')) },
        port: {
          required: withMessage(required, () => t('appliance:proxy-port-invalid')),
          port: withMessage(port, () => t('appliance:proxy-port-invalid')),
        },
      }),
    },
  })

  function buildPayload(): XoaProxyPayload {
    const payload: XoaProxyPayload = {
      host: formData.host,
      port: Number(formData.port),
    }

    if (formData.username !== '') {
      payload.username = formData.username
    }

    if (formData.password !== '') {
      payload.password = formData.password
    }

    return payload
  }

  const testPayload = ref<XoaProxyPayload>()

  const { run: runProxyTest, isRunning: isTestingConnection } = useXoaProxyTestJob(testPayload)

  const connectionTest = ref<ProxyTestState>()

  async function testConnection() {
    const valid = await validate()

    if (!valid) {
      return
    }

    testPayload.value = buildPayload()

    const address = `${formData.host}:${formData.port}`

    try {
      const { ok } = await runProxyTest()

      if (ok) {
        connectionTest.value = { status: 'success', address }
      } else {
        connectionTest.value = { status: 'failure', address }
      }
    } catch (error) {
      console.error('Failed to test the proxy', error)
      connectionTest.value = { status: 'failure', address }
    }
  }

  watch(formData, () => {
    connectionTest.value = undefined
  })

  async function validateAndBuildPayload(): Promise<XoaProxyPayload | undefined> {
    const valid = await validate()

    if (!valid) {
      return undefined
    }

    return buildPayload()
  }

  return {
    connectionTest,
    isTestingConnection,
    testConnection,
    hostInputBindings: useField('host', () => ({
      label: t('host'),
      placeholder: 'proxy.example.com',
      required: true,
    })),
    portInputBindings: useField('port', () => ({
      label: t('port'),
      placeholder: '3128',
      required: true,
    })),
    usernameInputBindings: useField('username', () => ({
      label: t('username'),
      info: t('appliance:proxy-credentials-info'),
    })),
    passwordInputBindings: useField('password', () => ({
      label: t('password'),
    })),
    validateAndBuildPayload,
  }
}
