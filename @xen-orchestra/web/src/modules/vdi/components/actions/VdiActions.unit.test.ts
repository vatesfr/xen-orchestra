import VbdDeleteButton from '@/modules/vbd/components/actions/delete/VbdDeleteButton.vue'
import VdiActions from '@/modules/vdi/components/actions/VdiActions.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

// Each action button is covered by its own test: this one only asserts which buttons are offered
function mountActions(vm?: FrontXoVm) {
  return mount(VdiActions, {
    props: { vdi: createVdi(), vbd: createVbd(), vm },
    global: {
      ...createGlobalTestConfig(),
      stubs: { VdiMigrateButton: true, VdiImportExportMenu: true, VbdDeleteButton: true, VdiDeleteButton: true },
    },
  })
}

it('offers to detach the VDI from the VM it is shown for', () => {
  expect(mountActions(createVm()).findComponent(VbdDeleteButton).exists()).toBe(true)
})

it('does not offer to detach the VDI when no VM is given', () => {
  expect(mountActions().findComponent(VbdDeleteButton).exists()).toBe(false)
})
