import { ONE_GB } from '@/shared/constants.ts'
import {
  buildCpuUsageSeries,
  buildPairedUsageSeries,
  buildRamUsageSeries,
  buildTimestamps,
  countSamples,
  formatChartBytes,
  getChartMaxValue,
  getCpuUsageMaxValue,
  getMaxSample,
  getPairedUsageMaxValue,
  getRamUsageMaxValue,
  getUsedMemoryAtIndex,
  roundUpChartMax,
  sumAtIndex,
  type PairedUsageSeries,
} from '@/shared/utils/chart-stats.util.ts'
import { createHostStats } from '@/test/create-host-stats.ts'

describe('sumAtIndex', () => {
  it('sums the sample every record holds at that index', () => {
    expect(sumAtIndex({ '0': [10, 20], '1': [30, 40] }, 1)).toBe(60)
  })

  it('reports the sample itself for a single record', () => {
    expect(sumAtIndex({ '0': [10, 20] }, 0)).toBe(10)
  })

  it('reports NaN when a record is missing the sample', () => {
    expect(sumAtIndex({ '0': [10, 20], '1': [30] }, 1)).toBeNaN()
  })

  it('reports NaN for a null sample, which the host sends for a gap in its window', () => {
    expect(sumAtIndex({ '0': [10, null] }, 1)).toBeNaN()
  })

  it('reports NaN past the end of the window', () => {
    expect(sumAtIndex({ '0': [10, 20] }, 5)).toBeNaN()
  })

  it('reports zero for an empty record set', () => {
    expect(sumAtIndex({}, 0)).toBe(0)
  })

  it('reports zero for records the host did not send', () => {
    expect(sumAtIndex(undefined, 0)).toBe(0)
  })
})

describe('countSamples', () => {
  it('reports how many samples the records hold', () => {
    expect(countSamples({ '0': [10, 20, 30] })).toBe(3)
  })

  it('reads the count off the first record, as every record covers the same window', () => {
    expect(countSamples({ '0': [10, 20, 30], '1': [40, 50, 60] })).toBe(3)
  })

  it('reports no sample for a record set holding none', () => {
    expect(countSamples({ '0': [] })).toBe(0)
  })

  it('reports no sample for an empty record set', () => {
    expect(countSamples({})).toBe(0)
  })

  it('reports no sample for records the host did not send', () => {
    expect(countSamples(undefined)).toBe(0)
  })
})

describe('getMaxSample', () => {
  it('reports the highest sample of the window', () => {
    expect(getMaxSample([1000, 3000, 2000])).toBe(3000)
  })

  it('treats a null sample, which the host sends for a gap in its window, as zero', () => {
    expect(getMaxSample([null, 500])).toBe(500)
  })

  it('reports zero when every sample is zero', () => {
    expect(getMaxSample([0, 0])).toBe(0)
  })

  it('reports zero for a window holding no sample', () => {
    expect(getMaxSample([])).toBe(0)
  })

  it('reports zero for samples the host did not send', () => {
    expect(getMaxSample(undefined)).toBe(0)
  })
})

describe('getUsedMemoryAtIndex', () => {
  it('subtracts the free memory from the total memory at that index', () => {
    expect(getUsedMemoryAtIndex({ memory: [1000, 2000], memoryFree: [400, 500] }, 1)).toBe(1500)
  })

  it('reports NaN when the total memory is missing the sample', () => {
    expect(getUsedMemoryAtIndex({ memory: [1000], memoryFree: [400, 500] }, 1)).toBeNaN()
  })

  it('reports NaN when the free memory is missing the sample', () => {
    expect(getUsedMemoryAtIndex({ memory: [1000, 2000], memoryFree: [400] }, 1)).toBeNaN()
  })

  it('reports NaN for a null sample, which the host sends for a gap in its window', () => {
    expect(getUsedMemoryAtIndex({ memory: [1000, null], memoryFree: [400, 500] }, 1)).toBeNaN()
  })

  it('reports NaN for memory the host did not send', () => {
    expect(getUsedMemoryAtIndex({}, 0)).toBeNaN()
  })
})

describe('buildTimestamps', () => {
  it('returns evenly spaced millisecond timestamps ending at the end timestamp', () => {
    const stats = createHostStats({ endTimestamp: 1000, interval: 10 })

    expect(buildTimestamps(stats, 3)).toEqual([980_000, 990_000, 1_000_000])
  })

  it('returns a single timestamp at the end timestamp when there is only one sample', () => {
    const stats = createHostStats({ endTimestamp: 1000, interval: 10 })

    expect(buildTimestamps(stats, 1)).toEqual([1_000_000])
  })

  it('returns an empty array when there is no sample', () => {
    expect(buildTimestamps(createHostStats(), 0)).toEqual([])
  })
})

