import { useChangePasswordForm } from '@/modules/account/form/use-change-password-form.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

function mountChangePasswordForm() {
  return mountComposableWithI18n(() => useChangePasswordForm())
}

type ChangePasswordForm = ReturnType<typeof mountChangePasswordForm>

function fillForm(form: ChangePasswordForm, oldPassword: string, newPassword: string, confirmPassword: string) {
  form.oldPasswordInputBindings['onUpdate:modelValue'](oldPassword)
  form.newPasswordInputBindings['onUpdate:modelValue'](newPassword)
  form.confirmPasswordInputBindings['onUpdate:modelValue'](confirmPassword)
}

describe('validateAndBuildPayload', () => {
  it('builds the payload from the old and the new passwords', async () => {
    const form = mountChangePasswordForm()
    fillForm(form, 'old-password', 'new-password', 'new-password')

    expect(await form.validateAndBuildPayload()).toEqual({ oldPassword: 'old-password', newPassword: 'new-password' })
  })

  it('rejects an empty form and reports the missing passwords on their fields', async () => {
    const form = mountChangePasswordForm()

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.oldPasswordInputBindings.error).toEqual(requiredMessage())
    expect(form.newPasswordInputBindings.error).toEqual(requiredMessage())
    expect(form.confirmPasswordInputBindings.error).toEqual(requiredMessage())
  })

  it('rejects a confirmation different from the new password', async () => {
    const form = mountChangePasswordForm()
    fillForm(form, 'old-password', 'new-password', 'another-password')

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.confirmPasswordInputBindings.error).toEqual(dangerMessage(form.t('password-confirmation-different')))
  })
})
