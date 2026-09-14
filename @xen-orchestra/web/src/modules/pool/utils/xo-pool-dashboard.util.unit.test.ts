import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import {
  buildStackedCpuUsageSeries,
  buildStackedNetworkUsageSeries,
  buildStackedRamUsageSeries,
  getStackedRamUsageMaxValue,
  getStoragesUsageTotals,
  toHostRamProgressItem,
  toPercentProgressItem,
  toVmRamProgressItem,
} from '@/modules/pool/utils/xo-pool-dashboard.util.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createPoolStats } from '@/test/create-pool-stats.ts'

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

describe('buildStackedCpuUsageSeries', () => {
  it('sums the cpu usage of every host at each index', () => {
    const data = createPoolStats({
      'host-1': { stats: { cpus: { '0': [10, 20], '1': [30, 40] } } },
      'host-2': { stats: { cpus: { '0': [1, 2] } } },
    })

    expect(buildStackedCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 41 },
      { timestamp: 1_000_000, value: 62 },
    ])
  })

  it('rounds the usage each host contributes to the nearest integer', () => {
    const data = createPoolStats({ 'host-1': { stats: { cpus: { '0': [10.4] } } } })

    expect(buildStackedCpuUsageSeries(data)).toEqual([{ timestamp: 1_000_000, value: 10 }])
  })

  it('leaves out the hosts whose stats failed', () => {
    const data = createPoolStats({
      'host-1': { stats: { cpus: { '0': [10, 20] } } },
      'host-2': { error: { code: 'boom' } },
    })

    expect(buildStackedCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 10 },
      { timestamp: 1_000_000, value: 20 },
    ])
  })

  it('leaves out the hosts not reporting their cpus', () => {
    const data = createPoolStats({
      'host-1': { stats: { cpus: { '0': [10, 20] } } },
      'host-2': { stats: { memory: [2048, 4096] } },
    })

    expect(buildStackedCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 10 },
      { timestamp: 1_000_000, value: 20 },
    ])
  })

  it('sizes the series off the cpu samples, not off another stat the host reports', () => {
    const data = createPoolStats({ 'host-1': { stats: { cpus: { '0': [10, 20, 30] }, memory: [2048] } } })

    expect(buildStackedCpuUsageSeries(data)).toHaveLength(3)
  })

  it('returns an empty array when no host reports its cpus', () => {
    expect(buildStackedCpuUsageSeries(createPoolStats({ 'host-1': { stats: { memory: [2048] } } }))).toEqual([])
  })

  it('returns an empty array when the cpus of every host hold no sample', () => {
    expect(buildStackedCpuUsageSeries(createPoolStats({ 'host-1': { stats: { cpus: { '0': [] } } } }))).toEqual([])
  })

  it('returns an empty array for a pool without host', () => {
    expect(buildStackedCpuUsageSeries(createPoolStats())).toEqual([])
  })

  it('returns an empty array for stats that have not arrived yet', () => {
    expect(buildStackedCpuUsageSeries(null)).toEqual([])
  })
})

describe('buildStackedRamUsageSeries', () => {
  it('sums the memory used by every host at each index', () => {
    const data = createPoolStats({
      'host-1': { stats: { memory: [2048, 4096], memoryFree: [1024, 2048] } },
      'host-2': { stats: { memory: [1024, 1024], memoryFree: [512, 256] } },
    })

    expect(buildStackedRamUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 1536 },
      { timestamp: 1_000_000, value: 2816 },
    ])
  })

  it('leaves out a host reporting its total memory but not its free memory', () => {
    const data = createPoolStats({
      'host-1': { stats: { memory: [2048, 4096], memoryFree: [1024, 2048] } },
      'host-2': { stats: { memory: [1024, 1024] } },
    })

    expect(buildStackedRamUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 1024 },
      { timestamp: 1_000_000, value: 2048 },
    ])
  })

  it('returns an empty array when no host reports its free memory', () => {
    expect(buildStackedRamUsageSeries(createPoolStats({ 'host-1': { stats: { memory: [2048] } } }))).toEqual([])
  })

  it('returns an empty array when the memory of every host holds no sample', () => {
    const data = createPoolStats({ 'host-1': { stats: { memory: [], memoryFree: [] } } })

    expect(buildStackedRamUsageSeries(data)).toEqual([])
  })

  it('returns an empty array for a pool without host', () => {
    expect(buildStackedRamUsageSeries(createPoolStats())).toEqual([])
  })

  it('returns an empty array for stats that have not arrived yet', () => {
    expect(buildStackedRamUsageSeries(null)).toEqual([])
  })
})

describe('getStackedRamUsageMaxValue', () => {
  it('sums the highest total memory sample of every host', () => {
    const data = createPoolStats({
      'host-1': { stats: { memory: [2048, 4096] } },
      'host-2': { stats: { memory: [1024, 1024] } },
    })

    expect(getStackedRamUsageMaxValue(data)).toBe(5120)
  })

  it('counts a host reporting its total memory but not its free memory', () => {
    const data = createPoolStats({
      'host-1': { stats: { memory: [2048], memoryFree: [1024] } },
      'host-2': { stats: { memory: [1024] } },
    })

    expect(getStackedRamUsageMaxValue(data)).toBe(3072)
  })

  it('falls back to 1 GiB when every memory sample is zero, which would flatten the axis', () => {
    expect(getStackedRamUsageMaxValue(createPoolStats({ 'host-1': { stats: { memory: [0] } } }))).toBe(ONE_GB)
  })

  it('falls back to 1 GiB when no host reports its memory', () => {
    expect(getStackedRamUsageMaxValue(createPoolStats())).toBe(ONE_GB)
  })

  it('falls back to 1 GiB for stats that have not arrived yet', () => {
    expect(getStackedRamUsageMaxValue(null)).toBe(ONE_GB)
  })
})

