import type { XapiVmStats } from '@vates/types/common'
import {
  buildTimestamps,
  type ChartPoint,
  countSamples,
  getMaxSample,
  getUsedMemoryAtIndex,
  type PairedUsageSeries,
  RAM_CHART_MAX_FALLBACK,
  sumAtIndex,
} from '@xen-orchestra/web/ui-plugin-sdk'

// VMs don't all have the same history length (e.g. node VMs recreated on upgrade), so the series are aligned on their
// most recent sample. A sample missing for a VM counts as 0, so a single VM gap doesn't blank the whole cluster series.
function buildStackedTimeSeries(
  vmsStats: XapiVmStats[],
  getSampleCount: (vmStats: XapiVmStats) => number,
  getVmValueAtIndex: (vmStats: XapiVmStats, index: number) => number
): ChartPoint[] {
  const sampleCounts = vmsStats.map(getSampleCount)
  const dataLength = Math.max(...sampleCounts, 0)

  if (dataLength === 0) {
    return []
  }

  const timestamps = buildTimestamps(vmsStats[sampleCounts.indexOf(dataLength)], dataLength)

  return timestamps.map((timestamp, index) => {
    const value = vmsStats.reduce((sum, vmStats, vmIndex) => {
      const vmSampleIndex = index - (dataLength - sampleCounts[vmIndex])

      if (vmSampleIndex < 0) {
        return sum
      }

      return sum + (getVmValueAtIndex(vmStats, vmSampleIndex) || 0)
    }, 0)

    return { timestamp, value }
  })
}

export function buildClusterCpuUsageSeries(vmsStats: XapiVmStats[]): ChartPoint[] {
  return buildStackedTimeSeries(
    vmsStats,
    vmStats => countSamples(vmStats.stats.cpus),
    (vmStats, index) => Math.round(sumAtIndex(vmStats.stats.cpus, index))
  )
}

export function buildClusterRamUsageSeries(vmsStats: XapiVmStats[]): ChartPoint[] {
  return buildStackedTimeSeries(
    vmsStats,
    vmStats => (vmStats.stats.memory && vmStats.stats.memoryFree ? vmStats.stats.memory.length : 0),
    (vmStats, index) => getUsedMemoryAtIndex(vmStats.stats, index)
  )
}

export function getClusterRamUsageMaxValue(vmsStats: XapiVmStats[]): number {
  const totalMemory = vmsStats.reduce((total, vmStats) => total + getMaxSample(vmStats.stats.memory), 0)

  return totalMemory || RAM_CHART_MAX_FALLBACK
}

export function buildClusterNetworkUsageSeries(vmsStats: XapiVmStats[]): PairedUsageSeries {
  const getSampleCount = (vmStats: XapiVmStats) =>
    Math.max(countSamples(vmStats.stats.vifs?.rx), countSamples(vmStats.stats.vifs?.tx))

  return [
    buildStackedTimeSeries(vmsStats, getSampleCount, (vmStats, index) => sumAtIndex(vmStats.stats.vifs?.rx, index)),
    buildStackedTimeSeries(vmsStats, getSampleCount, (vmStats, index) => sumAtIndex(vmStats.stats.vifs?.tx, index)),
  ]
}
