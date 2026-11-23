import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import NewVmNetworkTable from '@/modules/vm/components/new/NewVmNetworkTable.vue'
import NewVmSrTable from '@/modules/vm/components/new/NewVmSrTable.vue'
import NewVmConfigurationStep from '@/modules/vm/components/new/steps/NewVmConfigurationStep.vue'
import type { Vif } from '@/modules/vm/types/new-xo-vm.type.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPif } from '@/test/create-pif.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { findTableColumn } from '@/test/find-table-cells.ts'
import { findTitles } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  chooseNewVmTemplate,
  mockNewVmCollections,
  mountUnderNewVmForm,
  NEW_VM_DISKLESS_TEMPLATE,
  NEW_VM_HOST,
  NEW_VM_NETWORK,
  NEW_VM_OTHER_SR,
  NEW_VM_POOL,
  NEW_VM_SR,
  resetNewVmCollections,
  seedNewVmCollections,
} from '@/test/new-vm-fixtures.ts'
import { findSelectOptionLabels, findShownSelections, openSelect } from '@/test/select.ts'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { objectIcon } from '@core/icons'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { findAccentedInfos } from '@core-test/find-accented-labels.ts'
import { nextTick } from 'vue'

mockNewVmCollections()

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

function clickFirstTrash(table: Pick<Table, 'get'>) {
  return table.get('tbody tr td:last-child button').trigger('click')
}

function isSizeInput(input: { props(name: 'type'): unknown }) {
  return input.props('type') === 'number'
}

const ROW_MARKS = ['error', 'warning'] as const

function findRowMarks(table: Pick<Table, 'findAllComponents'>) {
  return table
    .findAllComponents(VtsRow)
    .filter(row => row.text() !== t('new'))
    .map(row => ROW_MARKS.filter(mark => row.props(mark)).join(' ') || undefined)
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

it('offers a network interface the networks of the pool with their status', async () => {
  const { wrapper } = await mountStep()
  const pif = createPif({ id: 'pif-connected' as FrontXoPif['id'] })
  xoCollectionsMock.pifs.value = [pif]
  xoCollectionsMock.networks.value = [
    createNetwork({ id: 'network-connected' as typeof NEW_VM_NETWORK.id, name_label: 'Connected', PIFs: [pif.id] }),
    createNetwork({ id: 'network-without-pif' as typeof NEW_VM_NETWORK.id, name_label: 'Without PIF' }),
  ]
  const table = wrapper.getComponent(NewVmNetworkTable)

  await openSelect(table)

  expect(findSelectOptionLabels(table)).toEqual(['Connected', 'Without PIF'])
  expect(table.findAllComponents(VtsDetailedOption).map(option => option.props('icon'))).toEqual([
    objectIcon('network', CONNECTION_STATUS.CONNECTED),
    objectIcon('network', CONNECTION_STATUS.DISCONNECTED),
  ])
})

it('shows the free space of the SR chosen for a disk before where the SR is', async () => {
  const { wrapper } = await mountStep()

  expect(findShownSelections(wrapper.getComponent(NewVmSrTable))).toEqual([
    `Pool SR - ${t('n-gb-left', { n: 9 })} (Host of the pool)`,
  ])
})

it('offers a disk the SRs of the pool with where they are, their free space and their status', async () => {
  const { wrapper } = await mountStep()
  xoCollectionsMock.pbds.value = [
    createPbd({ id: NEW_VM_SR.$PBDs[0], SR: NEW_VM_SR.id, host: NEW_VM_HOST.id }),
    createPbd({ id: NEW_VM_OTHER_SR.$PBDs[0], SR: NEW_VM_OTHER_SR.id, host: NEW_VM_HOST.id, attached: false }),
  ]
  const table = wrapper.getComponent(NewVmSrTable)

  await openSelect(table)

  expect(findSelectOptionLabels(table)).toEqual([
    `Pool SR - ${t('n-gb-left', { n: 9 })} (Host of the pool)`,
    `Other SR - ${t('n-gb-left', { n: 9 })} (Host of the pool)`,
  ])
  expect(table.findAllComponents(VtsDetailedOption).map(option => option.props('icon'))).toEqual([
    objectIcon('sr', CONNECTION_STATUS.CONNECTED),
    objectIcon('sr', CONNECTION_STATUS.DISCONNECTED),
  ])
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

it('marks a template disk made smaller than in the template as in error, at once', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmSrTable)

  form.vmState.existingVdis[0].size = 5
  await nextTick()

  expect(findRowMarks(table)).toEqual(['error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vdi-issue', { n: 1, issue: t('new-vm:size-below-template', { size: 10 }) }), accent: 'danger' },
  ])
})

it('leaves a new disk alone until the step is validated', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmSrTable)

  form.addVdi()
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, undefined])
  expect(findAccentedInfos(table)).toEqual([])
})

