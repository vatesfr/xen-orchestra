import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { mount } from '@vue/test-utils'

function mountNetworkCard(vm: FrontXoVm = createVm()) {
  return mount(VmNetworkCard, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

function findIpAddresses(wrapper: ReturnType<typeof mountNetworkCard>) {
  return wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.value').text())
}

it('renders the card title', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: undefined }))

  expect(wrapper.get('.ui-card-title .title').text()).toBe('Networks')
})

it('lists the IP addresses of the VM sorted alphabetically', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.2', '0/ipv4/1': '10.0.0.1' } }))

  expect(findIpAddresses(wrapper)).toEqual(['10.0.0.1', '10.0.0.2'])
})

it('labels only the first address row', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.1', '0/ipv4/1': '10.0.0.2' } }))

  expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())).toEqual(['IP addresses', ''])
})

it('shows an empty address row when the VM has no IP address', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: undefined }))

  expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())).toEqual(['IP addresses'])
  expect(findIpAddresses(wrapper)).toEqual([''])
})

it('links to the networks page when the VM has at least one IP address', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.1' } }))

  expect(wrapper.get('.ui-card-title').text()).toContain('See details')
})

it('hides the networks page link when the VM has no IP address', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: undefined }))

  expect(wrapper.get('.ui-card-title').text()).not.toContain('See details')
})
