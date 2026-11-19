import { useNewSshKeyForm } from '@/modules/account/form/use-new-ssh-key-form.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { dangerMessage, requiredMessage } from '@/test/form-messages.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'

function mountNewSshKeyForm(existingSshKeys: SshKey[] = []) {
  return mountComposableWithI18n(() => useNewSshKeyForm(() => existingSshKeys))
}

describe('validateAndBuildPayload', () => {
  it('builds the SSH key from the title and the public key', async () => {
    const form = mountNewSshKeyForm()
    form.titleInputBindings['onUpdate:modelValue']('Laptop')
    form.keyInputBindings['onUpdate:modelValue']('ssh-rsa AAA')

    expect(await form.validateAndBuildPayload()).toEqual({ title: 'Laptop', key: 'ssh-rsa AAA' })
  })

  it('accepts a key without title', async () => {
    const form = mountNewSshKeyForm()
    form.keyInputBindings['onUpdate:modelValue']('ssh-rsa AAA')

    expect(await form.validateAndBuildPayload()).toEqual({ title: '', key: 'ssh-rsa AAA' })
  })

  it('rejects an empty key', async () => {
    const form = mountNewSshKeyForm()

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.keyInputBindings.error).toEqual(requiredMessage())
  })

  it('rejects a key the user already has', async () => {
    const form = mountNewSshKeyForm([{ title: 'Laptop', key: 'ssh-rsa AAA' }])
    form.titleInputBindings['onUpdate:modelValue']('Other title')
    form.keyInputBindings['onUpdate:modelValue']('ssh-rsa AAA')

    expect(await form.validateAndBuildPayload()).toBeUndefined()
    expect(form.keyInputBindings.error).toEqual(dangerMessage(form.t('ssh-key-already-exists')))
  })

  it('accepts a key different from the existing ones', async () => {
    const form = mountNewSshKeyForm([{ title: 'Laptop', key: 'ssh-rsa AAA' }])
    form.keyInputBindings['onUpdate:modelValue']('ssh-rsa BBB')

    expect(await form.validateAndBuildPayload()).toEqual({ title: '', key: 'ssh-rsa BBB' })
  })
})
