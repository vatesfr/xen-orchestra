import { formatSizeRaw } from '@core/utils/size.util.ts'

export type ChartPoint = { timestamp: number; value: number }

export type PairedUsageSeries = [ChartPoint[], ChartPoint[]]

type StatValues = (number | null)[]

type StatValuesRecord = Record<string, StatValues>

type StatsWindow = { endTimestamp: number; interval: number }

type CpuStats = StatsWindow & { stats: { cpus?: StatValuesRecord } }

type MemoryStats = StatsWindow & { stats: { memory?: StatValues; memoryFree?: StatValues } }

type ChartMaxOptions = { step: number; fallback: number; headroom?: number }

function sumAtIndex(records: StatValuesRecord, index: number): number {
  return Object.values(records).reduce((sum, values) => sum + (values[index] ?? NaN), 0)
}

function countSamples(records: StatValuesRecord | undefined): number {
  return Object.values(records ?? {})[0]?.length ?? 0
}

export function buildTimestamps(stats: StatsWindow, dataLength: number): number[] {
  const timestampStart = stats.endTimestamp - stats.interval * (dataLength - 1)

  return Array.from({ length: dataLength }, (_, index) => (timestampStart + index * stats.interval) * 1000)
}

export function buildCpuUsageSeries(data: CpuStats | null): ChartPoint[] {
  const cpus = data?.stats.cpus

  if (!cpus) {
    return []
  }

  const cpuCount = Object.keys(cpus).length
  const timestamps = buildTimestamps(data, countSamples(cpus))

  return timestamps.map((timestamp, index) => ({
    timestamp,
    value: Math.round(sumAtIndex(cpus, index) / cpuCount),
  }))
}

export function buildRamUsageSeries(data: MemoryStats | null): ChartPoint[] {
  if (!data?.stats.memory || !data.stats.memoryFree) {
    return []
  }

  const memory = data.stats.memory
  const memoryFree = data.stats.memoryFree
  const timestamps = buildTimestamps(data, memory.length)

  return timestamps.map((timestamp, index) => ({
    timestamp,
    value: (memory[index] ?? NaN) - (memoryFree[index] ?? NaN),
  }))
}

export function buildPairedUsageSeries(
  stats: StatsWindow | null,
  firstRecords: StatValuesRecord | undefined,
  secondRecords: StatValuesRecord | undefined
): PairedUsageSeries {
  if (stats === null) {
    return [[], []]
  }

  const sampleCount = Math.max(countSamples(firstRecords), countSamples(secondRecords))
  const timestamps = buildTimestamps(stats, sampleCount)

  return [
    timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(firstRecords ?? {}, index) })),
    timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(secondRecords ?? {}, index) })),
  ]
}

export function roundUpChartMax(values: number[], { step, fallback, headroom = 1 }: ChartMaxOptions): number {
  if (values.length === 0) {
    return fallback
  }

  return Math.ceil((Math.max(...values) * headroom) / step) * step || fallback
}

export function getChartMaxValue(series: ChartPoint[], options: ChartMaxOptions): number {
  return roundUpChartMax(
    series.map(point => point.value || 0),
    options
  )
}

export function getCpuUsageMaxValue(series: ChartPoint[]): number {
  return getChartMaxValue(series, { step: 100, fallback: 100 })
}

export function getRamUsageMaxValue(data: MemoryStats | null): number {
  if (!data?.stats.memory?.length) {
    return 1024 ** 3
  }

  return Math.max(...data.stats.memory.map(value => value || 0), 0)
}

export function getPairedUsageMaxValue(
  [firstSeries, secondSeries]: PairedUsageSeries,
  { step }: { step: number }
): number {
  return getChartMaxValue([...firstSeries, ...secondSeries], { step, fallback: 100, headroom: 1.2 })
}

export function formatChartBytes(value: number | null): string {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
}
