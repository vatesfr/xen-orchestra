import { usePoolNewHostForm } from '@/modules/pool/form/use-pool-new-host-form.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

function mountPoolNewHostForm() {
  return mountComposableWithI18n(() => usePoolNewHostForm())
}

type PoolNewHostForm = ReturnType<typeof mountPoolNewHostForm>

function fillRequiredFields(form: PoolNewHostForm) {
  form.hostInputBindings['onUpdate:modelValue']('192.168.1.10')
  form.usernameInputBindings['onUpdate:modelValue']('root')
  form.passwordInputBindings['onUpdate:modelValue']('secret')
}

describe('validateAndBuildPayload', () => {
  it('reports each missing required field with its own message', async () => {
    const form = mountPoolNewHostForm()

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.hostInputBindings.error).toEqual(dangerMessage(form.t('ip-address-required')))
    expect(form.usernameInputBindings.error).toEqual(dangerMessage(form.t('username-required')))
    expect(form.passwordInputBindings.error).toEqual(dangerMessage(form.t('password-required')))
  })

  it('builds the payload of a form whose required fields are filled', async () => {
    const form = mountPoolNewHostForm()
    fillRequiredFields(form)
    form.allowUnauthorizedCheckboxBindings['onUpdate:modelValue'](true)

    expect(await form.validateAndBuildPayload()).toEqual({
      host: '192.168.1.10',
      username: 'root',
      password: 'secret',
      allowUnauthorized: true,
    })
  })
})

describe('reset', () => {
  it('empties the fields and clears their errors', async () => {
    const form = mountPoolNewHostForm()
    await form.validateAndBuildPayload()
    fillRequiredFields(form)

    form.reset()

    expect(form.hostInputBindings.modelValue).toBe('')
    expect(form.usernameInputBindings.modelValue).toBe('')
    expect(form.passwordInputBindings.modelValue).toBe('')
    expect(form.allowUnauthorizedCheckboxBindings.modelValue).toBe(false)
    expect(form.hostInputBindings.error).toBeUndefined()
  })
})
