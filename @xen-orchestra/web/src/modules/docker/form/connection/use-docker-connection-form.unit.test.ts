import { CUSTOM_HOST, useDockerConnectionForm } from '@/modules/docker/form/connection/use-docker-connection-form.ts'
import type { FrontXoDockerEngine } from '@/modules/docker/types/docker.type.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createDockerEngine } from '@/test/create-docker-container.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const PRIVATE_KEY = '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----\n'

const FINGERPRINT = 'SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA'

function mountForm(
  vm: FrontXoVm = createVm({
    id: 'vm-42' as FrontXoVm['id'],
    mainIpAddress: '192.168.1.100',
    addresses: { '0/ipv4/0': '192.168.1.100', '1/ipv4/0': '10.0.0.5', '0/ipv6/0': 'fe80::1' },
  }),
  engine?: FrontXoDockerEngine
) {
  return mountComposable(() => useDockerConnectionForm(vm, engine)).wrapper.vm
}

function fillValidForm(form: ReturnType<typeof mountForm>) {
  form.formData.username = 'docker'
  form.formData.privateKey = PRIVATE_KEY
}

describe('initial values', () => {
  it('pre-fills the address with the main address of the VM, and offers the others', () => {
    const form = mountForm()

    expect(form.formData.host).toBe('192.168.1.100')
    expect(form.candidateAddresses).toEqual(['192.168.1.100', '10.0.0.5'])
    expect(form.formData.port).toBe(22)
    expect(form.formData.socketPath).toBe('/var/run/docker.sock')
  })

  it('falls back to the custom host when the VM reports no address', () => {
    const form = mountForm(createVm({ mainIpAddress: undefined, addresses: {} }))

    expect(form.hasCandidateAddresses).toBe(false)
    expect(form.formData.host).toBe(CUSTOM_HOST)
    expect(form.isCustomHost).toBe(true)
  })

  it('pre-fills an edited engine, a host unknown to the VM being a custom one', () => {
    const form = mountForm(undefined, createDockerEngine({ host: 'docker.example.org', port: 2222, username: 'ops' }))

    expect(form.isEditing).toBe(true)
    expect(form.formData).toMatchObject({
      host: CUSTOM_HOST,
      customHost: 'docker.example.org',
      port: 2222,
      username: 'ops',
      privateKey: '',
    })
  })
})

describe('validation', () => {
  it('builds the creation payload of a valid form', async () => {
    const form = mountForm()
    fillValidForm(form)

    expect(await form.validateAndBuildRequest()).toEqual({
      payload: { $VM: 'vm-42', host: '192.168.1.100', port: 22, username: 'docker', privateKey: PRIVATE_KEY },
    })
  })

  it('rejects an empty host', async () => {
    const form = mountForm(createVm({ mainIpAddress: undefined, addresses: {} }))
    fillValidForm(form)

    expect(await form.validateAndBuildRequest()).toBeUndefined()
  })

  it.each([0, 70000, 22.5, undefined])('rejects the port %s', async port => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.port = port

    expect(await form.validateAndBuildRequest()).toBeUndefined()
  })

  it('rejects an empty username', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.username = ''

    expect(await form.validateAndBuildRequest()).toBeUndefined()
  })

  it('rejects a missing private key', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.privateKey = ''

    expect(await form.validateAndBuildRequest()).toBeUndefined()
  })

  it('rejects something which is not a PEM or OpenSSH private key', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.privateKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI user@host'

    expect(await form.validateAndBuildRequest()).toBeUndefined()
  })

  it('rejects a malformed fingerprint, and sends a valid one', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.hostKeyFingerprint = 'MD5:aa:bb'

    expect(await form.validateAndBuildRequest()).toBeUndefined()

    form.formData.hostKeyFingerprint = FINGERPRINT

    expect((await form.validateAndBuildRequest())?.payload).toMatchObject({ hostKeyFingerprint: FINGERPRINT })
  })

  it('sends a custom host, never the CUSTOM_HOST sentinel', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.host = CUSTOM_HOST

    expect(await form.validateAndBuildRequest()).toBeUndefined()

    form.formData.customHost = 'bastion.example.org'
    const request = await form.validateAndBuildRequest()

    expect(request?.payload.host).toBe('bastion.example.org')
    expect(JSON.stringify(request)).not.toContain(CUSTOM_HOST)
  })

  it('sends the passphrase and a non default socket path only when set', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.passphrase = 'secret'
    form.formData.socketPath = '/run/user/1000/docker.sock'

    expect((await form.validateAndBuildRequest())?.payload).toMatchObject({
      passphrase: 'secret',
      socketPath: '/run/user/1000/docker.sock',
    })
  })

  it('rejects a relative socket path', async () => {
    const form = mountForm()
    fillValidForm(form)
    form.formData.socketPath = 'docker.sock'

    expect(await form.validateAndBuildRequest()).toBeUndefined()
  })
})

describe('edition', () => {
  it('keeps the stored private key unless it is replaced', async () => {
    const engine = createDockerEngine({ host: '192.168.1.100' })
    const form = mountForm(undefined, engine)

    const request = await form.validateAndBuildRequest()

    expect(request?.engineId).toBe(engine.id)
    expect(request?.payload).not.toHaveProperty('privateKey')
    expect(request?.payload).not.toHaveProperty('hostKeyFingerprint')

    form.replacePrivateKey = true

    expect(await form.validateAndBuildRequest()).toBeUndefined()

    form.formData.privateKey = PRIVATE_KEY

    expect((await form.validateAndBuildRequest())?.payload).toMatchObject({ privateKey: PRIVATE_KEY })
  })
})

it('clearSecrets forgets the private key and the passphrase', () => {
  const form = mountForm()
  fillValidForm(form)
  form.formData.passphrase = 'secret'

  form.clearSecrets()

  expect(form.formData.privateKey).toBe('')
  expect(form.formData.passphrase).toBe('')
})
