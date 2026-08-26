import { buildTimestamps, formatChartBytes, roundUpChartMax } from '@/shared/utils/chart-stats.util.ts'
import { createHostStats } from '@/test/create-host-stats.ts'

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

describe('roundUpChartMax', () => {
  it('returns the fallback when there are no values', () => {
    expect(roundUpChartMax([], { step: 100, fallback: 42 })).toBe(42)
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
