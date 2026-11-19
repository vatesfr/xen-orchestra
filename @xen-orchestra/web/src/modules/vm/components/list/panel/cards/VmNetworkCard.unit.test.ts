import VmNetworkCard from '@/modules/vm/components/list/panel/cards/VmNetworkCard.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardCopiedValues, findCardLabelledValueLists } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import { mount } from '@vue/test-utils'

function mountNetworkCard(vm: FrontXoVm = createVm()) {
  return mount(VmNetworkCard, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: undefined }))

  expect(wrapper.get('.ui-panel-card-title .title').text()).toBe(t('networks'))
})

it('lists the IP addresses of the VM sorted alphabetically, under a single label', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.2', '0/ipv4/1': '10.0.0.1' } }))

  expect(findCardLabelledValueLists(wrapper)).toEqual({ [t('ip-addresses')]: ['10.0.0.1', '10.0.0.2'] })
})

it('offers to copy each IP address and all of them', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.1', '0/ipv4/1': '10.0.0.2' } }))

  expect(findCardCopiedValues(wrapper)).toEqual(['10.0.0.1', '10.0.0.2'])
  expect(wrapper.getComponent(VtsCopyAllMenuItem).props('values')).toEqual(['10.0.0.1', '10.0.0.2'])
})

it('offers no copy of all the IP addresses for a single one', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.1' } }))

  expect(findCardCopiedValues(wrapper)).toEqual(['10.0.0.1'])
  expect(wrapper.findComponent(VtsCopyAllMenuItem).exists()).toBe(false)
})

it('shows an empty address row when the VM has no IP address', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: undefined }))

  expect(findCardLabelledValueLists(wrapper)).toEqual({ [t('ip-addresses')]: [''] })
  expect(findCardCopiedValues(wrapper)).toEqual([])
})

it('links to the networks page when the VM has at least one IP address', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: { '0/ipv4/0': '10.0.0.1' } }))

  expect(wrapper.get('.ui-panel-card-title').text()).toContain(t('see-details'))
})

it('hides the networks page link when the VM has no IP address', () => {
  const wrapper = mountNetworkCard(createVm({ addresses: undefined }))

  expect(wrapper.get('.ui-panel-card-title').text()).not.toContain(t('see-details'))
})
