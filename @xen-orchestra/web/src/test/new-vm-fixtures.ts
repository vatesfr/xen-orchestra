import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import { type NewVmForm, provideNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import { useXoVmCreateJob } from '@/modules/vm/jobs/xo-vm-create.job.ts'
import type { VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { createHost } from '@/test/create-host.ts'
import { createJobStub, type JobResultState } from '@/test/create-job-result.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVif } from '@/test/create-vif.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { discardChangesModalMock, mockDiscardChangesModal } from '@/test/mock-discard-changes-modal.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import type { MountComposableOptions } from '@/test/mount-composable.ts'
import { mountComposableUnderSetup, mountWithSetupResult } from '@/test/mount-with-setup.ts'
import { type Component, h, nextTick, proxyRefs } from 'vue'

const GIB = 1024 ** 3

export const NEW_VM_POOL = createPool()

export const NEW_VM_HOST = createHost({ $pool: NEW_VM_POOL.id, name_label: 'Host of the pool' })

export const NEW_VM_SR = createSr({ name_label: 'Pool SR', $PBDs: ['pbd-sr-123' as FrontXoPbd['id']] })

export const NEW_VM_OTHER_SR = createSr({
  id: 'sr-other' as typeof NEW_VM_SR.id,
  name_label: 'Other SR',
  $PBDs: ['pbd-sr-other' as FrontXoPbd['id']],
})

export const NEW_VM_NETWORK = createNetwork({ name_label: 'Template network' })

export const NEW_VM_AUTOMATIC_NETWORK = createNetwork({
  id: 'network-automatic' as typeof NEW_VM_NETWORK.id,
  name_label: 'Automatic network',
  other_config: { automatic: 'true' },
})

export const NEW_VM_TEMPLATE_VDI = createVdi({
  name_label: 'Template disk',
  name_description: 'Disk of the template',
  size: 10 * GIB,
  $SR: NEW_VM_SR.id,
})

export const NEW_VM_TEMPLATE_VBD = createVbd({ VDI: NEW_VM_TEMPLATE_VDI.id, position: '0' })

export const NEW_VM_TEMPLATE_VIF = createVif({ $network: NEW_VM_NETWORK.id, device: '0' })

export const NEW_VM_ISO = createVdi({ id: 'vdi-iso' as typeof NEW_VM_TEMPLATE_VDI.id, name_label: 'debian-12.iso' })

export const NEW_VM_ISO_SR_NAME = 'ISO library'

export const NEW_VM_DISK_TEMPLATE = createVmTemplate({
  id: 'template-disk' as ReturnType<typeof createVmTemplate>['id'],
  uuid: 'template-disk',
  name_label: 'Debian 12',
  name_description: 'Debian template',
  isDefaultTemplate: false,
  $VBDs: [NEW_VM_TEMPLATE_VBD.id],
  VIFs: [NEW_VM_TEMPLATE_VIF.id],
  boot: { firmware: 'uefi' },
  CPUs: { max: 4, number: 2 },
  memory: { dynamic: [2 * GIB, 4 * GIB], size: 4 * GIB, static: [GIB, 4 * GIB] },
})

export const NEW_VM_DISKLESS_TEMPLATE = createVmTemplate({
  id: 'template-diskless' as ReturnType<typeof createVmTemplate>['id'],
  uuid: 'template-diskless',
  memory: { dynamic: [GIB, GIB], size: GIB, static: [GIB, GIB] },
})

export const NEW_VM_OTHER_POOL_TEMPLATE = createVmTemplate({
  id: 'template-other-pool' as ReturnType<typeof createVmTemplate>['id'],
  uuid: 'template-other-pool',
  $pool: OTHER_POOL_ID,
})

// Replaces the collections a new VM is built from in every test of the file: call it at the top level of the test file
export function mockNewVmCollections() {
  mockXoCollections('pool', 'host', 'sr', 'network', 'pif', 'pbd', 'vmTemplate')
  mockXoVmDeviceCollections('vbd', 'vdi', 'vdiSnapshot', 'vif')
}

export function resetNewVmCollections() {
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
}

export function seedNewVmCollections() {
  xoCollectionsMock.pools.value = [NEW_VM_POOL, createPool({ id: OTHER_POOL_ID, name_label: 'Other pool' })]
  xoCollectionsMock.hosts.value = [NEW_VM_HOST]
  xoCollectionsMock.srs.value = [NEW_VM_SR, NEW_VM_OTHER_SR]
  xoCollectionsMock.pbds.value = [NEW_VM_SR, NEW_VM_OTHER_SR].map(sr =>
    createPbd({ id: sr.$PBDs[0], SR: sr.id, host: NEW_VM_HOST.id })
  )
  xoCollectionsMock.networks.value = [NEW_VM_NETWORK, NEW_VM_AUTOMATIC_NETWORK]
  xoCollectionsMock.templates.value = [NEW_VM_DISK_TEMPLATE, NEW_VM_DISKLESS_TEMPLATE, NEW_VM_OTHER_POOL_TEMPLATE]
  xoCollectionsMock.vdiIsosBySrName.value = { [NEW_VM_ISO_SR_NAME]: [NEW_VM_ISO] }
  vmDeviceCollectionsMock.vbds.value = [NEW_VM_TEMPLATE_VBD]
  vmDeviceCollectionsMock.vdis.value = [NEW_VM_TEMPLATE_VDI]
  vmDeviceCollectionsMock.vifs.value = [NEW_VM_TEMPLATE_VIF]
}

/**
 * Mocks what the new VM wizard runs on, in every test of the file: the collections a new VM is built from, the discard
 * changes modal and the VM creation job, all reset before each test. Call it at the top level of the test file.
 * Returns `seedNewVmWizard(run, state?)`: seeds the collections, then sets the creation job, running `run`, in `state`.
 */
export function mockNewVmWizard() {
  const createJob = createJobStub(useXoVmCreateJob)

  mockDiscardChangesModal()
  mockNewVmCollections()

  beforeEach(() => {
    resetNewVmCollections()
    createJob.reset()
    discardChangesModalMock.reset()
  })

  return function seedNewVmWizard(run: () => Promise<unknown>, state?: JobResultState) {
    seedNewVmCollections()
    createJob.run.mockImplementation(run)
    createJob.setState(state)
  }
}

export async function chooseNewVmTemplate(form: Pick<NewVmForm, 'vmState'>, template = NEW_VM_DISK_TEMPLATE) {
  form.vmState.pool = NEW_VM_POOL
  await nextTick()
  form.vmState.new_vm_template = template
  await nextTick()
}

export function mountUnderNewVmForm(child: Component, options: MountComposableOptions = {}) {
  const { wrapper, result: form } = mountWithSetupResult(
    () => ({ result: provideNewVmForm(), render: () => h(child) }),
    options
  )

  return { wrapper, form }
}

export function mountComposableUnderNewVmForm<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  options: MountComposableOptions = {}
) {
  const { provided: form, result } = mountComposableUnderSetup(provideNewVmForm, composable, options)

  // Unwrapped, as a component exposes it
  return { form, vm: proxyRefs(result) }
}

export function createNewVmState(overrides: Partial<VmState> = {}): VmState {
  return {
    name: 'New VM',
    description: '',
    installMode: 'no-config',
    affinity_host: undefined,
    highAvailability: '',
    bootFirmware: 'uefi',
    new_vm_template: NEW_VM_DISK_TEMPLATE,
    boot_vm: true,
    autoPoweron: false,
    clone: true,
    ssh_key: '',
    selectedVdi: undefined,
    networkConfig: '',
    cloudConfig: '',
    tags: [],
    vCPU: 2,
    selectedVcpu: 0,
    secureBoot: false,
    ram: 4 * GIB,
    topology: '',
    copyHostBiosStrings: false,
    sshKeys: [],
    isDiskTemplateSelected: true,
    vdis: [],
    vifs: [],
    existingVdis: [],
    pool: NEW_VM_POOL,
    createVtpm: false,
    ...overrides,
  }
}
