import V2vLaunchGroupVm from '@/modules/v2v/components/review/V2vLaunchGroupVm.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountVm() {
  return mount(V2vLaunchGroupVm, {
    slots: { name: 'web-01', default: '<span class="details">Delta from last sync</span>' },
    global: createGlobalTestConfig(),
  })
}

it('names the VM, then tells its details', () => {
  expect(mountVm().text()).toBe('web-01Delta from last sync')
})
