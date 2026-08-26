import { buildTimestamps, roundUpChartMax, type ChartPoint } from '@/shared/utils/chart-stats.util.ts'
import type { XapiVmStats } from '@vates/types/common'

type VmNetworkUsageSeries = { download: ChartPoint[]; upload: ChartPoint[] }

type VmVdiUsageSeries = { read: ChartPoint[]; write: ChartPoint[] }

type StatValues = (number | null)[]

function sumAtIndex(records: Record<string, StatValues>, index: number): number {
  return Object.values(records).reduce((sum, values) => sum + (values[index] ?? NaN), 0)
}

function countSamples(records: Record<string, StatValues> | undefined): number {
  return Object.values(records ?? {})[0]?.length ?? 0
}

export function buildVmCpuUsageSeries(data: XapiVmStats | null): ChartPoint[] {
  if (!data?.stats.cpus) {
    return []
  }

  const cpus = data.stats.cpus
  const cpuCount = Object.keys(cpus).length
  const timestamps = buildTimestamps(data, countSamples(cpus))

  return timestamps.map((timestamp, index) => ({
    timestamp,
    value: Math.round(sumAtIndex(cpus, index) / cpuCount),
  }))
}

export function getVmCpuUsageMaxValue(series: ChartPoint[]): number {
  const values = series.map(point => point.value || 0)

  return roundUpChartMax(values, { step: 100, fallback: 100 })
}

export function buildVmRamUsageSeries(data: XapiVmStats | null): ChartPoint[] {
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

export function getVmRamUsageMaxValue(data: XapiVmStats | null): number {
  if (!data?.stats.memory?.length) {
    return 1024 ** 3
  }

  return Math.max(...data.stats.memory.map(value => value || 0), 0)
}

export function buildVmNetworkUsageSeries(data: XapiVmStats | null): VmNetworkUsageSeries {
  if (!data?.stats.vifs) {
    return { download: [], upload: [] }
  }

  const vifs = data.stats.vifs
  const timestamps = buildTimestamps(data, countSamples(vifs.rx))

  return {
    download: timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(vifs.rx, index) })),
    upload: timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(vifs.tx, index) })),
  }
}

export function getVmNetworkUsageMaxValue(series: VmNetworkUsageSeries): number {
  const values = [...series.download, ...series.upload].map(point => point.value || 0)

  return roundUpChartMax(values, { step: 100, fallback: 100, headroom: 1.2 })
}

export function buildVmVdiUsageSeries(data: XapiVmStats | null): VmVdiUsageSeries {
  if (!data?.stats.xvds) {
    return { read: [], write: [] }
  }

  const xvds = data.stats.xvds
  const timestamps = buildTimestamps(data, countSamples(xvds.r))

  return {
    read: timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(xvds.r ?? {}, index) })),
    write: timestamps.map((timestamp, index) => ({ timestamp, value: sumAtIndex(xvds.w ?? {}, index) })),
  }
}

export function getVmVdiUsageMaxValue(series: VmVdiUsageSeries): number {
  const values = [...series.read, ...series.write].map(point => point.value || 0)

  return roundUpChartMax(values, { step: 100, fallback: 100, headroom: 1.2 })
}
