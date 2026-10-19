import { useV2vConnectionForm } from '@/modules/v2v/form/use-v2v-connection-form.ts'
import { createV2vRememberedConnection } from '@/test/create-v2v-connection.ts'
import { describeCredentialsErrorWiring } from '@/test/credentials-error-wiring.ts'
import { fillV2vConnectionForm } from '@/test/fill-v2v-connection-form.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { nextTick } from 'vue'

function mountConnectionForm() {
  return mountComposableWithI18n(() => useV2vConnectionForm())
}

describe('formData', () => {
  it('starts on port 443, skipping the SSL check, without remembering the connection', () => {
    expect(mountConnectionForm().formData).toEqual({
      host: '',
      port: '443',
      username: '',
      password: '',
      skipSslCheck: true,
      remember: false,
    })
  })
})

describe.each(['hostInputBindings', 'portInputBindings', 'usernameInputBindings', 'passwordInputBindings'] as const)(
  '%s',
  bindingsName => {
    it('is required', () => {
      expect(mountConnectionForm()[bindingsName].required).toBe(true)
    })

    it('shows no error before the form is submitted', () => {
      expect(mountConnectionForm()[bindingsName].error).toBeUndefined()
    })
  }
)

describe('validate', () => {
  it('reports each missing required field with its own message', async () => {
    const form = mountConnectionForm()
    form.formData.port = ''

    expect(await form.validate()).toBe(false)
    expect(form.hostInputBindings.error).toEqual(dangerMessage(form.t('host-required')))
    expect(form.portInputBindings.error).toEqual(dangerMessage(form.t('port-required')))
    expect(form.usernameInputBindings.error).toEqual(dangerMessage(form.t('username-required')))
    expect(form.passwordInputBindings.error).toEqual(dangerMessage(form.t('password-required')))
  })

  it('reports a host made of spaces only as missing', async () => {
    const form = mountConnectionForm()
    fillV2vConnectionForm(form)
    form.formData.host = '   '

    expect(await form.validate()).toBe(false)
    expect(form.hostInputBindings.error).toEqual(dangerMessage(form.t('host-required')))
  })

  it('reports an invalid port', async () => {
    const form = mountConnectionForm()
    fillV2vConnectionForm(form)
    form.formData.port = '65536'

    expect(await form.validate()).toBe(false)
    expect(form.portInputBindings.error).toEqual(dangerMessage(form.t('invalid-port')))
  })

  it('accepts a form whose fields are all valid', async () => {
    const form = mountConnectionForm()
    fillV2vConnectionForm(form)

    expect(await form.validate()).toBe(true)
  })
})

describe('connection', () => {
  it('builds the connection with a trimmed host and a numeric port', () => {
    const form = mountConnectionForm()
    fillV2vConnectionForm(form)
    Object.assign(form.formData, { host: ' vcenter.lab ', port: '8443', skipSslCheck: false })

    expect(form.connection).toEqual({
      host: 'vcenter.lab',
      port: 8443,
      username: 'migration@vsphere.local',
      password: 'secret',
      skipSslCheck: false,
    })
  })
})

describe('fill', () => {
  it('fills the form with a remembered connection and keeps remembering it with its password', () => {
    const form = mountConnectionForm()

    form.fill(createV2vRememberedConnection({ host: 'esxi.lab', port: 8443, skipSslCheck: false }))

    expect(form.formData).toEqual({
      host: 'esxi.lab',
      port: '8443',
      username: 'migration@vsphere.local',
      password: 'secret',
      skipSslCheck: false,
      remember: true,
    })
  })

  it('leaves the password empty and stops remembering when the password was not remembered', () => {
    const form = mountConnectionForm()

    form.fill(createV2vRememberedConnection({ password: undefined }))

    expect(form.formData.password).toBe('')
    expect(form.formData.remember).toBe(false)
  })
})

describe('reset', () => {
  it('restores the initial values and clears the errors', async () => {
    const form = mountConnectionForm()
    form.fill(createV2vRememberedConnection())
    form.formData.password = ''
    await form.validate()

    form.reset()
    await nextTick()

    expect(form.formData).toEqual(mountConnectionForm().formData)
    expect(form.passwordInputBindings.error).toBeUndefined()
  })
})

describeCredentialsErrorWiring(mountConnectionForm, fillV2vConnectionForm)
