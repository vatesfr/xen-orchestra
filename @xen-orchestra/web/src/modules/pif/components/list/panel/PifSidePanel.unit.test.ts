import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PifSidePanel from '@/modules/pif/components/list/panel/PifSidePanel.vue'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { findIconPaths, findNamedIconPaths } from '@/test/find-icon-paths.ts'
import {
  findCardLabelledList,
  findCardLabels,
  findCardLabelledValues,
  findCardValue,
} from '@/test/find-labelled-values.ts'
import { findTagLabels } from '@/test/find-tags.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetNetworkById, getBondsDevices, getHostById, useGetTaskById } = vi.hoisted(() => ({
  useGetNetworkById: vi.fn(),
  getBondsDevices: vi.fn(),
  getHostById: vi.fn(),
  useGetTaskById: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: (() => ({ useGetNetworkById })) as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: (() => ({ getBondsDevices })) as unknown as typeof useXoPifCollection,
}))

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById })) as unknown as typeof useXoTaskCollection,
}))

beforeEach(() => {
  useGetNetworkById.mockReset()
  getBondsDevices.mockReset()
  getHostById.mockReset()
  useGetTaskById.mockReset()
  useGetNetworkById.mockReturnValue(computed(() => undefined))
  getBondsDevices.mockReturnValue([])
})

function mountSidePanel(pif?: FrontXoPif, network?: FrontXoNetwork) {
  useGetNetworkById.mockReturnValue(computed(() => network))

  return mount(PifSidePanel, {
    props: { pif },
    global: createGlobalTestConfig(),
  })
}

it('offers nothing to read when no PIF is selected', () => {
  const wrapper = mountSidePanel()

  expect(findCardLabels(wrapper)).toEqual([])
})

it('presents the object as a PIF', () => {
  const wrapper = mountSidePanel(createPif({ isBondMaster: false }))

  expect(wrapper.get('.vts-card-object-title').text()).toContain(t('pif'))
  expect(findCardLabelledValues(wrapper)).toHaveProperty(t('pif-status'))
})

it('presents the object as a bond when the PIF leads one', () => {
  const wrapper = mountSidePanel(createPif({ isBondMaster: true }))

  expect(wrapper.get('.vts-card-object-title').text()).toContain(t('bond'))
  expect(findCardLabelledValues(wrapper)).toHaveProperty(t('bond-status'))
})

it('names the network the PIF belongs to and links to it', () => {
  const wrapper = mountSidePanel(createPif(), createNetwork({ name_label: 'Management network' }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('network')]: 'Management network' })
})

it('leaves the network row empty when the network is unknown', () => {
  const wrapper = mountSidePanel(createPif())

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('network')]: '' })
})

it('shows the PIF as connected when it is attached', () => {
  const wrapper = mountSidePanel(createPif({ attached: true }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('pif-status')]: t('connected') })
})

it('shows the PIF as disconnected when it is detached', () => {
  const wrapper = mountSidePanel(createPif({ attached: false }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('pif-status')]: t('disconnected') })
})

it('shows the physical interface as connected when the PIF has a carrier', () => {
  const wrapper = mountSidePanel(createPif({ carrier: true }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('physical-interface-status')]: t('connected') })
})

it('shows the physical interface as disconnected when the PIF has no carrier', () => {
  const wrapper = mountSidePanel(createPif({ carrier: false }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('physical-interface-status')]: t('disconnected-from-physical-device'),
  })
})

it('reports no VLAN when the PIF carries none', () => {
  const wrapper = mountSidePanel(createPif({ vlan: -1 }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('vlan')]: t('none') })
})

it('reports the VLAN the PIF carries', () => {
  const wrapper = mountSidePanel(createPif({ vlan: 42 }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('vlan')]: '42' })
})

it('marks the PIF when it carries the management interface', () => {
  const wrapper = mountSidePanel(createPif({ management: true }))

  expect(findIconPaths(findCardValue(wrapper, t('device')))).toEqual(findNamedIconPaths('status:primary-circle'))
})

