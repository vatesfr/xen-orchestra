import { useProxyForm } from '@/modules/appliance/form/proxy/use-proxy-form.ts'
import { useXoaProxyTestJob } from '@/modules/appliance/jobs/xoa-proxy-test.job.ts'
import type { XoaProxy, XoaProxyPayload } from '@/modules/appliance/types/xoa-proxy.type.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { flushPromises } from '@vue/test-utils'
import { nextTick, type Ref } from 'vue'

const testJob = createJobStub(useXoaProxyTestJob)

const PROXY: XoaProxy = { host: 'proxy.example.org', port: 3128, username: 'admin' }

beforeEach(() => {
  testJob.reset()
  testJob.run.mockResolvedValue({ ok: true })

  silenceConsoleError()
})

function mountProxyForm(proxy?: XoaProxy) {
  return mountComposableWithI18n(() => useProxyForm(proxy))
}

type ProxyForm = ReturnType<typeof mountProxyForm>

// Waits for the watcher forgetting the connection test, so it does not clear the result of a test run afterwards
async function fillForm(
  form: ProxyForm,
  { host = 'proxy.example.org', port = '3128', username = '', password = '' } = {}
) {
  form.hostInputBindings['onUpdate:modelValue'](host)
  form.portInputBindings['onUpdate:modelValue'](port)
  form.usernameInputBindings['onUpdate:modelValue'](username)
  form.passwordInputBindings['onUpdate:modelValue'](password)
  await nextTick()
}

function findTestPayload() {
  const [payload] = testJob.use.mock.calls[0] as [Ref<XoaProxyPayload | undefined>]

  return payload.value
}

describe('initial values', () => {
  it('is empty without proxy', () => {
    const form = mountProxyForm()

    expect(form.hostInputBindings.modelValue).toBe('')
    expect(form.portInputBindings.modelValue).toBe('')
    expect(form.usernameInputBindings.modelValue).toBe('')
    expect(form.passwordInputBindings.modelValue).toBe('')
  })

  it('is filled with the proxy, without its password', () => {
    const form = mountProxyForm(PROXY)

    expect(form.hostInputBindings.modelValue).toBe('proxy.example.org')
    expect(form.portInputBindings.modelValue).toBe('3128')
    expect(form.usernameInputBindings.modelValue).toBe('admin')
    expect(form.passwordInputBindings.modelValue).toBe('')
  })
})

describe('validateAndBuildPayload', () => {
  it('builds the payload with a numeric port and without empty credentials', async () => {
    const form = mountProxyForm()
    await fillForm(form)

    expect(await form.validateAndBuildPayload()).toEqual({ host: 'proxy.example.org', port: 3128 })
  })

  it('keeps the filled credentials', async () => {
    const form = mountProxyForm()
    await fillForm(form, { username: 'admin', password: 'secret' })

    expect(await form.validateAndBuildPayload()).toEqual({
      host: 'proxy.example.org',
      port: 3128,
      username: 'admin',
      password: 'secret',
    })
  })

  it('builds no payload when empty, and reports the host and the port', async () => {
    const form = mountProxyForm()

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.hostInputBindings.error).toEqual(dangerMessage(form.t('appliance:proxy-host-required')))
    expect(form.portInputBindings.error).toEqual(dangerMessage(form.t('appliance:proxy-port-invalid')))
  })

  it('builds no payload with an invalid port, and reports it', async () => {
    const form = mountProxyForm()
    await fillForm(form, { port: 'not-a-port' })

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.portInputBindings.error).toEqual(dangerMessage(form.t('appliance:proxy-port-invalid')))
  })
})

describe('testConnection', () => {
  it('does not test an invalid form', async () => {
    const form = mountProxyForm()

    await form.testConnection()

    expect(testJob.run).not.toHaveBeenCalled()
    expect(form.connectionTest).toBeUndefined()
  })

  it('tests the proxy of the form and reports the success with its address', async () => {
    testJob.run.mockImplementation(async () => {
      expect(findTestPayload()).toEqual({ host: 'proxy.example.org', port: 3128, username: 'admin' })

      return { ok: true }
    })
    const form = mountProxyForm()
    await fillForm(form, { username: 'admin' })

    await form.testConnection()

    expect(testJob.run).toHaveBeenCalledOnce()
    expect(form.connectionTest).toEqual({ status: 'success', address: 'proxy.example.org:3128' })
  })

  it('reports the failure the proxy answers', async () => {
    testJob.run.mockResolvedValue({ ok: false, error: 'connection refused' })
    const form = mountProxyForm()
    await fillForm(form)

    await form.testConnection()

    expect(form.connectionTest).toEqual({ status: 'failure', address: 'proxy.example.org:3128' })
  })

  it('reports a failure when the test request fails', async () => {
    testJob.run.mockRejectedValue(new Error('proxy unreachable'))
    const form = mountProxyForm()
    await fillForm(form)

    await form.testConnection()

    expect(form.connectionTest).toEqual({ status: 'failure', address: 'proxy.example.org:3128' })
  })

  it('forgets the result of the test once the form changes', async () => {
    const form = mountProxyForm()
    await fillForm(form)
    await form.testConnection()

    form.portInputBindings['onUpdate:modelValue']('8080')
    await nextTick()

    expect(form.connectionTest).toBeUndefined()
  })

  it('exposes whether the connection is being tested', () => {
    testJob.setState({ isRunning: true })

    expect(mountProxyForm().isTestingConnection).toBe(true)
  })
})
