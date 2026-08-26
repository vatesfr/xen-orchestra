import { formatSizeRaw } from '@core/utils/size.util.ts'

export type ChartPoint = { timestamp: number; value: number }

type StatsWindow = { endTimestamp: number; interval: number }

export function buildTimestamps(stats: StatsWindow, dataLength: number): number[] {
  const timestampStart = stats.endTimestamp - stats.interval * (dataLength - 1)

  return Array.from({ length: dataLength }, (_, index) => (timestampStart + index * stats.interval) * 1000)
}

export function roundUpChartMax(
  values: number[],
  { step, fallback, headroom = 1 }: { step: number; fallback: number; headroom?: number }
): number {
  if (values.length === 0) {
    return fallback
  }

  return Math.ceil((Math.max(...values) * headroom) / step) * step
}

export function formatChartBytes(value: number | null): string {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
