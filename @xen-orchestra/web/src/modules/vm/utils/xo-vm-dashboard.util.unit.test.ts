import {
  buildVmCpuUsageSeries,
  buildVmNetworkUsageSeries,
  buildVmRamUsageSeries,
  buildVmVdiUsageSeries,
  getVmCpuUsageMaxValue,
  getVmNetworkUsageMaxValue,
  getVmRamUsageMaxValue,
  getVmVdiUsageMaxValue,
} from '@/modules/vm/utils/xo-vm-dashboard.util.ts'
import { createVmStats } from '@/test/create-vm-stats.ts'

describe('buildVmCpuUsageSeries', () => {
  it('averages the usage across all vcpus at each index', () => {
    const data = createVmStats({ stats: { cpus: { cpu0: [10, 20], cpu1: [30, 40] } } })

    expect(buildVmCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 20 },
      { timestamp: 1_000_000, value: 30 },
    ])
  })

  it('rounds the averaged usage to the nearest integer', () => {
    const data = createVmStats({ stats: { cpus: { cpu0: [1], cpu1: [2] } } })

    expect(buildVmCpuUsageSeries(data)).toEqual([{ timestamp: 1_000_000, value: 2 }])
  })

  it('propagates NaN when a sample is missing', () => {
    const series = buildVmCpuUsageSeries(createVmStats({ stats: { cpus: { cpu0: [10, null] } } }))

    expect(series[0].value).toBe(10)
    expect(series[1].value).toBeNaN()
  })

  it('returns an empty array when there are no vcpu stats', () => {
    expect(buildVmCpuUsageSeries(createVmStats())).toEqual([])
  })

  it('returns an empty array when the vcpu stats hold no sample', () => {
    expect(buildVmCpuUsageSeries(createVmStats({ stats: { cpus: { cpu0: [] } } }))).toEqual([])
  })

  it('returns an empty array when the VM reports no vcpu at all', () => {
    expect(buildVmCpuUsageSeries(createVmStats({ stats: { cpus: {} } }))).toEqual([])
  })

  it('returns an empty array for null data', () => {
    expect(buildVmCpuUsageSeries(null)).toEqual([])
  })
})

describe('getVmCpuUsageMaxValue', () => {
  it('returns 100 for an empty series', () => {
    expect(getVmCpuUsageMaxValue([])).toBe(100)
  })

  it('rounds the maximum up to the next hundred', () => {
    expect(getVmCpuUsageMaxValue([{ timestamp: 0, value: 150 }])).toBe(200)
  })

  it('keeps a maximum already on a hundred boundary', () => {
    expect(getVmCpuUsageMaxValue([{ timestamp: 0, value: 200 }])).toBe(200)
  })
})

describe('buildVmRamUsageSeries', () => {
  it('subtracts the free memory from the total memory at each index', () => {
    const data = createVmStats({ stats: { memory: [1000, 2000], memoryFree: [400, 500] } })

    expect(buildVmRamUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 600 },
      { timestamp: 1_000_000, value: 1500 },
    ])
  })

  it('propagates NaN when a sample is missing', () => {
    const series = buildVmRamUsageSeries(createVmStats({ stats: { memory: [1000], memoryFree: [null] } }))

    expect(series[0].value).toBeNaN()
  })

  it('returns an empty array when the free memory is not reported', () => {
    expect(buildVmRamUsageSeries(createVmStats({ stats: { memory: [1000] } }))).toEqual([])
  })

  it('returns an empty array for null data', () => {
    expect(buildVmRamUsageSeries(null)).toEqual([])
  })
})

describe('getVmRamUsageMaxValue', () => {
  it('returns the highest total memory sample', () => {
    expect(getVmRamUsageMaxValue(createVmStats({ stats: { memory: [1000, 3000, 2000] } }))).toBe(3000)
  })

  it('treats a missing sample as zero', () => {
    expect(getVmRamUsageMaxValue(createVmStats({ stats: { memory: [null, 500] } }))).toBe(500)
  })

  it('falls back to 1 GiB when the memory holds no sample', () => {
    expect(getVmRamUsageMaxValue(createVmStats({ stats: { memory: [] } }))).toBe(1024 ** 3)
  })

  it('falls back to 1 GiB for null data', () => {
    expect(getVmRamUsageMaxValue(null)).toBe(1024 ** 3)
  })
})

