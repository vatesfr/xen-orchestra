import VmSystemNetworking from '@/modules/vm/components/system/VmSystemNetworking.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountNetworking(vm: FrontXoVm = createVm()) {
  return mount(VmSystemNetworking, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountNetworking()

  expect(wrapper.get('.ui-title').text()).toBe('Networking')
})

it('shows the NIC type of the VM', () => {
  const wrapper = mountNetworking(createVm({ nicType: 'e1000' }))

  expect(findLabelledValues(wrapper)).toEqual({ 'NIC type': 'e1000' })
})

it('leaves the NIC type empty when the VM has none', () => {
  const wrapper = mountNetworking(createVm({ nicType: undefined }))

  expect(findLabelledValues(wrapper)).toEqual({ 'NIC type': '' })
})
