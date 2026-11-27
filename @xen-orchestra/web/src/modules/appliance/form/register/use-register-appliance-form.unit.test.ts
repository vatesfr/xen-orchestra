import { useRegisterApplianceForm } from '@/modules/appliance/form/register/use-register-appliance-form.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

function mountRegisterApplianceForm() {
  return mountComposableWithI18n(() => useRegisterApplianceForm())
}

type RegisterApplianceForm = ReturnType<typeof mountRegisterApplianceForm>

function fillForm(form: RegisterApplianceForm, { email = 'admin@example.org', password = 'secret' } = {}) {
  form.emailInputBindings['onUpdate:modelValue'](email)
  form.passwordInputBindings['onUpdate:modelValue'](password)
}

describe('validateAndBuildPayload', () => {
  it('builds the payload with the credentials', async () => {
    const form = mountRegisterApplianceForm()
    fillForm(form)

    expect(await form.validateAndBuildPayload()).toEqual({ email: 'admin@example.org', password: 'secret' })
  })

  it('builds no payload when empty, and reports each field', async () => {
    const form = mountRegisterApplianceForm()

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.emailInputBindings.error).toEqual(dangerMessage(form.t('appliance:registration-email-invalid')))
    expect(form.passwordInputBindings.error).toEqual(dangerMessage(form.t('appliance:registration-password-required')))
  })

  it('builds no payload with an invalid email, and reports it', async () => {
    const form = mountRegisterApplianceForm()
    fillForm(form, { email: 'not-an-email' })

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    await flushPromises()
    expect(form.emailInputBindings.error).toEqual(dangerMessage(form.t('appliance:registration-email-invalid')))
    expect(form.passwordInputBindings.error).toBeUndefined()
  })
})
