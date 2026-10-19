import { usePoolConnectionForm } from '@/modules/pool/form/use-pool-connection-form.ts'
import { describeCredentialsErrorWiring } from '@/test/credentials-error-wiring.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

function mountPoolConnectionForm() {
  return mountComposableWithI18n(() => usePoolConnectionForm())
}

type PoolConnectionForm = ReturnType<typeof mountPoolConnectionForm>

function fillRequiredFields(form: PoolConnectionForm) {
  Object.assign(form.formData, { host: '192.168.1.10', username: 'root', password: 'secret' })
}

describe('validate', () => {
  it('reports each missing required field with its own message', async () => {
    const form = mountPoolConnectionForm()

    expect(await form.validate()).toBe(false)
    expect(form.hostInputBindings.error).toEqual(dangerMessage(form.t('ip-address-required')))
    expect(form.usernameInputBindings.error).toEqual(dangerMessage(form.t('username-required')))
    expect(form.passwordInputBindings.error).toEqual(dangerMessage(form.t('password-required')))
  })

  it('accepts a form whose required fields are filled', async () => {
    const form = mountPoolConnectionForm()
    fillRequiredFields(form)

    expect(await form.validate()).toBe(true)
    expect(form.hostInputBindings.error).toBeUndefined()
    expect(form.usernameInputBindings.error).toBeUndefined()
    expect(form.passwordInputBindings.error).toBeUndefined()
  })
})

describe('payload', () => {
  it('carries every field and drops an empty http proxy', () => {
    const form = mountPoolConnectionForm()
    fillRequiredFields(form)

    expect(form.payload).toEqual({
      host: '192.168.1.10',
      httpProxy: undefined,
      username: 'root',
      password: 'secret',
      readOnly: false,
      allowUnauthorized: false,
    })
  })

  it('keeps a filled http proxy', () => {
    const form = mountPoolConnectionForm()
    form.formData.httpProxy = 'http://proxy:3128'

    expect(form.payload.httpProxy).toBe('http://proxy:3128')
  })
})

describeCredentialsErrorWiring(mountPoolConnectionForm, fillRequiredFields)