it('marks a new disk below 1 GB as in error once the step is validated, its size focused first', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.addVdi()
  form.vmState.vdis[0].size = 5
  await nextTick()
  const table = wrapper.getComponent(NewVmSrTable)
  const sizeInputs = table.findAllComponents(UiInput).filter(isSizeInput)

  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, undefined, 'error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vdi-issue', { n: 3, issue: t('new-vm:size-minimum', { min: 1 }) }), accent: 'danger' },
  ])
  expect(wrapper.find(`[id="${form.fieldIds.vdis}"]`).element).toBe(sizeInputs[2].get('input').element)
})

it('marks a new disk without SR as in error once the step is validated, its row focused first', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.vmState.vdis[0].sr = undefined
  form.vmState.vdis[0].size = 5
  const table = wrapper.getComponent(NewVmSrTable)

  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, 'error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vdi-issue', { n: 2, issue: t('new-vm:sr-mandatory') }), accent: 'danger' },
  ])
  expect(wrapper.find(`[id="${form.fieldIds.vdis}"]`).element).toBe(table.findAll('tbody tr')[1].element)
})

it('tells each error of a disk with several, under its number', async () => {
  const { wrapper, form } = await mountStep()
  form.addVdi()
  form.vmState.vdis[0].sr = undefined

  await form.validateStep('configuration')
  await nextTick()

  expect(findAccentedInfos(wrapper.getComponent(NewVmSrTable))).toEqual([
    { label: t('new-vm:vdi-issue', { n: 2, issue: t('new-vm:sr-mandatory') }), accent: 'danger' },
    { label: t('new-vm:vdi-issue', { n: 2, issue: t('new-vm:size-minimum', { min: 1 }) }), accent: 'danger' },
  ])
})

it('lists the errors of the disks in their row order, the size of a template disk too small focused first', async () => {
  const { wrapper, form } = await mountStep()
  form.vmState.installMode = 'ssh-key'
  form.addVdi()
  form.vmState.vdis[0].sr = undefined
  form.vmState.vdis[0].size = 5
  form.vmState.existingVdis[0].size = 5
  await nextTick()
  const table = wrapper.getComponent(NewVmSrTable)
  const sizeInputs = table.findAllComponents(UiInput).filter(isSizeInput)

  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual(['error', 'error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vdi-issue', { n: 1, issue: t('new-vm:size-below-template', { size: 10 }) }), accent: 'danger' },
    { label: t('new-vm:vdi-issue', { n: 2, issue: t('new-vm:sr-mandatory') }), accent: 'danger' },
  ])
  expect(wrapper.find(`[id="${form.fieldIds.vdis}"]`).element).toBe(sizeInputs[0].get('input').element)
})

it('clears the error of a new disk as soon as a size of 1 GB or more is typed', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmSrTable)
  form.addVdi()
  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, 'error'])

  await table.findAll('tbody input[type="number"]').at(-1)?.setValue('2')

  expect(findRowMarks(table)).toEqual([undefined, undefined])
  expect(findAccentedInfos(table)).toEqual([])
})

it('marks a network interface with an invalid MAC address as in error once the step is validated, its MAC address focused first', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  form.vmState.vifs[0].mac = 'not-a-mac'
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined])

  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual(['error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vif-issue', { n: 1, issue: t('new-vm:mac-address-invalid') }), accent: 'danger' },
  ])
  expect(wrapper.find(`[id="${form.fieldIds.vifs}"]`).element).toBe(table.get('tbody input:not([readonly])').element)
})

it('tells each error of a network interface without network, under its number, its row focused first', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  form.vmState.vifs[0].network = '' as Vif['network']
  form.vmState.vifs[0].mac = 'not-a-mac'

  await form.validateStep('configuration')
  await nextTick()

  expect(wrapper.find(`[id="${form.fieldIds.vifs}"]`).element).toBe(table.findAll('tbody tr')[0].element)
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vif-issue', { n: 1, issue: t('new-vm:network-mandatory') }), accent: 'danger' },
    { label: t('new-vm:vif-issue', { n: 1, issue: t('new-vm:mac-address-invalid') }), accent: 'danger' },
  ])
})

it('checks a network interface added after the step was validated', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  await form.validateStep('configuration')

  form.addVif()
  form.vmState.vifs[1].mac = 'not-a-mac'
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, 'error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vif-issue', { n: 2, issue: t('new-vm:mac-address-invalid') }), accent: 'danger' },
  ])
})

it('clears the error of a network interface as soon as its MAC address is fixed', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  form.vmState.vifs[0].mac = 'not-a-mac'
  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual(['error'])

  await table.get('tbody input:not([readonly])').setValue('00:16:3e:12:34:56')

  expect(findRowMarks(table)).toEqual([undefined])
  expect(findAccentedInfos(table)).toEqual([])
  expect(wrapper.find(`[id="${form.fieldIds.vifs}"]`).exists()).toBe(false)
})