describe('buildStackedNetworkUsageSeries', () => {
  it('sums the reception and the transmission of every host at each index', () => {
    const data = createPoolStats({
      'host-1': { stats: { pifs: { rx: { eth0: [10, 20] }, tx: { eth0: [30, 40] } } } },
      'host-2': { stats: { pifs: { rx: { eth0: [1, 2] }, tx: { eth0: [3, 4] } } } },
    })

    expect(buildStackedNetworkUsageSeries(data)).toEqual([
      [
        { timestamp: 990_000, value: 11 },
        { timestamp: 1_000_000, value: 22 },
      ],
      [
        { timestamp: 990_000, value: 33 },
        { timestamp: 1_000_000, value: 44 },
      ],
    ])
  })

  it('reports zeroes for the reception when the hosts only report their transmission', () => {
    const data = createPoolStats({ 'host-1': { stats: { pifs: { rx: {}, tx: { eth0: [30, 40] } } } } })

    expect(buildStackedNetworkUsageSeries(data)).toEqual([
      [
        { timestamp: 990_000, value: 0 },
        { timestamp: 1_000_000, value: 0 },
      ],
      [
        { timestamp: 990_000, value: 30 },
        { timestamp: 1_000_000, value: 40 },
      ],
    ])
  })

  it('takes the sample count from whichever direction reports the most', () => {
    const data = createPoolStats({ 'host-1': { stats: { pifs: { rx: { eth0: [10] }, tx: { eth0: [30, 40] } } } } })

    const [reception, transmission] = buildStackedNetworkUsageSeries(data)

    expect(reception.map(point => point.value)).toEqual([10, NaN])
    expect(transmission.map(point => point.value)).toEqual([30, 40])
  })

  it('returns empty series when no host reports its pifs', () => {
    expect(buildStackedNetworkUsageSeries(createPoolStats({ 'host-1': { stats: { memory: [2048] } } }))).toEqual([
      [],
      [],
    ])
  })

  it('returns empty series when the pifs of every host hold no sample', () => {
    expect(
      buildStackedNetworkUsageSeries(createPoolStats({ 'host-1': { stats: { pifs: { rx: {}, tx: {} } } } }))
    ).toEqual([[], []])
  })

  it('returns empty series for stats that have not arrived yet', () => {
    expect(buildStackedNetworkUsageSeries(null)).toEqual([[], []])
  })
})

describe('getStoragesUsageTotals', () => {
  it('sums the physical usage and size across all storages', () => {
    const storages = [
      createStorageUsage({ physical_usage: 100, size: 1000 }),
      createStorageUsage({ physical_usage: 50, size: 500 }),
    ]

    expect(getStoragesUsageTotals(storages)).toEqual({ totalUsage: 150, totalSize: 1500 })
  })

  it('returns zero totals for an empty array', () => {
    expect(getStoragesUsageTotals([])).toEqual({ totalUsage: 0, totalSize: 0 })
  })
})

describe('toPercentProgressItem', () => {
  it('maps a usage to a progress bar item out of 100', () => {
    const storage = createStorageUsage({ id: 'sr-1' as StorageUsage['id'], name_label: 'Local storage', percent: 30 })

    expect(toPercentProgressItem(storage)).toEqual({ id: 'sr-1', label: 'Local storage', current: 30, total: 100 })
  })

  it('keeps a fractional share as it is reported', () => {
    expect(toPercentProgressItem({ id: 'host-1', name_label: 'Host 1', percent: 12.5 })).toEqual({
      id: 'host-1',
      label: 'Host 1',
      current: 12.5,
      total: 100,
    })
  })
})

describe('toHostRamProgressItem', () => {
  it('maps a host to the memory it uses out of the memory it holds', () => {
    expect(toHostRamProgressItem({ id: 'host-1', name_label: 'Host 1', usage: 400, size: 1000 })).toEqual({
      id: 'host-1',
      label: 'Host 1',
      current: 400,
      total: 1000,
    })
  })
})

describe('toVmRamProgressItem', () => {
  it('derives the memory a VM uses by taking its free memory off its total', () => {
    expect(toVmRamProgressItem({ id: 'vm-1', name_label: 'VM 1', memory: 1000, memoryFree: 400 })).toEqual({
      id: 'vm-1',
      label: 'VM 1',
      current: 600,
      total: 1000,
    })
  })

  it('reports no memory used for a VM whose memory is entirely free', () => {
    expect(toVmRamProgressItem({ id: 'vm-1', name_label: 'VM 1', memory: 1000, memoryFree: 1000 })).toEqual({
      id: 'vm-1',
      label: 'VM 1',
      current: 0,
      total: 1000,
    })
  })
})
