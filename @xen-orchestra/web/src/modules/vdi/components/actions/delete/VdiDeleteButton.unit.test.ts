import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import VdiDeleteButton from '@/modules/vdi/components/actions/delete/VdiDeleteButton.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import { mount } from '@vue/test-utils'

mockXoVmDeviceCollections('vbd')

beforeEach(() => {
  vmDeviceCollectionsMock.reset()
})

// The button of a VDI plugged through `vbd`, shown for `vm`
function mountDeleteButton(vm: FrontXoVm | undefined, vbd: FrontXoVbd) {
  vmDeviceCollectionsMock.vbds.value = [vbd]

  return mount(VdiDeleteButton, {
    props: { vdi: createVdi({ $VBDs: [vbd.id] }), vm },
    global: createGlobalTestConfig(),
  }).getComponent(VtsDeleteButton)
}

it.each([
  { context: 'shown for a VM', vm: createVm() },
  { context: 'shown without a VM', vm: undefined },
])('is enabled, with no hint, while no VM has the VDI attached — $context', ({ vm }) => {
  const button = mountDeleteButton(vm, createVbd({ attached: false }))

  expect(button.props('disabled')).toBe(false)
  expect(button.props('hint')).toBeUndefined()
})

it('is disabled and says the VM is running while the VDI is attached to it', () => {
  const button = mountDeleteButton(
    createVm({ id: 'vm-123' as FrontXoVm['id'] }),
    createVbd({ VM: 'vm-123' as FrontXoVbd['VM'], attached: true })
  )

  expect(button.props('disabled')).toBe(true)
  expect(button.props('hint')).toBe(t('vm-running'))
})

it.each([
  { context: 'shown for another VM', vm: createVm({ id: 'vm-123' as FrontXoVm['id'] }) },
  { context: 'shown without a VM', vm: undefined },
])('is disabled and says the VDI is in use while another VM has it attached — $context', ({ vm }) => {
  const button = mountDeleteButton(vm, createVbd({ VM: 'vm-other' as FrontXoVbd['VM'], attached: true }))

  expect(button.props('disabled')).toBe(true)
  expect(button.props('hint')).toBe(t('vdi-in-use'))
})
