import NewVmNetworkTable from '@/modules/vm/components/new/NewVmNetworkTable.vue'
import NewVmSrTable from '@/modules/vm/components/new/NewVmSrTable.vue'
import NewVmConfigurationStep from '@/modules/vm/components/new/steps/NewVmConfigurationStep.vue'
import { createNetwork } from '@/test/create-network.ts'
import { findAccentedInfos } from '@/test/find-accented-labels.ts'
import { findAllGenericComponents } from '@/test/find-generic-components.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTableColumn } from '@/test/find-table-cells.ts'
import { findTitles } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  chooseNewVmTemplate,
  mountUnderNewVmForm,
  NEW_VM_NETWORK,
  NEW_VM_POOL,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { findSelectOptionLabels, openSelect } from '@/test/select.ts'
import UiInput from '@core/components/ui/input/UiInput.vue'
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

beforeEach(() => {
  resetNewVmCollections()
})

async function mountStep() {
  seedNewVmCollections()

  const mounted = mountUnderNewVmForm(NewVmConfigurationStep)

  await chooseNewVmTemplate(mounted.form)

  return mounted
}

type Table = Awaited<ReturnType<typeof mountStep>>['wrapper']

// The trash of the first row: the only icon button of its last cell
function clickFirstTrash(table: Pick<Table, 'get'>) {
  return table.get('tbody tr td:last-child button').trigger('click')
}

function isSizeInput(input: { props(name: 'type'): unknown }) {
  return input.props('type') === 'number'
}

function findFieldValues(table: Pick<Table, 'findAll'>) {
  return table.findAll<HTMLInputElement>('tbody input:not([readonly])').map(input => input.element.value)
}

it('lays out the sections of the configuration, the environment first', async () => {
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

it('recalls the pool and the template chosen on the first step', async () => {
  const { wrapper } = await mountStep()

  expect(findLabelledValues(wrapper)).toEqual({ [t('pool')]: NEW_VM_POOL.name_label, [t('template')]: 'Debian 12' })
})

it('numbers the network interfaces and the disks, above the button adding one', async () => {
  const { wrapper, form } = await mountStep()

  form.addVif()
  form.addVdi()
  await nextTick()

  expect(findTableColumn(wrapper.getComponent(NewVmNetworkTable), '')).toEqual(['#1', '#2', t('new')])
  expect(findTableColumn(wrapper.getComponent(NewVmSrTable), '')).toEqual(['#1', '#2', t('new')])
})

it('offers a network interface the networks that joined the pool since it was listed', async () => {
  const { wrapper } = await mountStep()
  const newNetwork = createNetwork({ id: 'network-new' as typeof NEW_VM_NETWORK.id, name_label: 'New network' })

  xoCollectionsMock.networks.value = [...xoCollectionsMock.networks.value, newNetwork]
  await openSelect(wrapper.getComponent(NewVmNetworkTable))

  expect(findSelectOptionLabels(wrapper.getComponent(NewVmNetworkTable))).toContain('New network')
})

it('renumbers the disks left once one is removed', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  await nextTick()

  form.removeVdi(form.vmState.existingVdis[0].key)
  await nextTick()

  expect(findTableColumn(wrapper.getComponent(NewVmSrTable), '')).toEqual(['#1', t('new')])
})

it('removes the network interface whose trash is clicked, whatever was removed before', async () => {
  const { wrapper, form } = await mountStep()
  form.addVif()
  form.addVif()
  form.vmState.vifs[1].mac = 'aa:aa:aa:aa:aa:aa'
  form.vmState.vifs[2].mac = 'bb:bb:bb:bb:bb:bb'
  await nextTick()

  await clickFirstTrash(wrapper.getComponent(NewVmNetworkTable))
  await clickFirstTrash(wrapper.getComponent(NewVmNetworkTable))

  expect(form.vmState.vifs.map(vif => vif.mac)).toEqual(['bb:bb:bb:bb:bb:bb'])
  expect(findTableColumn(wrapper.getComponent(NewVmNetworkTable), '')).toEqual(['#1', t('new')])
  expect(findFieldValues(wrapper.getComponent(NewVmNetworkTable))).toEqual(['bb:bb:bb:bb:bb:bb'])
})

it('removes the disk whose trash is clicked, whatever was removed before', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.addVdi()
  form.vmState.vdis[0].name_label = 'First new disk'
  form.vmState.vdis[1].name_label = 'Second new disk'
  await nextTick()

  await clickFirstTrash(wrapper.getComponent(NewVmSrTable))
  await clickFirstTrash(wrapper.getComponent(NewVmSrTable))

  expect(form.vmState.existingVdis).toEqual([])
  expect(form.vmState.vdis.map(vdi => vdi.name_label)).toEqual(['Second new disk'])
  expect(findTableColumn(wrapper.getComponent(NewVmSrTable), '')).toEqual(['#1', t('new')])
  expect(findFieldValues(wrapper.getComponent(NewVmSrTable))).toContain('Second new disk')
})

it('reads the size typed for a disk as a number', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  await nextTick()

  await wrapper.getComponent(NewVmSrTable).findAll('tbody input[type="number"]').at(-1)?.setValue('20')

  expect(form.vmState.vdis[0].size).toBe(20)
})

it('tells which template disk is smaller than in the template', async () => {
  const { wrapper, form } = await mountStep()

  form.vmState.existingVdis[0].size = 5
  await nextTick()

  expect(findAccentedInfos(wrapper)).toContainEqual({
    label: t('new-vm:disk-size-below-template', { name: 'Template disk', size: 10 }),
    accent: 'danger',
  })
})

it('marks the size of a new disk below 1 GB as the field in error once the step is validated', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.addVdi()
  form.vmState.vdis[0].size = 5
  await nextTick()
  const sizeInputs = wrapper.getComponent(NewVmSrTable).findAllComponents(UiInput).filter(isSizeInput)

  await form.validateStep('configuration')
  await nextTick()

  expect(sizeInputs.map(input => input.props('accent'))).toEqual(['brand', 'brand', 'danger'])
  expect(wrapper.find(`[id="${form.fieldIds.vdis}"]`).element).toBe(sizeInputs[2].get('input').element)
})

it('marks the SR of a new disk without one as the field in error once the step is validated', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.vmState.vdis[0].sr = undefined
  form.vmState.vdis[0].size = 5
  const table = wrapper.getComponent(NewVmSrTable)

  await form.validateStep('configuration')
  await nextTick()

  expect(findAllGenericComponents(table, 'VtsSelect').map(select => select.props('accent'))).toEqual([
    'brand',
    'danger',
  ])
  expect(wrapper.find(`[id="${form.fieldIds.vdis}"]`).element).toBe(table.findAll('tbody tr')[1].element)
})

it('tells that a new disk needs an SR once the step is validated', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.vmState.vdis[0].sr = undefined

  await form.validateStep('configuration')
  await nextTick()

  expect(findAccentedInfos(wrapper)).toContainEqual({ label: t('job:arg:sr-vdi-required'), accent: 'danger' })
})

it('tells that the name is required once the step is validated', async () => {
  const { wrapper, form } = await mountStep()
  form.vmState.name = ''

  await form.validateStep('configuration')
  await nextTick()

  expect(findAccentedInfos(wrapper)).toContainEqual({ label: t('form:error:required'), accent: 'danger' })
})
