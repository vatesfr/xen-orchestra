import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import VdiImportExportMenu from '@/modules/vdi/components/actions/import-export/VdiImportExportMenu.vue'
import VdiMigrateButton from '@/modules/vdi/components/actions/migrate/VdiMigrateButton.vue'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

// Each action button is covered by its own test: this one only asserts which buttons are offered
function mountActions(props: { vm?: FrontXoVm; vbd?: FrontXoVbd } = {}) {
  return mount(VdiActions, {
    props: { vdi: createVdi(), ...props },
    global: {
      ...createGlobalTestConfig(),
      stubs: { VdiMigrateButton: true, VdiImportExportMenu: true, VbdDeleteButton: true, VdiDeleteButton: true },
    },
  })
}

it.each([
  { context: 'a VM and its VBD', props: { vm: createVm(), vbd: createVbd() } },
  { context: 'no VM', props: {} },
])('always offers to migrate, import/export and delete the VDI with $context', ({ props }) => {
  const wrapper = mountActions(props)

  expect(wrapper.findComponent(VdiMigrateButton).exists()).toBe(true)
  expect(wrapper.findComponent(VdiImportExportMenu).exists()).toBe(true)
  expect(wrapper.findComponent(VdiDeleteButton).exists()).toBe(true)
})

it.each([
  { context: 'a VM and its VBD', props: { vm: createVm(), vbd: createVbd() }, offered: true },
  { context: 'a VBD but no VM', props: { vbd: createVbd() }, offered: false },
  { context: 'a VM but no VBD for it', props: { vm: createVm() }, offered: false },
  { context: 'neither a VM nor a VBD', props: {}, offered: false },
])('offers to detach the VDI only when given both a VM and its VBD — $context', ({ props, offered }) => {
  expect(mountActions(props).findComponent(VbdDeleteButton).exists()).toBe(offered)
})
