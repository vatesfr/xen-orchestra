import VmLinkList from '@/modules/vm/components/VmLinkList.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

function mountLinkList(vms: FrontXoVm[]) {
  return mount(VmLinkList, {
    props: { vms },
    global: createGlobalTestConfig(),
  })
}

const vms = [
  createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server', power_state: VM_POWER_STATE.RUNNING }),
  createVm({ id: 'vm-2' as FrontXoVm['id'], name_label: 'Database', power_state: VM_POWER_STATE.HALTED }),
]

it('lists the name of every VM, in order', () => {
  const wrapper = mountLinkList(vms)

  expect(wrapper.findAll('.ui-link').map(link => link.text())).toEqual(['Web server', 'Database'])
})

it('links every VM to its dashboard', () => {
  const wrapper = mountLinkList(vms)

  expect(wrapper.findAll('.ui-link').map(link => link.attributes('href'))).toEqual([
    '/vm/vm-1/dashboard',
    '/vm/vm-2/dashboard',
  ])
})

it('shows the icon matching the power state of every VM', () => {
  const wrapper = mountLinkList(vms)

  expect(wrapper.findAllComponents(UiLink).map(link => link.props('icon'))).toEqual([
    objectIcon('vm', 'running'),
    objectIcon('vm', 'halted'),
  ])
})

it('renders no link when there is no VM', () => {
  expect(mountLinkList([]).findAll('.ui-link')).toHaveLength(0)
})
