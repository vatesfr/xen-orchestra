import { useNewVmPayload } from '@/modules/vm/composables/use-new-vm-payload.composable.ts'
import { provideNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import { buildSshCloudConfig } from '@/modules/vm/utils/new-vm.util.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import {
  chooseNewVmTemplate,
  NEW_VM_AUTOMATIC_NETWORK,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_DISKLESS_TEMPLATE,
  NEW_VM_HOST,
  NEW_VM_ISO,
  NEW_VM_OTHER_SR,
  NEW_VM_POOL,
  NEW_VM_TEMPLATE_VDI,
  NEW_VM_TEMPLATE_VIF,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { nextTick } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

vi.mock(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

vi.mock(
  import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

const GIB = 1024 ** 3

beforeEach(() => {
  resetNewVmCollections()
})

function mountPayloadWithoutTemplate() {
  seedNewVmCollections()

  return mountComposable(() => {
    const form = provideNewVmForm()

    return { ...form, payload: useNewVmPayload(form) }
  }).wrapper.vm
}

async function mountPayload(template = NEW_VM_DISK_TEMPLATE) {
  const result = mountPayloadWithoutTemplate()

  await chooseNewVmTemplate(result, template)

  return result
}

it('describes the VM of an untouched template', async () => {
  const { payload } = await mountPayload()

  expect(payload).toEqual({
    autoPoweron: false,
    boot: true,
    cpus: 2,
    clone: true,
    memory: 4 * GIB,
    name_description: 'Debian template',
    name_label: 'Debian 12',
    template: NEW_VM_DISK_TEMPLATE.uuid,
    hvmBootFirmware: 'uefi',
    copyHostBiosStrings: false,
    createVtpm: false,
    secureBoot: false,
    high_availability: '',
    poolId: NEW_VM_POOL.id,
  })
})

it('sets the affinity host when one is chosen', async () => {
  const result = await mountPayload()

  result.vmState.affinity_host = NEW_VM_HOST.id

  expect(result.payload).toMatchObject({ affinity: NEW_VM_HOST.id })
})

describe('vdis', () => {
  it('destroys a template disk the user removed', async () => {
    const result = await mountPayload()

    result.removeVdi(NEW_VM_TEMPLATE_VDI.id)

    expect(result.payload).toMatchObject({ vdis: [{ userdevice: '0', destroy: true }] })
  })

  it('leaves alone a template disk loaded after the template was chosen', async () => {
    const result = mountPayloadWithoutTemplate()
    vmDeviceCollectionsMock.vdis.value = []
    await chooseNewVmTemplate(result)

    vmDeviceCollectionsMock.vdis.value = [NEW_VM_TEMPLATE_VDI]
    await nextTick()

    expect(result.payload).not.toHaveProperty('vdis')
  })

  it('sends only the changed fields of a template disk', async () => {
    const result = await mountPayload()

    result.vmState.existingVdis[0].name_label = 'Renamed disk'
    result.vmState.existingVdis[0].sr = NEW_VM_OTHER_SR.id

    expect(result.payload).toMatchObject({
      vdis: [{ userdevice: '0', name_label: 'Renamed disk', sr: NEW_VM_OTHER_SR.id }],
    })
  })

  it('sends the new size of a template disk in bytes when it can be resized', async () => {
    const result = await mountPayload()
    result.vmState.installMode = 'cdrom'
    await nextTick()

    result.vmState.existingVdis[0].size = 20

    expect(result.payload).toMatchObject({ vdis: [{ userdevice: '0', size: 20 * GIB }] })
  })

  it('creates the disks the user added, sized in bytes', async () => {
    const result = await mountPayload()

    result.addVdi()
    result.vmState.vdis[0].size = 5

    expect(result.payload).toMatchObject({
      vdis: [
        {
          name_label: result.vmState.vdis[0].name_label,
          name_description: 'Created by XO',
          sr: NEW_VM_POOL.default_SR,
          size: 5 * GIB,
        },
      ],
    })
  })
})

describe('vifs', () => {
  it('destroys a template interface the user removed', async () => {
    const result = await mountPayload()

    result.removeVif(NEW_VM_TEMPLATE_VIF.id)

    expect(result.payload).toMatchObject({ vifs: [{ device: '0', destroy: true }] })
  })

  it('leaves alone a template interface loaded after the template was chosen', async () => {
    const result = mountPayloadWithoutTemplate()
    vmDeviceCollectionsMock.vifs.value = []
    await chooseNewVmTemplate(result)

    vmDeviceCollectionsMock.vifs.value = [NEW_VM_TEMPLATE_VIF]
    await nextTick()

    expect(result.payload).not.toHaveProperty('vifs')
  })

  it('sends the new network of a template interface', async () => {
    const result = await mountPayload()

    result.vmState.vifs[0].network = NEW_VM_AUTOMATIC_NETWORK.id

    expect(result.payload).toMatchObject({ vifs: [{ device: '0', network: NEW_VM_AUTOMATIC_NETWORK.id, mac: '' }] })
  })

  it('creates the interfaces the user added', async () => {
    const result = await mountPayload()

    result.addVif()

    expect(result.payload).toMatchObject({ vifs: [{ network: NEW_VM_AUTOMATIC_NETWORK.id, mac: '' }] })
  })
})

describe('install', () => {
  it('installs from the chosen ISO', async () => {
    const result = await mountPayload()

    result.vmState.installMode = 'cdrom'
    result.vmState.selectedVdi = NEW_VM_ISO.id

    expect(result.payload).toMatchObject({ install: { method: 'cdrom', repository: NEW_VM_ISO.id } })
  })

  it('installs from the network without a repository', async () => {
    const result = await mountPayload(NEW_VM_DISKLESS_TEMPLATE)

    result.vmState.installMode = 'network'

    expect(result.payload).toMatchObject({ install: { method: 'network', repository: '' } })
  })

  it('sends no installation without configuration', async () => {
    const { payload } = await mountPayload()

    expect(payload).not.toHaveProperty('install')
  })
})

describe('cloud config', () => {
  it('resolves the variables of the custom configs', async () => {
    const result = await mountPayload()

    result.vmState.installMode = 'cloud-init-config'
    result.vmState.cloudConfig = 'hostname: {name}-{index}'
    result.vmState.networkConfig = 'name: {name}'

    expect(result.payload).toMatchObject({ cloud_config: 'hostname: Debian 12-0', network_config: 'name: Debian 12' })
  })

  it('leaves empty custom configs out', async () => {
    const result = await mountPayload()

    result.vmState.installMode = 'cloud-init-config'

    expect(result.payload).not.toHaveProperty('cloud_config')
    expect(result.payload).not.toHaveProperty('network_config')
  })

  it('sends the config built from the SSH keys', async () => {
    const result = await mountPayload()
    result.vmState.installMode = 'ssh-key'

    result.vmState.sshKeys.push('ssh-rsa AAA')

    expect(result.payload).toMatchObject({ cloud_config: buildSshCloudConfig('Debian 12', ['ssh-rsa AAA']) })
  })

  it('names the host after a VM renamed once its SSH keys are added', async () => {
    const result = await mountPayload()
    result.vmState.installMode = 'ssh-key'
    result.vmState.sshKeys.push('ssh-rsa AAA')

    result.vmState.name = 'Renamed VM'

    expect(result.payload).toMatchObject({ cloud_config: buildSshCloudConfig('Renamed VM', ['ssh-rsa AAA']) })
  })

  it('sends no config without SSH key', async () => {
    const result = await mountPayload()

    result.vmState.installMode = 'ssh-key'

    expect(result.payload).not.toHaveProperty('cloud_config')
  })

  it('keeps the SSH keys out of the custom user config', async () => {
    const result = await mountPayload()
    result.vmState.installMode = 'ssh-key'
    result.vmState.sshKeys.push('ssh-rsa AAA')

    result.vmState.installMode = 'cloud-init-config'

    expect(result.payload).not.toHaveProperty('cloud_config')
  })
})