describe('buildCpuUsageSeries', () => {
  it('averages the usage across all cpus at each index', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [10, 20], cpu1: [30, 40] } } })

    expect(buildCpuUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 20 },
      { timestamp: 1_000_000, value: 30 },
    ])
  })

  it('rounds the averaged usage to the nearest integer', () => {
    const data = createHostStats({ stats: { cpus: { cpu0: [1], cpu1: [2] } } })

    expect(buildCpuUsageSeries(data)).toEqual([{ timestamp: 1_000_000, value: 2 }])
  })

  it('propagates NaN when a sample is missing', () => {
    const series = buildCpuUsageSeries(createHostStats({ stats: { cpus: { cpu0: [10, null] } } }))

    expect(series[0].value).toBe(10)
    expect(series[1].value).toBeNaN()
  })

  it('returns an empty array when there are no cpu stats', () => {
    expect(buildCpuUsageSeries(createHostStats())).toEqual([])
  })

  it('returns an empty array when the cpu stats hold no sample', () => {
    expect(buildCpuUsageSeries(createHostStats({ stats: { cpus: { cpu0: [] } } }))).toEqual([])
  })

  it('returns an empty array when no cpu is reported at all', () => {
    expect(buildCpuUsageSeries(createHostStats({ stats: { cpus: {} } }))).toEqual([])
  })

  it('returns an empty array for null data', () => {
    expect(buildCpuUsageSeries(null)).toEqual([])
  })
})

describe('buildRamUsageSeries', () => {
  it('subtracts the free memory from the total memory at each index', () => {
    const data = createHostStats({ stats: { memory: [1000, 2000], memoryFree: [400, 500] } })

    expect(buildRamUsageSeries(data)).toEqual([
      { timestamp: 990_000, value: 600 },
      { timestamp: 1_000_000, value: 1500 },
    ])
  })

  it('propagates NaN when a sample is missing', () => {
    const series = buildRamUsageSeries(createHostStats({ stats: { memory: [1000, 2000], memoryFree: [400] } }))

    expect(series[0].value).toBe(600)
    expect(series[1].value).toBeNaN()
  })

  it('returns an empty array when the total memory is not reported', () => {
    expect(buildRamUsageSeries(createHostStats({ stats: { memoryFree: [400] } }))).toEqual([])
  })

  it('returns an empty array when the free memory is not reported', () => {
    expect(buildRamUsageSeries(createHostStats({ stats: { memory: [1000] } }))).toEqual([])
  })

  it('returns an empty array when the memory stats hold no sample', () => {
    expect(buildRamUsageSeries(createHostStats({ stats: { memory: [], memoryFree: [] } }))).toEqual([])
  })

  it('returns an empty array for null data', () => {
    expect(buildRamUsageSeries(null)).toEqual([])
  })
})

describe('buildPairedUsageSeries', () => {
  it('sums each half across every device at each index', () => {
    const stats = createHostStats()

    expect(buildPairedUsageSeries(stats, { '0': [10, 20], '1': [1, 2] }, { '0': [30, 40] })).toEqual([
      [
        { timestamp: 990_000, value: 11 },
        { timestamp: 1_000_000, value: 22 },
      ],
      [
        { timestamp: 990_000, value: 30 },
        { timestamp: 1_000_000, value: 40 },
      ],
    ])
  })

  it('propagates NaN when a sample is missing', () => {
    const [firstSeries] = buildPairedUsageSeries(createHostStats(), { '0': [null] }, { '0': [10] })

    expect(firstSeries[0].value).toBeNaN()
  })

  it('reports zeroes for the second half when its records are missing', () => {
    const [, secondSeries] = buildPairedUsageSeries(createHostStats(), { '0': [10, 20] }, undefined)

    expect(secondSeries).toEqual([
      { timestamp: 990_000, value: 0 },
      { timestamp: 1_000_000, value: 0 },
    ])
  })

  it('reports zeroes for the first half when its records are missing', () => {
    expect(buildPairedUsageSeries(createHostStats(), undefined, { '0': [10, 20] })).toEqual([
      [
        { timestamp: 990_000, value: 0 },
        { timestamp: 1_000_000, value: 0 },
      ],
      [
        { timestamp: 990_000, value: 10 },
        { timestamp: 1_000_000, value: 20 },
      ],
    ])
  })

  it('takes the sample count from whichever half reports the most', () => {
    const [firstSeries, secondSeries] = buildPairedUsageSeries(createHostStats(), { '0': [10] }, { '0': [30, 40] })

    expect(firstSeries.map(point => point.value)).toEqual([10, NaN])
    expect(secondSeries.map(point => point.value)).toEqual([30, 40])
  })

  it('returns empty series when the records hold no sample', () => {
    expect(buildPairedUsageSeries(createHostStats(), { '0': [] }, { '0': [] })).toEqual([[], []])
  })

  it('returns empty series for null stats', () => {
    expect(buildPairedUsageSeries(null, { '0': [10] }, { '0': [20] })).toEqual([[], []])
  })
})

