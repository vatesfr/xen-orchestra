import PoolDashboardStoragesUsage from '@/modules/pool/components/dashboard/PoolDashboardStoragesUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { itShowsDashboardCardStates } from '@/test/dashboard-card.ts'
import { findCardNumbers, findLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
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

function mountStoragesUsage(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardStoragesUsage, {
    props: { poolDashboard: withStorages([createStorageUsage()]), ...props },
    global: createGlobalTestConfig(),
  })
}

function withStorages(topFiveUsage: StorageUsage[]): XoPoolDashboard {
  return { srs: { topFiveUsage } }
}

itShowsDashboardCardStates(mountStoragesUsage, {
  dashboardProp: 'poolDashboard',
  title: [t('storage-usage'), t('top-#', 5)],
  missing: { 'the storage usage': { srs: {} } },
  findContent: findLegends,
  hasErrorState: true,
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
