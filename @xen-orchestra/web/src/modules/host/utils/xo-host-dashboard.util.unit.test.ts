import {
  buildHostCpuUsageSeries,
  buildHostLoadAverageSeries,
  buildHostNetworkUsageSeries,
  buildHostRamUsageSeries,
  getHostCpuUsageMaxValue,
  getHostLoadAverageMaxValue,
  getHostNetworkUsageMaxValue,
  getHostRamUsageMaxValue,
} from '@/modules/host/utils/xo-host-dashboard.util.ts'
import { createHostStats } from '@/test/create-host-stats.ts'

describe('buildHostCpuUsageSeries', () => {
  test('averages the usage across all cpus at each index', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [10, 20], cpu1: [30, 40] } } })

    expect(buildHostCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 20 },
      { timestamp: 1_000_000, value: 30 },
    ])
  })

  test('rounds the averaged usage to the nearest integer', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [1], cpu1: [2] } } })

    expect(buildHostCpuUsageSeries(data)).toEqual([{ timestamp: 1_000_000, value: 2 }])
  })

  test('propagates NaN when a sample is missing', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [10, null] } } })

    const series = buildHostCpuUsageSeries(data)

    expect(series[0].value).toBe(10)
    expect(series[1].value).toBeNaN()
  })

  test('returns an empty array when there are no cpu stats', () => {
    expect(buildHostCpuUsageSeries(createHostStats())).toEqual([])
  })

  test('returns an empty array when the cpu stats hold no samples', () => {
    expect(buildHostCpuUsageSeries(createHostStats({ stats: { cpus: { cpu0: [] } } }))).toEqual([])
  })

  test('returns an empty array for null data', () => {
    expect(buildHostCpuUsageSeries(null)).toEqual([])
  })
})

describe('getHostCpuUsageMaxValue', () => {
  test('returns 100 for an empty series', () => {
    expect(getHostCpuUsageMaxValue([])).toBe(100)
  })

  test('rounds the maximum up to the next hundred', () => {
    expect(getHostCpuUsageMaxValue([{ timestamp: 0, value: 150 }])).toBe(200)
  })

  test('keeps a value already on a hundred boundary', () => {
    expect(getHostCpuUsageMaxValue([{ timestamp: 0, value: 50 }])).toBe(100)
  })
})

describe('buildHostRamUsageSeries', () => {
  test('computes used memory as total minus free at each index', () => {
    const data = createHostStats({ stats: { memory: [100, 200], memoryFree: [40, 50] } })

    expect(buildHostRamUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 60 },
      { timestamp: 1_000_000, value: 150 },
    ])
  })

  test('propagates NaN when a free sample is missing', () => {
    const data = createHostStats({ stats: { memory: [100, 200], memoryFree: [40] } })

    const series = buildHostRamUsageSeries(data)

    expect(series[0].value).toBe(60)
    expect(series[1].value).toBeNaN()
  })

  test('returns an empty array when memory stats are missing', () => {
    expect(buildHostRamUsageSeries(createHostStats({ stats: { memoryFree: [40] } }))).toEqual([])
  })

  test('returns an empty array when free memory stats are missing', () => {
    expect(buildHostRamUsageSeries(createHostStats({ stats: { memory: [100] } }))).toEqual([])
  })

  test('returns an empty array when the memory stats hold no samples', () => {
    expect(buildHostRamUsageSeries(createHostStats({ stats: { memory: [], memoryFree: [] } }))).toEqual([])
  })

  test('returns an empty array for null data', () => {
    expect(buildHostRamUsageSeries(null)).toEqual([])
  })
})

describe('getHostRamUsageMaxValue', () => {
  test('returns 1 GiB when there is no memory data', () => {
    expect(getHostRamUsageMaxValue(null)).toBe(1024 ** 3)
  })

  test('returns 1 GiB for an empty memory series', () => {
    expect(getHostRamUsageMaxValue(createHostStats({ stats: { memory: [] } }))).toBe(1024 ** 3)
  })

  test('returns the maximum memory value', () => {
    expect(getHostRamUsageMaxValue(createHostStats({ stats: { memory: [100, 300, 200] } }))).toBe(300)
  })

  test('treats missing memory samples as zero', () => {
    expect(getHostRamUsageMaxValue(createHostStats({ stats: { memory: [null, 200] } }))).toBe(200)
  })
})

