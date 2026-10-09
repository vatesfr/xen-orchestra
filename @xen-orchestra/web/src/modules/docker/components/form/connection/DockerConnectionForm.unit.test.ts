import DockerConnectionForm from '@/modules/docker/components/form/connection/DockerConnectionForm.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount } from '@vue/test-utils'

const PRIVATE_KEY = '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----\n'

const FINGERPRINT = 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA'

function mountForm() {
  return mount(DockerConnectionForm, {
    props: { vm: createVm({ mainIpAddress: '10.0.0.5', addresses: { '0/ipv4/0': '10.0.0.5' } }) },
    global: createGlobalTestConfig(),
  })
}

function getSentBody(fetch: ReturnType<typeof vi.fn>, call: number) {
  return JSON.parse((fetch.mock.calls[call][1] as RequestInit).body as string)
}

it('trusts the host key with the current form, not the rejected request', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json(
        { error: 'unknown host key', data: { code: 'HOST_KEY_UNKNOWN', fingerprint: FINGERPRINT } },
        { status: 409 }
      )
    )
    .mockResolvedValueOnce(Response.json({}))
  vi.stubGlobal('fetch', fetch)

  const wrapper = mountForm()
  await wrapper.find('input[name="docker-ssh-username"]').setValue(' docker ')
  await wrapper.find('textarea').setValue(PRIVATE_KEY)
  await wrapper.find('input[name="docker-ssh-passphrase"]').setValue(' pass phrase ')
  await wrapper.find('form').trigger('submit')
  await flushPromises()

  // the username is trimmed, a passphrase is sent as typed
  expect(getSentBody(fetch, 0)).toMatchObject({ username: 'docker', passphrase: ' pass phrase ' })
  expect(getSentBody(fetch, 0)).not.toHaveProperty('hostKeyFingerprint')

  // the user fixes the username before trusting the host key
  await wrapper.find('input[name="docker-ssh-username"]').setValue('ops')
  await wrapper
    .findAll('button')
    .find(button => button.text() === t('action:trust-host-key'))!
    .trigger('click')
  await flushPromises()

  expect(getSentBody(fetch, 1)).toMatchObject({
    username: 'ops',
    privateKey: PRIVATE_KEY,
    hostKeyFingerprint: FINGERPRINT,
  })
  expect(wrapper.emitted('saved')).toHaveLength(1)
})

it('does not let the browser autofill the login password into the SSH fields', () => {
  const wrapper = mountForm()

  expect(wrapper.find('input[name="docker-ssh-username"]').attributes('autocomplete')).toBe('off')
  expect(wrapper.find('input[name="docker-ssh-passphrase"]').attributes('autocomplete')).toBe('new-password')
})
