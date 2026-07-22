import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import {
  buildStackedTimeSeries,
  buildStoragesProgressItems,
  buildTimestamps,
  formatChartBytes,
  getHostsStats,
  getStoragesUsageTotals,
  roundUpChartMax,
} from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import type { XoHost } from '@vates/types'
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'

type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]

function createHostStats(overrides: Partial<XapiHostStats> = {}): XapiHostStats {
  return {
    endTimestamp: 1000,
    interval: 10,
    stats: {},
    ...overrides,
  }
}

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

describe('buildTimestamps', () => {
  test('returns evenly spaced millisecond timestamps ending at the host end timestamp', () => {
    const host = createHostStats({ endTimestamp: 1000, interval: 10 })

    expect(buildTimestamps(host, 3)).toEqual([980_000, 990_000, 1_000_000])
  })

  test('returns a single timestamp at the end timestamp when there is only one sample', () => {
    const host = createHostStats({ endTimestamp: 1000, interval: 10 })

    expect(buildTimestamps(host, 1)).toEqual([1_000_000])
  })

  test('returns an empty array when there is no sample', () => {
    expect(buildTimestamps(createHostStats(), 0)).toEqual([])
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

describe('roundUpChartMax', () => {
  test('returns the fallback when there are no values', () => {
    expect(roundUpChartMax([], 100, 42)).toBe(42)
  })

  test('rounds the headroomed maximum up to the next step', () => {
    expect(roundUpChartMax([100], 50, 0)).toBe(150)
  })

  test('applies a 20% headroom over the maximum value', () => {
    expect(roundUpChartMax([50], 1, 0)).toBe(60)
  })

  test('picks the maximum across multiple values', () => {
    expect(roundUpChartMax([10, 50, 30], 1, 0)).toBe(60)
  })
})

describe('formatChartBytes', () => {
  test('returns an empty string for a null value', () => {
    expect(formatChartBytes(null)).toBe('')
  })

  test('formats a byte value with its unit', () => {
    expect(formatChartBytes(1024)).toBe('1 KiB')
  })

  test('formats a sub-kibibyte value in bytes', () => {
    expect(formatChartBytes(512)).toBe('512 B')
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
