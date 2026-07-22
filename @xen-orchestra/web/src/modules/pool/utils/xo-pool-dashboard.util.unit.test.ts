import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import {
  buildStackedTimeSeries,
  buildStoragesProgressItems,
  getHostsStats,
  getStoragesUsageTotals,
} from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import { createHostStats } from '@/test/create-host-stats.ts'
import type { XoHost } from '@vates/types'
import type { XapiPoolStats } from '@vates/types/common'

type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]

function createStorageUsage(overrides: Partial<StorageUsage> = {}): StorageUsage {
  return {
    id: 'sr-1' as StorageUsage['id'],
    name_label: 'Storage',
    percent: 0,
    physical_usage: 0,
    size: 0,
    ...overrides,
  }
}

describe('getHostsStats', () => {
  test('keeps only the entries satisfying the predicate', () => {
    const hostWithCpus = createHostStats({ stats: { cpus: { cpu0: [1, 2] } } })
    const data: XapiPoolStats = {
      ['host-1' as XoHost['id']]: hostWithCpus,
      ['host-2' as XoHost['id']]: createHostStats({ stats: { memory: [1, 2] } }),
      ['host-3' as XoHost['id']]: { error: { code: 'boom' } },
    }

    expect(getHostsStats(data, host => !!host.stats?.cpus)).toEqual([hostWithCpus])
  })

  test('returns an empty array when no entry satisfies the predicate', () => {
    const data: XapiPoolStats = {
      ['host-1' as XoHost['id']]: createHostStats({ stats: { memory: [1, 2] } }),
      ['host-2' as XoHost['id']]: { error: { code: 'boom' } },
    }

    expect(getHostsStats(data, host => !!host.stats?.cpus)).toEqual([])
  })

  test('returns an empty array for empty data', () => {
    expect(getHostsStats({}, () => true)).toEqual([])
  })
})

describe('buildStackedTimeSeries', () => {
  test('sums the per-host values at each index and aligns them with the timestamps', () => {
    const firstHost = createHostStats({ endTimestamp: 1000, interval: 10, stats: { memory: [10, 20] } })
    const secondHost = createHostStats({ endTimestamp: 1000, interval: 10, stats: { memory: [1, 2] } })

    const series = buildStackedTimeSeries([firstHost, secondHost], 2, (host, index) => host.stats.memory?.[index] ?? 0)

    expect(series).toEqual([
      { timestamp: 990_000, value: 11 },
      { timestamp: 1_000_000, value: 22 },
    ])
  })

  test('returns an empty array when there are no hosts', () => {
    expect(buildStackedTimeSeries([], 3, () => 0)).toEqual([])
  })

  test('propagates NaN when the value getter returns NaN for a missing sample', () => {
    const partialHost = createHostStats({ stats: { memory: [10] } })

    const series = buildStackedTimeSeries([partialHost], 2, (host, index) => host.stats.memory?.[index] ?? NaN)

    expect(series[0].value).toBe(10)
    expect(series[1].value).toBeNaN()
  })
})

describe('getStoragesUsageTotals', () => {
  test('sums the physical usage and size across all storages', () => {
    const storages = [
      createStorageUsage({ physical_usage: 100, size: 1000 }),
      createStorageUsage({ physical_usage: 50, size: 500 }),
    ]

    expect(getStoragesUsageTotals(storages)).toEqual({ totalUsage: 150, totalSize: 1500 })
  })

  test('returns zero totals for an empty array', () => {
    expect(getStoragesUsageTotals([])).toEqual({ totalUsage: 0, totalSize: 0 })
  })
})

describe('buildStoragesProgressItems', () => {
  test('maps each storage to a progress bar item out of 100', () => {
    const storages = [
      createStorageUsage({ id: 'sr-1' as StorageUsage['id'], name_label: 'Local storage', percent: 30 }),
      createStorageUsage({ id: 'sr-2' as StorageUsage['id'], name_label: 'Shared storage', percent: 70 }),
    ]

    expect(buildStoragesProgressItems(storages)).toEqual([
      { id: 'sr-1', label: 'Local storage', current: 30, total: 100 },
      { id: 'sr-2', label: 'Shared storage', current: 70, total: 100 },
    ])
  })

  test('returns an empty array for an empty input', () => {
    expect(buildStoragesProgressItems([])).toEqual([])
  })
})
