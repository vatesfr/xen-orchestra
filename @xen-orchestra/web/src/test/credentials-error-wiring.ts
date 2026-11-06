import { invalidCredentialsMessage } from '@/test/form-messages.ts'
import { nextTick } from 'vue'

type CredentialsForm = {
  formData: { username: string; password: string }
  showCredentialsError: () => void
  hostInputBindings: { error?: unknown }
  usernameInputBindings: { error?: unknown }
  passwordInputBindings: { error?: unknown }
}

// Every form relying on `useCredentialsError` wires it the same way: on the username and the password, not the host
export function describeCredentialsErrorWiring<TForm extends CredentialsForm>(
  mountForm: () => TForm,
  fillRequiredFields: (form: TForm) => void
) {
  describe('showCredentialsError', () => {
    it('reports invalid credentials on the username and the password, not on the host', () => {
      const form = mountForm()
      fillRequiredFields(form)

      form.showCredentialsError()

      expect(form.usernameInputBindings.error).toEqual(invalidCredentialsMessage())
      expect(form.passwordInputBindings.error).toEqual(invalidCredentialsMessage())
      expect(form.hostInputBindings.error).toBeUndefined()
    })

    it.each(['username', 'password'] as const)('clears the credentials error when the %s changes', async field => {
      const form = mountForm()
      fillRequiredFields(form)
      form.showCredentialsError()

      form.formData[field] = 'changed'
      await nextTick()

      expect(form.usernameInputBindings.error).toBeUndefined()
      expect(form.passwordInputBindings.error).toBeUndefined()
    })
  })
}
