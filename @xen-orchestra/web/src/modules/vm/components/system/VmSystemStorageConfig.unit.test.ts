import VmSystemStorageConfig from '@/modules/vm/components/system/VmSystemStorageConfig.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountStorageConfig(vm: FrontXoVm = createVm()) {
  return mount(VmSystemStorageConfig, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountStorageConfig()

  expect(wrapper.get('.ui-title').text()).toBe('Storage configuration')
})

it('shows the suspend storage repository of the VM', () => {
  const wrapper = mountStorageConfig(createVm({ suspendSr: 'sr-1' as FrontXoVm['suspendSr'] }))

  expect(findLabelledValues(wrapper)).toEqual({ 'Suspend storage repository': 'sr-1' })
})

it('falls back to "None" when the VM has no suspend storage repository', () => {
  const wrapper = mountStorageConfig(createVm({ suspendSr: undefined }))

  expect(findLabelledValues(wrapper)).toEqual({ 'Suspend storage repository': 'None' })
})
