import { buildTimestamps, formatChartBytes, roundUpChartMax } from '@/shared/utils/chart-stats.util.ts'
import { createHostStats } from '@/test/create-host-stats.ts'

describe('buildTimestamps', () => {
  test('returns evenly spaced millisecond timestamps ending at the end timestamp', () => {
    const stats = createHostStats({ endTimestamp: 1000, interval: 10 })

    expect(buildTimestamps(stats, 3)).toEqual([980_000, 990_000, 1_000_000])
  })

  test('returns a single timestamp at the end timestamp when there is only one sample', () => {
    const stats = createHostStats({ endTimestamp: 1000, interval: 10 })

    expect(buildTimestamps(stats, 1)).toEqual([1_000_000])
  })

  test('returns an empty array when there is no sample', () => {
    expect(buildTimestamps(createHostStats(), 0)).toEqual([])
  })
})

describe('roundUpChartMax', () => {
  test('returns the fallback when there are no values', () => {
    expect(roundUpChartMax([], { step: 100, fallback: 42 })).toBe(42)
  })

  test('rounds the maximum up to the next step without headroom by default', () => {
    expect(roundUpChartMax([150], { step: 100, fallback: 100 })).toBe(200)
  })

  test('keeps a value already on a step boundary', () => {
    expect(roundUpChartMax([50], { step: 100, fallback: 100 })).toBe(100)
  })

  test('applies the headroom multiplier before rounding', () => {
    expect(roundUpChartMax([50], { step: 1, fallback: 0, headroom: 1.2 })).toBe(60)
  })

  test('picks the maximum across multiple values', () => {
    expect(roundUpChartMax([10, 50, 30], { step: 1, fallback: 0, headroom: 1.2 })).toBe(60)
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