describe('roundUpChartMax', () => {
  it('returns the fallback when there are no values', () => {
    expect(roundUpChartMax([], { step: 100, fallback: 42 })).toBe(42)
  })

  it('returns the fallback when all values are zero', () => {
    expect(roundUpChartMax([0, 0, 0], { step: 100, fallback: 42 })).toBe(42)
  })

  it('rounds the maximum up to the next step without headroom by default', () => {
    expect(roundUpChartMax([150], { step: 100, fallback: 100 })).toBe(200)
  })

  it('keeps a value already on a step boundary', () => {
    expect(roundUpChartMax([50], { step: 100, fallback: 100 })).toBe(100)
  })

  it('applies the headroom multiplier before rounding', () => {
    expect(roundUpChartMax([50], { step: 1, fallback: 0, headroom: 1.2 })).toBe(60)
  })

  it('picks the maximum across multiple values', () => {
    expect(roundUpChartMax([10, 50, 30], { step: 1, fallback: 0, headroom: 1.2 })).toBe(60)
  })
})

describe('getChartMaxValue', () => {
  it('rounds up the highest value plotted by the series', () => {
    const series = [
      { timestamp: 0, value: 10 },
      { timestamp: 1, value: 150 },
    ]

    expect(getChartMaxValue(series, { step: 100, fallback: 100 })).toBe(200)
  })

  it('returns the fallback for an empty series', () => {
    expect(getChartMaxValue([], { step: 100, fallback: 42 })).toBe(42)
  })
})

describe('getCpuUsageMaxValue', () => {
  it('returns 100 for an empty series', () => {
    expect(getCpuUsageMaxValue([])).toBe(100)
  })

  it('rounds the maximum up to the next hundred', () => {
    expect(getCpuUsageMaxValue([{ timestamp: 0, value: 150 }])).toBe(200)
  })

  it('rounds a maximum below a hundred up to a hundred', () => {
    expect(getCpuUsageMaxValue([{ timestamp: 0, value: 50 }])).toBe(100)
  })

  it('keeps a maximum already on a hundred boundary', () => {
    expect(getCpuUsageMaxValue([{ timestamp: 0, value: 200 }])).toBe(200)
  })
})

describe('getRamUsageMaxValue', () => {
  it('returns the highest total memory sample', () => {
    expect(getRamUsageMaxValue(createHostStats({ stats: { memory: [1000, 3000, 2000] } }))).toBe(3000)
  })

  it('treats a missing sample as zero', () => {
    expect(getRamUsageMaxValue(createHostStats({ stats: { memory: [null, 500] } }))).toBe(500)
  })

  it('falls back to 1 GiB when every memory sample is zero, which would flatten the axis', () => {
    expect(getRamUsageMaxValue(createHostStats({ stats: { memory: [0, 0] } }))).toBe(ONE_GB)
  })

  it('falls back to 1 GiB when the memory holds no sample', () => {
    expect(getRamUsageMaxValue(createHostStats({ stats: { memory: [] } }))).toBe(ONE_GB)
  })

  it('falls back to 1 GiB for null data', () => {
    expect(getRamUsageMaxValue(null)).toBe(ONE_GB)
  })
})

describe('getPairedUsageMaxValue', () => {
  it('returns 100 when both series are empty', () => {
    expect(getPairedUsageMaxValue([[], []], { step: 100 })).toBe(100)
  })

  it('adds a fifth of headroom above the highest value of either half', () => {
    const series: PairedUsageSeries = [[{ timestamp: 0, value: 100 }], [{ timestamp: 0, value: 300 }]]

    expect(getPairedUsageMaxValue(series, { step: 100 })).toBe(400)
  })

  it('rounds up to the given step', () => {
    const series: PairedUsageSeries = [[{ timestamp: 0, value: 10 }], [{ timestamp: 0, value: 20 }]]

    expect(getPairedUsageMaxValue(series, { step: 50 })).toBe(50)
  })
})

describe('formatChartBytes', () => {
  it('returns an empty string for a null value', () => {
    expect(formatChartBytes(null)).toBe('')
  })

  it('formats a byte value with its unit', () => {
    expect(formatChartBytes(1024)).toBe('1 KiB')
  })

  it('formats a sub-kibibyte value in bytes', () => {
    expect(formatChartBytes(512)).toBe('512 B')
  })
})
