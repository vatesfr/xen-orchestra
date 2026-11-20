import NewVmReviewStep from '@/modules/vm/components/new/steps/NewVmReviewStep.vue'
import { findOverriddenLabels } from '@/test/find-overridden-labels.ts'
import { findLabelledValues, findTableRows } from '@/test/find-rendered-values.ts'
import { findTableColumn } from '@/test/find-table-cells.ts'
import { findTitles } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import {
  chooseNewVmTemplate,
  mountUnderNewVmForm,
  NEW_VM_DISK_TEMPLATE,
  NEW_VM_DISKLESS_TEMPLATE,
  NEW_VM_HOST,
  NEW_VM_ISO,
  NEW_VM_ISO_SR_NAME,
  NEW_VM_POOL,
  NEW_VM_TEMPLATE_VDI,
  NEW_VM_TEMPLATE_VIF,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
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
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
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

beforeEach(() => {
  resetNewVmCollections()
})

async function mountStep(template = NEW_VM_DISK_TEMPLATE) {
  seedNewVmCollections()

  const mounted = mountUnderNewVmForm(NewVmReviewStep)

  await chooseNewVmTemplate(mounted.form, template)

  return mounted
}

it('lays out the same sections as the configuration', async () => {
  const { wrapper } = await mountStep()

  expect(findTitles(wrapper)).toEqual([
    t('new-vm:environment-setup'),
    t('install-settings'),
    t('general-information'),
    t('resource-management'),
    t('vifs'),
    t('vdis'),
    t('settings'),
  ])
})

it('recaps the configuration of a UEFI template', async () => {
  const { wrapper } = await mountStep()

  expect(findLabelledValues(wrapper)).toEqual({
    [t('pool')]: NEW_VM_POOL.name_label,
    [t('template')]: 'Debian 12',
    [t('new-vm:install-source')]: t('no-config'),
    [t('new-vm:name')]: 'Debian 12',
    [t('new-vm:description')]: 'Debian template',
    [t('boot-firmware')]: 'UEFI',
    [t('affinity-host')]: '',
    [t('high-availability')]: t('new-vm:ha-disabled'),
    [t('vtpm')]: t('disabled'),
    [t('secure-boot')]: t('disabled'),
    [t('vcpus')]: '2',
    [t('ram')]: t('n-gb', { n: 4 }),
    [t('action:boot-vm')]: t('enabled'),
    [t('auto-power')]: t('disabled'),
    [t('fast-clone')]: t('enabled'),
  })
})

it('recaps the BIOS strings in place of the vTPM and secure boot on BIOS', async () => {
  const { wrapper } = await mountStep(NEW_VM_DISKLESS_TEMPLATE)

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('boot-firmware')]: 'BIOS',
    [t('copy-host-bios-strings')]: t('disabled'),
  })
  expect(findLabelledValues(wrapper)).not.toHaveProperty([t('vtpm')])
})

it('leaves fast clone out for a template without disk', async () => {
  const { wrapper } = await mountStep(NEW_VM_DISKLESS_TEMPLATE)

  expect(findLabelledValues(wrapper)).not.toHaveProperty([t('fast-clone')])
})

it('leaves the affinity host to the placeholder of its row when none is chosen', async () => {
  const { wrapper } = await mountStep()

  const affinityHostRow = wrapper
    .findAll('.vts-tabular-key-value-row')
    .find(row => row.get('dt.label').text() === t('affinity-host'))

  expect(affinityHostRow?.find('dd.value .text-ellipsis > *').exists()).toBe(false)
})

it('names the affinity host and the chosen ISO', async () => {
  const { wrapper, form } = await mountStep()

  Object.assign(form.vmState, { affinity_host: NEW_VM_HOST.id, installMode: 'cdrom', selectedVdi: NEW_VM_ISO.id })
  await nextTick()

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('affinity-host')]: NEW_VM_HOST.name_label,
    [t('new-vm:install-source')]: t('iso-dvd'),
    [t('new-vm:iso-file')]: `[${NEW_VM_ISO_SR_NAME}] ${NEW_VM_ISO.name_label}`,
  })
})

