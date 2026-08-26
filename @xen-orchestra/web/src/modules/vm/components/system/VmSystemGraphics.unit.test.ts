import VmSystemGraphics from '@/modules/vm/components/system/VmSystemGraphics.vue'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountGraphics(vm = createVm()) {
  return mount(VmSystemGraphics, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountGraphics()

  expect(wrapper.text()).toContain('Graphics & Display')
})

it('shows VGA as enabled when the VM uses the "std" adapter', () => {
  const wrapper = mountGraphics(createVm({ vga: 'std' }))

  expect(wrapper.text()).toContain('Enabled')
})

it('shows VGA as disabled for any other adapter', () => {
  const wrapper = mountGraphics(createVm({ vga: 'qxl' }))

  expect(wrapper.text()).toContain('Disabled')
})

it('formats the video RAM with its unit', () => {
  const wrapper = mountGraphics(createVm({ videoram: 8 }))

  expect(wrapper.text()).toContain('8 B')
})

it('omits the video RAM value when the VM has none', () => {
  const wrapper = mountGraphics(createVm({ videoram: 0 }))

  expect(wrapper.text()).not.toMatch(/\d+\s*(B|KiB|MiB)/)
})