describe('buildHostNetworkUsageSeries', () => {
  test('sums download and upload across all pifs at each index', () => {
    const data = createHostStats({
      stats: { pifs: { rx: { '0': [10, 20], '1': [5, 5] }, tx: { '0': [1, 2] } } },
    })

    expect(buildHostNetworkUsageSeries(data)).toEqual({
      download: [
        { timestamp: 990_000, value: 15 },
        { timestamp: 1_000_000, value: 25 },
      ],
      upload: [
        { timestamp: 990_000, value: 1 },
        { timestamp: 1_000_000, value: 2 },
      ],
    })
  })

  test('propagates NaN when a sample is missing', () => {
    const data = createHostStats({ stats: { pifs: { rx: { '0': [10, null] }, tx: { '0': [1, 2] } } } })

    const series = buildHostNetworkUsageSeries(data)

    expect(series.download[1].value).toBeNaN()
  })

  test('returns empty download and upload series when there are no pif stats', () => {
    expect(buildHostNetworkUsageSeries(createHostStats())).toEqual({ download: [], upload: [] })
  })

  test('returns empty download and upload series when the pif stats hold no samples', () => {
    const data = createHostStats({ stats: { pifs: { rx: { '0': [] }, tx: { '0': [] } } } })

    expect(buildHostNetworkUsageSeries(data)).toEqual({ download: [], upload: [] })
  })

  test('returns empty download and upload series for null data', () => {
    expect(buildHostNetworkUsageSeries(null)).toEqual({ download: [], upload: [] })
  })
})

describe('getHostNetworkUsageMaxValue', () => {
  test('returns 100 when both series are empty', () => {
    expect(getHostNetworkUsageMaxValue({ download: [], upload: [] })).toBe(100)
  })

  test('applies a 20% headroom and rounds up to the next fifty', () => {
    const series = {
      download: [{ timestamp: 0, value: 10 }],
      upload: [{ timestamp: 0, value: 20 }],
    }

    expect(getHostNetworkUsageMaxValue(series)).toBe(50)
  })

  test('picks the maximum across download and upload', () => {
    const series = {
      download: [{ timestamp: 0, value: 100 }],
      upload: [{ timestamp: 0, value: 20 }],
    }

    expect(getHostNetworkUsageMaxValue(series)).toBe(150)
  })
})

describe('buildHostLoadAverageSeries', () => {
  test('rounds each load sample to two decimals', () => {
    const data = createHostStats({ stats: { load: [1.234, 2.567] } })

    expect(buildHostLoadAverageSeries(data)).toEqual([
      { timestamp: 990_000, value: 1.23 },
      { timestamp: 1_000_000, value: 2.57 },
    ])
  })

  test('propagates NaN when a sample is missing', () => {
    const data = createHostStats({ stats: { load: [1.5, null] } })

    const series = buildHostLoadAverageSeries(data)

    expect(series[0].value).toBe(1.5)
    expect(series[1].value).toBeNaN()
  })

  test('returns an empty array when there are no load stats', () => {
    expect(buildHostLoadAverageSeries(createHostStats())).toEqual([])
  })

  test('returns an empty array when the load stats hold no samples', () => {
    expect(buildHostLoadAverageSeries(createHostStats({ stats: { load: [] } }))).toEqual([])
  })

  test('returns an empty array for null data', () => {
    expect(buildHostLoadAverageSeries(null)).toEqual([])
  })
})

describe('getHostLoadAverageMaxValue', () => {
  test('returns 10 for an empty series', () => {
    expect(getHostLoadAverageMaxValue([])).toBe(10)
  })

  test('rounds the maximum up to the next multiple of five', () => {
    expect(getHostLoadAverageMaxValue([{ timestamp: 0, value: 7 }])).toBe(10)
  })

  test('keeps a value already on a five boundary', () => {
    expect(getHostLoadAverageMaxValue([{ timestamp: 0, value: 5 }])).toBe(5)
  })
})
