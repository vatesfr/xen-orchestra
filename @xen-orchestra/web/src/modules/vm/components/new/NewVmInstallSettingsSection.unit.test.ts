import NewVmInstallSettingsSection from '@/modules/vm/components/new/NewVmInstallSettingsSection.vue'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { t } from '@/test/i18n.ts'
import {
  chooseNewVmTemplate,
  mountUnderNewVmForm,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_DISKLESS_TEMPLATE,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import UiChip from '@core/components/ui/chip/UiChip.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
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

const LONG_SSH_KEY = `ssh-rsa ${'A'.repeat(300)} user@host`

beforeEach(() => {
  resetNewVmCollections()
})

async function mountSection(template = NEW_VM_DISK_TEMPLATE) {
  seedNewVmCollections()

  const mounted = mountUnderNewVmForm(NewVmInstallSettingsSection)

  await chooseNewVmTemplate(mounted.form, template)

  return mounted
}

function findInstallSources(wrapper: Awaited<ReturnType<typeof mountSection>>['wrapper']) {
  return wrapper.findAllComponents(UiRadioButton).map(radio => radio.text())
}

it('offers the configurations of a template with a disk, then the ISO', async () => {
  const { wrapper } = await mountSection()

  expect(findInstallSources(wrapper)).toEqual([t('no-config'), t('ssh-key'), t('cloud-init-config'), t('iso-dvd')])
})

it('offers the network and the ISO for a template without disk', async () => {
  const { wrapper } = await mountSection(NEW_VM_DISKLESS_TEMPLATE)

  expect(findInstallSources(wrapper)).toEqual([t('pxe'), t('iso-dvd')])
})

async function mountSectionWithSshKeys(sshKeys: string[]) {
  const mounted = await mountSection()

  Object.assign(mounted.form.vmState, { installMode: 'ssh-key', sshKeys })
  await nextTick()

  return mounted
}

it('lists the SSH keys added to the VM', async () => {
  const { wrapper } = await mountSectionWithSshKeys(['ssh-rsa AAA', 'ssh-ed25519 BBB'])

  expect(wrapper.findAllComponents(UiChip).map(chip => chip.text())).toEqual(['ssh-rsa AAA', 'ssh-ed25519 BBB'])
})

it('shows an SSH key in full on hover, however long it is', async () => {
  const { wrapper } = await mountSectionWithSshKeys([LONG_SSH_KEY])

  expect(await findTooltipContent(wrapper.getComponent(UiChip).element)).toBe(LONG_SSH_KEY)
})

it('removes the SSH key whose chip is dismissed', async () => {
  const { wrapper, form } = await mountSectionWithSshKeys(['ssh-rsa AAA', 'ssh-ed25519 BBB'])

  wrapper.findAllComponents(UiChip)[0].vm.$emit('remove')

  expect(form.vmState.sshKeys).toEqual(['ssh-ed25519 BBB'])
})