it('moves the focus to the next network interface in error once the first is fixed', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  form.addVif()
  form.vmState.vifs[0].mac = 'not-a-mac'
  form.vmState.vifs[1].mac = 'not-a-mac'
  await form.validateStep('configuration')

  form.vmState.vifs[0].mac = ''
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, 'error'])
  expect(wrapper.find(`[id="${form.fieldIds.vifs}"]`).element).toBe(
    table.findAll('tbody input:not([readonly])')[1].element
  )
})

it('numbers a network interface in error by its new row once one above is removed', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  form.addVif()
  form.addVif()
  form.vmState.vifs[2].mac = 'not-a-mac'
  await form.validateStep('configuration')

  form.removeVif(form.vmState.vifs[0].key)
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined, 'error'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vif-issue', { n: 2, issue: t('new-vm:mac-address-invalid') }), accent: 'danger' },
  ])
})

it('checks the network interfaces no more once another template is chosen', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  await form.validateStep('configuration')

  await chooseNewVmTemplate(form, NEW_VM_DISKLESS_TEMPLATE)
  form.vmState.vifs[0].mac = 'not-a-mac'
  await nextTick()

  expect(findRowMarks(table)).toEqual([undefined])
  expect(findAccentedInfos(table)).toEqual([])
})

it('warns about the disks past the 8th', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmSrTable)

  Array.from({ length: 8 }).forEach(() => form.addVdi())
  await nextTick()

  expect(findRowMarks(table)).toEqual([...Array(8).fill(undefined), 'warning'])
  expect(findAccentedInfos(table)).toEqual([{ label: t('new-vm:too-many-vdis', { n: 8 }), accent: 'warning' }])
})

it('warns about the network interfaces past the 8th', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)

  Array.from({ length: 8 }).forEach(() => form.addVif())
  await nextTick()

  expect(findRowMarks(table)).toEqual([...Array(8).fill(undefined), 'warning'])
  expect(findAccentedInfos(table)).toEqual([{ label: t('new-vm:too-many-vifs', { n: 8 }), accent: 'warning' }])
})

it('tells the warning about the network interfaces past the 8th after their errors', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  Array.from({ length: 8 }).forEach(() => form.addVif())
  form.vmState.vifs[0].mac = 'not-a-mac'

  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual(['error', ...Array(7).fill(undefined), 'warning'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vif-issue', { n: 1, issue: t('new-vm:mac-address-invalid') }), accent: 'danger' },
    { label: t('new-vm:too-many-vifs', { n: 8 }), accent: 'warning' },
  ])
})

it('tells the warning about the disks past the 8th after their errors', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmSrTable)
  Array.from({ length: 8 }).forEach(() => form.addVdi())

  form.vmState.existingVdis[0].size = 5
  await nextTick()

  expect(findRowMarks(table)).toEqual(['error', ...Array(7).fill(undefined), 'warning'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vdi-issue', { n: 1, issue: t('new-vm:size-below-template', { size: 10 }) }), accent: 'danger' },
    { label: t('new-vm:too-many-vdis', { n: 8 }), accent: 'warning' },
  ])
})

it('marks a network interface past the 8th both in error and warned about', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmNetworkTable)
  Array.from({ length: 8 }).forEach(() => form.addVif())
  form.vmState.vifs[8].mac = 'not-a-mac'

  await form.validateStep('configuration')
  await nextTick()

  expect(findRowMarks(table)).toEqual([...Array(8).fill(undefined), 'error warning'])
  expect(findAccentedInfos(table)).toEqual([
    { label: t('new-vm:vif-issue', { n: 9, issue: t('new-vm:mac-address-invalid') }), accent: 'danger' },
    { label: t('new-vm:too-many-vifs', { n: 8 }), accent: 'warning' },
  ])
})

it('stops warning about the disks once one is removed back to 8', async () => {
  const { wrapper, form } = await mountStep()
  const table = wrapper.getComponent(NewVmSrTable)
  Array.from({ length: 8 }).forEach(() => form.addVdi())
  await nextTick()

  form.removeVdi(form.vmState.vdis[0].key)
  await nextTick()

  expect(findRowMarks(table)).toEqual(Array(8).fill(undefined))
  expect(findAccentedInfos(table)).toEqual([])
})

it('tells that the name is required once the step is validated', async () => {
  const { wrapper, form } = await mountStep()
  form.vmState.name = ''

  await form.validateStep('configuration')
  await nextTick()

  expect(findAccentedInfos(wrapper)).toContainEqual({ label: t('form:error:required'), accent: 'danger' })
})
