import VdiVmLinks from '@/modules/vdi/components/VdiVmLinks.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountVmLinks(vms: FrontXoVm[]) {
  return mount(VdiVmLinks, {
    props: { vms },
    global: createGlobalTestConfig(),
  })
}

it('links every VM to its dashboard, in order', () => {
  const wrapper = mountVmLinks([
    createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' }),
    createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database' }),
  ])

  const links = wrapper.findAll('.ui-link').map(link => [link.text(), link.attributes('href')])

  expect(links).toEqual([
    ['Web server', '/vm/vm-1/dashboard'],
    ['Database', '/vm/vm-2/dashboard'],
  ])
})

it('picks the icon matching the power state of each VM', () => {
  const wrapper = mountVmLinks([
    createVm({ id: 'vm-1' as FrontXoVm['id'], power_state: VM_POWER_STATE.RUNNING }),
    createVm({ id: 'vm-2' as FrontXoVm['id'], power_state: VM_POWER_STATE.HALTED }),
  ])

  expect(wrapper.findAllComponents(UiLink).map(link => link.props('icon'))).toEqual([
    objectIcon('vm', 'running'),
    objectIcon('vm', 'halted'),
  ])
})

it('renders no link without any VM', () => {
  expect(mountVmLinks([]).find('.ui-link').exists()).toBe(false)
})