it('leaves the PIF unmarked when it does not carry the management interface', () => {
  const wrapper = mountSidePanel(createPif({ management: false }))

  expect(findIconPaths(findCardValue(wrapper, t('device')))).toEqual([])
})

it('lists no tag when the network carries none', () => {
  const wrapper = mountSidePanel(createPif(), createNetwork({ tags: [] }))

  expect(findTagLabels(wrapper)).toEqual([])
})

it('lists the tags of the network', () => {
  const wrapper = mountSidePanel(createPif(), createNetwork({ tags: ['production', 'vlan-42'] }))

  expect(findTagLabels(wrapper)).toEqual(['production', 'vlan-42'])
})

it('lists the IPv4 address of the PIF before its IPv6 ones', () => {
  const wrapper = mountSidePanel(createPif({ ip: '10.0.0.1', ipv6: ['2001:db8::1', '2001:db8::2'] }))

  expect(findCardLabelledList(wrapper, t('ip-addresses'))).toEqual(['10.0.0.1', '2001:db8::1', '2001:db8::2'])
})

it('labels only the first address row', () => {
  const wrapper = mountSidePanel(createPif({ ip: '10.0.0.1', ipv6: ['2001:db8::1'] }))

  expect(findCardLabels(wrapper).filter(label => label === t('ip-addresses'))).toHaveLength(1)
})

it('shows an empty address row when the PIF reports no address', () => {
  const wrapper = mountSidePanel(createPif({ ip: '', ipv6: [] }))

  expect(findCardLabelledList(wrapper, t('ip-addresses'))).toEqual([''])
})

it('shows the network settings the PIF reports', () => {
  const wrapper = mountSidePanel(
    createPif({
      mac: 'aa:bb:cc:dd:ee:ff',
      netmask: '255.255.255.0',
      dns: '10.0.0.53',
      gateway: '10.0.0.254',
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    [t('mac-address')]: 'aa:bb:cc:dd:ee:ff',
    [t('netmask')]: '255.255.255.0',
    [t('dns')]: '10.0.0.53',
    [t('gateway')]: '10.0.0.254',
  })
})

it('names a static IP configuration', () => {
  const wrapper = mountSidePanel(createPif({ mode: 'Static' }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('ip-mode')]: t('static') })
})

it('names a DHCP IP configuration', () => {
  const wrapper = mountSidePanel(createPif({ mode: 'DHCP' }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('ip-mode')]: t('dhcp') })
})

it('names an absent IP configuration', () => {
  const wrapper = mountSidePanel(createPif({ mode: 'None' }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('ip-mode')]: t('none') })
})

it('lists the devices bonded under the PIF, apart from its addresses', () => {
  getBondsDevices.mockReturnValue(['eth1', 'eth2'])

  const wrapper = mountSidePanel(createPif({ isBondMaster: true, ip: '10.0.0.1', ipv6: ['2001:db8::1'] }))

  expect(findCardLabelledList(wrapper, t('bond-devices'))).toEqual(['eth1', 'eth2'])
  expect(findCardLabelledList(wrapper, t('ip-addresses'))).toEqual(['10.0.0.1', '2001:db8::1'])
})

it('reports no MTU when the PIF carries none', () => {
  const wrapper = mountSidePanel(createPif({ mtu: -1 }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('mtu')]: t('none') })
})

it('reports the MTU the PIF carries', () => {
  const wrapper = mountSidePanel(createPif({ mtu: 9000 }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('mtu')]: '9000' })
})

it('scales the speed the PIF reports to bits per second', () => {
  const wrapper = mountSidePanel(createPif({ speed: 1000 }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('speed')]: '1 Gb/s' })
})

it('reports a null speed when the PIF reports none', () => {
  const wrapper = mountSidePanel(createPif({ speed: undefined }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('speed')]: '0 b/s' })
})

it('shows the network block device as on when the network has it enabled', () => {
  const wrapper = mountSidePanel(createPif(), createNetwork({ nbd: true }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('network-block-device')]: t('on') })
})

it('shows the network block device as off when the network has it disabled', () => {
  const wrapper = mountSidePanel(createPif(), createNetwork({ nbd: false }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('network-block-device')]: t('off') })
})
