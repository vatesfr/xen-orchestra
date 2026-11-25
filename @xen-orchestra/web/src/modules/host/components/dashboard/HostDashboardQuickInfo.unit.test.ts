import HostDashboardQuickInfo from '@/modules/host/components/dashboard/HostDashboardQuickInfo.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { itShowsDashboardQuickInfo } from '@/test/dashboard-quick-info.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoCollections('host')

mockXoVmCollection()

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

function mountQuickInfo(host: FrontXoHost = createHost()) {
  return mount(HostDashboardQuickInfo, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

itShowsDashboardQuickInfo(mountQuickInfo, {
  objectName: 'host',
  loadingCollection: 'hosts',
  rows: [
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
  ],
  createWithAddress: (uuid, address) => createHost({ id: uuid as FrontXoHost['id'], address }),
  createWithTags: tags => createHost({ tags }),
})

it('shows the identity, state and resources of the host', () => {
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

it('shows a running host that is not enabled as disabled', () => {
  const wrapper = mountQuickInfo(createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: false }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('state')]: t('host:status:disabled') })
})

it('shows a host of unknown power state as unknown', () => {
  const wrapper = mountQuickInfo(createHost({ power_state: HOST_POWER_STATE.UNKNOWN, enabled: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('state')]: t('host:status:unknown') })
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
  xoCollectionsMock.seedMasterHost(createHost())

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('master')]: t('this-host') })
})

it('links to the master of the pool when the host is not it', () => {
  const masterHost = createHost({ id: 'host-1' as FrontXoHost['id'], name_label: 'Primary Host' })
  xoCollectionsMock.hosts.value = [masterHost]
  xoCollectionsMock.seedMasterHost(masterHost)

  const wrapper = mountQuickInfo()

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('master')]: 'Primary Host' })
  expect(wrapper.get('.ui-link').attributes('href')).toBe('/host/host-1/dashboard')
})

it('leaves the master row empty when the master of the pool is not known', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('master')]: '' })
})
