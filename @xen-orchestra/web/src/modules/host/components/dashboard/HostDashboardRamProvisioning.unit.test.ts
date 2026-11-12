import HostDashboardRamProvisioning from '@/modules/host/components/dashboard/HostDashboardRamProvisioning.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findCardNumbers, findLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoHostCollectionMock } = vi.hoisted(() => ({ useXoHostCollectionMock: vi.fn() }))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: useXoHostCollectionMock as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  useXoHostCollectionMock.mockReset()
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(true) })
})

function mountProvisioning(host: FrontXoHost = createHost({ memory: { size: 4294967296, usage: 1073741824 } })) {
  return mount(HostDashboardRamProvisioning, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('ram-provisioning'))
})

it('shows a loader instead of the provisioning while the hosts are still loading', () => {
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(false) })

  const wrapper = mountProvisioning()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('splits the memory of the host between what is assigned and what is left', () => {
  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('total-assigned'), '1 GiB'],
    [t('total-free'), '3 GiB'],
  ])
})

it('fills the progress bar with the share of the memory in use', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-progress-bar .fill').attributes('style')).toBe('width: 25%;')
})

it('labels the progress bar with the name of the host', () => {
  const wrapper = mountProvisioning(
    createHost({ name_label: 'Primary Host', memory: { size: 4294967296, usage: 1073741824 } })
  )

  expect(findLegends(wrapper).map(([label]) => label)).toEqual(['Primary Host'])
})