describe('buildVmNetworkUsageSeries', () => {
  it('sums the received and transmitted bytes across every vif at each index', () => {
    const data = createVmStats({
      stats: { vifs: { rx: { '0': [10, 20], '1': [1, 2] }, tx: { '0': [30, 40], '1': [3, 4] } } },
    })

    expect(buildVmNetworkUsageSeries(data)).toEqual({
      download: [
        { timestamp: 990_000, value: 11 },
        { timestamp: 1_000_000, value: 22 },
      ],
      upload: [
        { timestamp: 990_000, value: 33 },
        { timestamp: 1_000_000, value: 44 },
      ],
    })
  })

  it('propagates NaN when a sample is missing', () => {
    const data = createVmStats({ stats: { vifs: { rx: { '0': [null] }, tx: { '0': [10] } } } })

    expect(buildVmNetworkUsageSeries(data).download[0].value).toBeNaN()
  })

  it('returns empty series when the VM reports no vif', () => {
    expect(buildVmNetworkUsageSeries(createVmStats({ stats: { vifs: { rx: {}, tx: {} } } }))).toEqual({
      download: [],
      upload: [],
    })
  })

  it('returns empty series when there are no vif stats', () => {
    expect(buildVmNetworkUsageSeries(createVmStats())).toEqual({ download: [], upload: [] })
  })

  it('returns empty series for null data', () => {
    expect(buildVmNetworkUsageSeries(null)).toEqual({ download: [], upload: [] })
  })
})

describe('getVmNetworkUsageMaxValue', () => {
  it('returns 100 for empty series', () => {
    expect(getVmNetworkUsageMaxValue({ download: [], upload: [] })).toBe(100)
  })

  it('adds a fifth of headroom above the highest value and rounds up to the next hundred', () => {
    const series = { download: [{ timestamp: 0, value: 100 }], upload: [{ timestamp: 0, value: 300 }] }

    expect(getVmNetworkUsageMaxValue(series)).toBe(400)
  })
})

describe('buildVmVdiUsageSeries', () => {
  it('sums the read and written bytes across every disk at each index', () => {
    const data = createVmStats({
      stats: { xvds: { r: { xvda: [10, 20], xvdb: [1, 2] }, w: { xvda: [30, 40], xvdb: [3, 4] } } },
    })

    expect(buildVmVdiUsageSeries(data)).toEqual({
      read: [
        { timestamp: 990_000, value: 11 },
        { timestamp: 1_000_000, value: 22 },
      ],
      write: [
        { timestamp: 990_000, value: 33 },
        { timestamp: 1_000_000, value: 44 },
      ],
    })
  })

  it('reports no written bytes when the VM only reports reads', () => {
    const data = createVmStats({ stats: { xvds: { r: { xvda: [10, 20] } } } })

    expect(buildVmVdiUsageSeries(data).write).toEqual([
      { timestamp: 990_000, value: 0 },
      { timestamp: 1_000_000, value: 0 },
    ])
  })

  it('returns empty series when the VM only reports writes', () => {
    const data = createVmStats({ stats: { xvds: { w: { xvda: [10, 20] } } } })

    expect(buildVmVdiUsageSeries(data)).toEqual({ read: [], write: [] })
  })

  it('returns empty series when there are no disk stats', () => {
    expect(buildVmVdiUsageSeries(createVmStats())).toEqual({ read: [], write: [] })
  })

  it('returns empty series for null data', () => {
    expect(buildVmVdiUsageSeries(null)).toEqual({ read: [], write: [] })
  })
})

describe('getVmVdiUsageMaxValue', () => {
  it('returns 100 for empty series', () => {
    expect(getVmVdiUsageMaxValue({ read: [], write: [] })).toBe(100)
  })

  it('adds a fifth of headroom above the highest value and rounds up to the next hundred', () => {
    const series = { read: [{ timestamp: 0, value: 300 }], write: [{ timestamp: 0, value: 100 }] }

    expect(getVmVdiUsageMaxValue(series)).toBe(400)
  })
})
