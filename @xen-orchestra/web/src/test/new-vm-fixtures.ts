import { type NewVmForm, provideNewVmForm } from '@/modules/vm/form/new/use-new-vm-form.ts'
import type { VmState } from '@/modules/vm/types/new-xo-vm.type.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVif } from '@/test/create-vif.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import type { MountComposableOptions } from '@/test/mount-composable.ts'
import { mount } from '@vue/test-utils'
import { type Component, defineComponent, h, nextTick, type ShallowUnwrapRef } from 'vue'

const GIB = 1024 ** 3

export const NEW_VM_POOL = createPool()

export const NEW_VM_HOST = createHost({ $pool: NEW_VM_POOL.id, name_label: 'Host of the pool' })

export const NEW_VM_SR = createSr({ name_label: 'Pool SR' })

export const NEW_VM_OTHER_SR = createSr({ id: 'sr-other' as typeof NEW_VM_SR.id, name_label: 'Other SR' })

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

// A template with a disk and a network interface of its own, on UEFI
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

// A template without disk, to install from an ISO or the network, on BIOS
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

// The pool of the new VM and what it offers, in the mocked collections
export function seedNewVmCollections() {
  xoCollectionsMock.pools.value = [NEW_VM_POOL, createPool({ id: OTHER_POOL_ID, name_label: 'Other pool' })]
  xoCollectionsMock.hosts.value = [NEW_VM_HOST]
  xoCollectionsMock.srs.value = [NEW_VM_SR, NEW_VM_OTHER_SR]
  xoCollectionsMock.networks.value = [NEW_VM_NETWORK, NEW_VM_AUTOMATIC_NETWORK]
  xoCollectionsMock.templates.value = [NEW_VM_DISK_TEMPLATE, NEW_VM_DISKLESS_TEMPLATE, NEW_VM_OTHER_POOL_TEMPLATE]
  xoCollectionsMock.vdiIsosBySrName.value = { [NEW_VM_ISO_SR_NAME]: [NEW_VM_ISO] }
  vmDeviceCollectionsMock.vbds.value = [NEW_VM_TEMPLATE_VBD]
  vmDeviceCollectionsMock.vdis.value = [NEW_VM_TEMPLATE_VDI]
  vmDeviceCollectionsMock.vifs.value = [NEW_VM_TEMPLATE_VIF]
}

export function resetNewVmCollections() {
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()
}

// As a user does on the first step: the pool, then one of its templates
export async function chooseNewVmTemplate(form: Pick<NewVmForm, 'vmState'>, template = NEW_VM_DISK_TEMPLATE) {
  form.vmState.pool = NEW_VM_POOL
  await nextTick()
  form.vmState.new_vm_template = template
  await nextTick()
}

/**
 * Mounts a component under the form the new VM page provides, and hands that form back to drive it.
 */
export function mountUnderNewVmForm(child: Component, options: MountComposableOptions = {}) {
  let form: NewVmForm | undefined

  const wrapper = mount(
    defineComponent({
      setup() {
        form = provideNewVmForm()

        return () => h(child)
      },
    }),
    { global: createGlobalTestConfig(options) }
  )

  if (form === undefined) {
    throw new Error('The new VM form was not provided')
  }

  return { wrapper, form }
}

/**
 * Runs a composable reading the new VM form its page provides: `vm` is its result, refs unwrapped.
 */
export function mountComposableUnderNewVmForm<TResult extends Record<string, unknown>>(
  composable: () => TResult,
  options: MountComposableOptions = {}
) {
  const Child = defineComponent({ setup: () => composable(), render: () => null })

  const { wrapper, form } = mountUnderNewVmForm(Child, options)

  // `defineComponent` cannot infer the bindings of a generic setup
  return { form, vm: wrapper.findComponent(Child).vm as unknown as ShallowUnwrapRef<TResult> }
}

// The state of a form whose two first steps are filled in and valid
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
