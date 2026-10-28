import PoolDashboardStoragesUsage from '@/modules/pool/components/dashboard/PoolDashboardStoragesUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { findCardNumbers, findLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]

function createStorageUsage(overrides: Partial<StorageUsage> = {}): StorageUsage {
  return {
    id: 'sr-1' as StorageUsage['id'],
    name_label: 'Local storage',
    percent: 25,
    physical_usage: 1073741824,
    size: 4294967296,
    ...overrides,
  }
}

function mountStoragesUsage(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardStoragesUsage, {
    props: { poolDashboard: undefined, ...props },
    global: createGlobalTestConfig(),
  })
}

function withStorages(topFiveUsage: StorageUsage[]): XoPoolDashboard {
  return { srs: { topFiveUsage } }
}

it('renders the card title and the number of storages it covers', () => {
  const wrapper = mountStoragesUsage({ poolDashboard: withStorages([createStorageUsage()]) })

  expect(wrapper.get('.ui-card-title').text()).toContain(t('storage-usage'))
  expect(wrapper.get('.ui-card-title').text()).toContain(t('top-#', 5))
})

it('shows a loader while the dashboard has not arrived yet', () => {
  const wrapper = mountStoragesUsage()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows a loader while the storage usage is missing from the dashboard', () => {
  const wrapper = mountStoragesUsage({ poolDashboard: { srs: {} } })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the dashboard could not be fetched', () => {
  const wrapper = mountStoragesUsage({ poolDashboard: withStorages([createStorageUsage()]), hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('reports that there is nothing to show when the pool has no storage', () => {
  const wrapper = mountStoragesUsage({ poolDashboard: withStorages([]) })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-data-to-calculate'))
})

it('shows one progress bar per storage, the fullest first', () => {
  const wrapper = mountStoragesUsage({
    poolDashboard: withStorages([
      createStorageUsage({ id: 'sr-1' as StorageUsage['id'], name_label: 'Local storage', percent: 30 }),
      createStorageUsage({ id: 'sr-2' as StorageUsage['id'], name_label: 'Shared storage', percent: 70 }),
    ]),
  })

  expect(findLegends(wrapper)).toEqual([
    ['Shared storage', '70%'],
    ['Local storage', '30%'],
  ])
})

it('sums the usage and the free space across the storages', () => {
  const wrapper = mountStoragesUsage({
    poolDashboard: withStorages([
      createStorageUsage({ id: 'sr-1' as StorageUsage['id'], physical_usage: 1073741824, size: 4294967296 }),
      createStorageUsage({ id: 'sr-2' as StorageUsage['id'], physical_usage: 2147483648, size: 4294967296 }),
    ]),
  })

  expect(findCardNumbers(wrapper)).toEqual([
    [t('total-used'), '3 GiB'],
    [t('total-free'), '5 GiB'],
  ])
})
