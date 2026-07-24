import { buildTimestamps, roundUpChartMax, type ChartPoint } from '@/shared/utils/chart-stats.util.ts'
import type { XapiHostStats } from '@vates/types/common'

type HostNetworkUsageSeries = { download: ChartPoint[]; upload: ChartPoint[] }

export function buildHostCpuUsageSeries(data: XapiHostStats | null): ChartPoint[] {
  if (!data?.stats.cpus) {
    return []
  }

  const cpus = Object.values(data.stats.cpus)
  const timestamps = buildTimestamps(data, cpus[0].length)

  return timestamps.map((timestamp, index) => {
    const cpuUsageSum = cpus.reduce((sum, cpu) => sum + (cpu[index] ?? NaN), 0)

    return { timestamp, value: Math.round(cpuUsageSum / cpus.length) }
  })
}

export function getHostCpuUsageMaxValue(series: ChartPoint[]): number {
  const values = series.map(point => point.value || 0)

  return roundUpChartMax(values, { step: 100, fallback: 100 })
}

export function buildHostRamUsageSeries(data: XapiHostStats | null): ChartPoint[] {
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

export function getHostRamUsageMaxValue(data: XapiHostStats | null): number {
  if (!data?.stats.memory?.length) {
    return 1024 ** 3
  }

  return Math.max(...data.stats.memory.map(value => value || 0), 0)
}

export function buildHostNetworkUsageSeries(data: XapiHostStats | null): HostNetworkUsageSeries {
  if (!data?.stats.pifs) {
    return { download: [], upload: [] }
  }

  const pifs = data.stats.pifs
  const timestamps = buildTimestamps(data, pifs.rx['0'].length)

  const sumAtIndex = (records: Record<string, (number | null)[]>, index: number) =>
    Object.values(records).reduce((sum, values) => sum + (values[index] ?? NaN), 0)

  return {
    download: timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(pifs.rx, index) })),
    upload: timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(pifs.tx, index) })),
  }
}

export function getHostNetworkUsageMaxValue(series: HostNetworkUsageSeries): number {
  const values = [...series.download, ...series.upload].map(point => point.value || 0)

  return roundUpChartMax(values, { step: 50, fallback: 100, headroom: 1.2 })
}

export function buildHostLoadAverageSeries(data: XapiHostStats | null): ChartPoint[] {
  if (!data?.stats.load) {
    return []
  }

  const load = data.stats.load
  const timestamps = buildTimestamps(data, load.length)

  return timestamps.map((timestamp, index) => ({ timestamp, value: Number(load[index]?.toFixed(2)) }))
}

export function getHostLoadAverageMaxValue(series: ChartPoint[]): number {
  const values = series.map(point => point.value || 0)

  return roundUpChartMax(values, { step: 5, fallback: 10 })
}