it('lists the SSH keys', async () => {
  const { wrapper, form } = await mountStep()

  Object.assign(form.vmState, { installMode: 'ssh-key', sshKeys: ['ssh-rsa AAA', 'ssh-ed25519 BBB'] })
  await nextTick()

  const rows = wrapper
    .findAll('.vts-tabular-key-value-row')
    .map(row => [row.get('dt.label').text(), row.get('dd.value').text()])
  const firstKeyIndex = rows.findIndex(([label]) => label === t('ssh-keys'))

  expect(rows.slice(firstKeyIndex - 1, firstKeyIndex + 2)).toEqual([
    [t('new-vm:install-source'), t('ssh-key')],
    [t('ssh-keys'), 'ssh-rsa AAA'],
    ['', 'ssh-ed25519 BBB'],
  ])
})

it('shows the custom cloud-init configs that are filled in', async () => {
  const { wrapper, form } = await mountStep()

  Object.assign(form.vmState, { installMode: 'cloud-init-config', cloudConfig: '#cloud-config', networkConfig: '' })
  await nextTick()

  expect(
    wrapper.findAllComponents(UiLogEntryViewer).map(viewer => [viewer.props('label'), viewer.props('content')])
  ).toEqual([[t('user-config'), '#cloud-config']])
})

it('marks the values moved away from the template', async () => {
  const { wrapper, form } = await mountStep()

  form.vmState.vCPU = 8
  await nextTick()

  expect(findOverriddenLabels(wrapper)).toEqual([t('overridden')])
})

it('marks nothing on an untouched template', async () => {
  const { wrapper } = await mountStep()

  expect(findOverriddenLabels(wrapper)).toEqual([])
})

it('lists the network interfaces, the added ones marked', async () => {
  const { wrapper, form } = await mountStep()

  form.addVif()
  await nextTick()

  const table = wrapper.findComponent('.new-vm-review-vifs-table')

  expect(findTableColumn(table, '')).toEqual(['#1', '#2'])
  expect(findTableColumn(table, t('network'))).toEqual(['Template network', 'Automatic network'])
  expect(findTableColumn(table, t('mac-addresses'))).toEqual([t('auto-generated'), t('auto-generated')])
  expect(findOverriddenLabels(table)).toEqual([t('added')])
})

it('counts the removed network interfaces under their table', async () => {
  const { wrapper, form } = await mountStep()

  form.removeVif(NEW_VM_TEMPLATE_VIF.id)
  await nextTick()

  expect(findOverriddenLabels(wrapper.findComponent('.new-vm-review-vifs-table'))).toEqual([
    t('new-vm:n-vifs-deleted', 1),
  ])
})

it('lists the disks with how each one is created', async () => {
  const { wrapper, form } = await mountStep()

  form.addVdi()
  await nextTick()

  const table = wrapper.findComponent('.new-vm-review-vdis-table')

  expect(findTableColumn(table, '')).toEqual(['#1', '#2'])
  expect(findTableColumn(table, t('disk-name'))).toEqual(['Template disk', form.vmState.vdis[0].name_label])
  expect(findTableColumn(table, t('storage-repositories'))).toEqual([
    'Pool SR (Host of the pool)',
    'Pool SR (Host of the pool)',
  ])
  expect(findTableColumn(table, t('size'))).toEqual([t('n-gb', { n: 10 }), t('n-gb', { n: 0 })])
  expect(findTableColumn(table, t('new-vm:vdi-creation'))).toEqual([
    t('new-vm:copy-from-template-vdi'),
    t('new-vm:new-empty-vdi'),
  ])
  expect(findOverriddenLabels(table)).toEqual([t('added')])
})

it('counts the removed disks under their table', async () => {
  const { wrapper, form } = await mountStep()

  form.removeVdi(NEW_VM_TEMPLATE_VDI.id)
  await nextTick()

  const table = wrapper.findComponent('.new-vm-review-vdis-table')

  expect(findTableRows(table)).toEqual([])
  expect(findOverriddenLabels(table)).toEqual([t('new-vm:n-vdis-deleted', 1)])
})

it.each([
  ['network interface', '.new-vm-review-vifs-table', 'new-vm:no-vif-configured'],
  ['disk', '.new-vm-review-vdis-table', 'new-vm:no-vdi-configured'],
])('tells that no %s is configured in place of an empty table', async (_, section, message) => {
  const { wrapper, form } = await mountStep()

  form.removeVif(NEW_VM_TEMPLATE_VIF.id)
  form.removeVdi(NEW_VM_TEMPLATE_VDI.id)
  await nextTick()

  const content = wrapper.findComponent(section)

  expect(content.findComponent(VtsTable).exists()).toBe(false)
  expect(content.get('p').text()).toBe(t(message))
})
