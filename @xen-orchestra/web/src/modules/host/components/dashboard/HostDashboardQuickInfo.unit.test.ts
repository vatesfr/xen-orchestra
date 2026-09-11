import HostDashboardQuickInfo from '@/modules/host/components/dashboard/HostDashboardQuickInfo.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findLabelledValues, findTags } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoHostCollectionMock, getMasterHostByPoolId, isMasterHost } = vi.hoisted(() => ({
  useXoHostCollectionMock: vi.fn(),
  getMasterHostByPoolId: vi.fn(),
  isMasterHost: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: useXoHostCollectionMock as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vmsByHost: ref(new Map()) })) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  useXoHostCollectionMock.mockReset()
  getMasterHostByPoolId.mockReset()
  isMasterHost.mockReset()

  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(true), getMasterHostByPoolId, isMasterHost })
  getMasterHostByPoolId.mockReturnValue(undefined)
  isMasterHost.mockReturnValue(false)
})

function mountQuickInfo(host: FrontXoHost = createHost()) {
  return mount(HostDashboardQuickInfo, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('shows a busy state instead of the rows while the hosts are still loading', () => {
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(false), getMasterHostByPoolId, isMasterHost })

  const wrapper = mountQuickInfo()

  expect(findLabelledValues(wrapper)).toEqual({})
})

it('lists every row of the card, in order', () => {
  const wrapper = mountQuickInfo()

  expect(wrapper.findAll('.vts-key-value-row').map(row => row.get('dt.label').text())).toEqual([
    t('state'),
    t('ip-address'),
    t('started'),
    t('master'),
    t('uuid'),
    t('description'),
    t('version'),
    t('hardware'),
    t('cores-with-sockets'),
    t('ram'),
    t('tags'),
  ])
})

it('shows the identity, power state and resources of the host', () => {
  const wrapper = mountQuickInfo(
    createHost({
      id: 'host-42' as FrontXoHost['id'],
      power_state: HOST_POWER_STATE.HALTED,
      address: '10.0.0.1',
      name_description: 'Runs the production VMs',
      version: '8.3.0',
      bios_strings: { 'system-manufacturer': 'Dell', 'system-product-name': 'PowerEdge R640' },
      cpus: { cores: 16, sockets: 2 },
      memory: { size: 4294967296, usage: 2147483648 },
    })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('state')]: t('host:status:halted'),
    [t('ip-address')]: '10.0.0.1',
    [t('uuid')]: 'host-42',
    [t('description')]: 'Runs the production VMs',
    [t('version')]: '8.3.0',
    [t('hardware')]: 'Dell (PowerEdge R640)',
    [t('cores-with-sockets')]: '16 (2)',
    [t('ram')]: '4 GiB',
  })
})

it('leaves the hardware row empty for a host reporting no BIOS string', () => {
  const wrapper = mountQuickInfo(createHost({ bios_strings: {} }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('hardware')]: '' })
})

it('shows the manufacturer alone when the host reports no product name', () => {
  const wrapper = mountQuickInfo(createHost({ bios_strings: { 'system-manufacturer': 'Dell' } }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('hardware')]: 'Dell' })
})

it('shows the product name alone when the host reports no manufacturer', () => {
  const wrapper = mountQuickInfo(createHost({ bios_strings: { 'system-product-name': 'PowerEdge R640' } }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('hardware')]: '(PowerEdge R640)' })
})

it('counts no core and no socket for a host reporting neither', () => {
  const wrapper = mountQuickInfo(createHost({ cpus: {} }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('cores-with-sockets')]: '0 (0)' })
})

it('leaves the start time out for a host that is not running', () => {
  const wrapper = mountQuickInfo(createHost({ power_state: HOST_POWER_STATE.HALTED }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('started')]: '' })
})

it('names the host itself as the master of its pool', () => {
  isMasterHost.mockReturnValue(true)

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('master')]: t('this-host') })
})

it('links to the master of the pool when the host is not it', () => {
  getMasterHostByPoolId.mockReturnValue(createHost({ id: 'host-1' as FrontXoHost['id'], name_label: 'Primary Host' }))

  const wrapper = mountQuickInfo()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: 'Primary Host' })
  expect(wrapper.get('.ui-link').attributes('href')).toBe('/host/host-1/dashboard')
})

it('leaves the master row empty when the master of the pool is not known', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('master')]: '' })
})

it('renders one tag per host tag', () => {
  const wrapper = mountQuickInfo(createHost({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['production', 'billing'])
})
