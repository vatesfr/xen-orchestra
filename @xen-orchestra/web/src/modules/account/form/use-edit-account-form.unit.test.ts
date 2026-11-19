import { useEditAccountForm } from '@/modules/account/form/use-edit-account-form.ts'
import { createUser } from '@/test/create-user.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import type { XoUser } from '@vates/types'

function mountEditAccountForm(user: XoUser) {
  return mountComposableWithI18n(() => useEditAccountForm(user))
}

const user = createUser({ username: 'jane', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.org' })

describe('inputs', () => {
  it('start with the values of the user', () => {
    const form = mountEditAccountForm(user)

    expect(form.usernameInputBindings.modelValue).toBe('jane')
    expect(form.firstnameInputBindings.modelValue).toBe('Jane')
    expect(form.lastnameInputBindings.modelValue).toBe('Doe')
    expect(form.emailInputBindings.modelValue).toBe('jane@example.org')
  })

  it('fall back to the deprecated name when the user has no username', () => {
    const form = mountEditAccountForm(createUser({ username: undefined, name: 'legacy' }))

    expect(form.usernameInputBindings.modelValue).toBe('legacy')
  })

  it('start empty for the missing names', () => {
    const form = mountEditAccountForm(createUser({ firstname: undefined, lastname: undefined }))

    expect(form.firstnameInputBindings.modelValue).toBe('')
    expect(form.lastnameInputBindings.modelValue).toBe('')
  })
})

describe('validateAndBuildPayload', () => {
  it('builds the payload without the email when it is unchanged', async () => {
    const form = mountEditAccountForm(user)
    form.firstnameInputBindings['onUpdate:modelValue']('Janet')

    expect(await form.validateAndBuildPayload()).toEqual({ username: 'jane', firstname: 'Janet', lastname: 'Doe' })
  })

  it('adds the email to the payload when it is changed', async () => {
    const form = mountEditAccountForm(user)
    form.emailInputBindings['onUpdate:modelValue']('new@example.org')

    expect(await form.validateAndBuildPayload()).toEqual({
      username: 'jane',
      firstname: 'Jane',
      lastname: 'Doe',
      email: 'new@example.org',
    })
  })

  it('rejects an empty username', async () => {
    const form = mountEditAccountForm(user)
    form.usernameInputBindings['onUpdate:modelValue']('')

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.usernameInputBindings.error).toEqual(dangerMessage(form.t('username-required')))
  })
})
