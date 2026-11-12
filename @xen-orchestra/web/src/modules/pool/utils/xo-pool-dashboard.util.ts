import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import {
  buildTimestamps,
  countSamples,
  getMaxSample,
  getUsedMemoryAtIndex,
  RAM_CHART_MAX_FALLBACK,
  sumAtIndex,
  type ChartPoint,
  type PairedUsageSeries,
} from '@/shared/utils/chart-stats.util.ts'
import type { ProgressBarGroupItem } from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'

type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]

type PercentUsage = { id: string; name_label: string; percent: number }

type HostRamUsage = { id: string; name_label: string; usage: number; size: number }

type VmRamUsage = { id: string; name_label: string; memory: number; memoryFree: number }

function getHostsStats(
  data: XapiPoolStats | null,
  hasRequiredStats: (hostStats: XapiHostStats) => boolean
): XapiHostStats[] {
  return Object.values(data ?? {}).filter((entry): entry is XapiHostStats => hasRequiredStats(entry as XapiHostStats))
}

function buildStackedTimeSeries(
  hostsStats: XapiHostStats[],
  dataLength: number,
  getHostValueAtIndex: (host: XapiHostStats, index: number) => number
): ChartPoint[] {
  if (hostsStats.length === 0) {
    return []
  }

  const timestamps = buildTimestamps(hostsStats[0], dataLength)

  return timestamps.map((timestamp, index) => {
    const value = hostsStats.reduce((sum, host) => sum + getHostValueAtIndex(host, index), 0)

    return { timestamp, value }
  })
}

export function buildStackedCpuUsageSeries(data: XapiPoolStats | null): ChartPoint[] {
  const hostsStats = getHostsStats(data, host => !!host.stats?.cpus)
  const dataLength = countSamples(hostsStats[0]?.stats.cpus)

  return buildStackedTimeSeries(hostsStats, dataLength, (host, index) => Math.round(sumAtIndex(host.stats.cpus, index)))
}

export function buildStackedRamUsageSeries(data: XapiPoolStats | null): ChartPoint[] {
  const hostsStats = getHostsStats(data, host => !!host.stats?.memory && !!host.stats?.memoryFree)
  const dataLength = hostsStats[0]?.stats.memory?.length ?? 0

  return buildStackedTimeSeries(hostsStats, dataLength, (host, index) => getUsedMemoryAtIndex(host.stats, index))
}

export function getStackedRamUsageMaxValue(data: XapiPoolStats | null): number {
  const hostsStats = getHostsStats(data, host => !!host.stats?.memory)

  const totalMemory = hostsStats.reduce((total, host) => total + getMaxSample(host.stats.memory), 0)

  return totalMemory || RAM_CHART_MAX_FALLBACK
}

export function buildStackedNetworkUsageSeries(data: XapiPoolStats | null): PairedUsageSeries {
  const hostsStats = getHostsStats(data, host => !!host.stats?.pifs)
  const pifs = hostsStats[0]?.stats.pifs
  const dataLength = Math.max(countSamples(pifs?.rx), countSamples(pifs?.tx))

  return [
    buildStackedTimeSeries(hostsStats, dataLength, (host, index) => sumAtIndex(host.stats.pifs?.rx, index)),
    buildStackedTimeSeries(hostsStats, dataLength, (host, index) => sumAtIndex(host.stats.pifs?.tx, index)),
  ]
}

export function getStoragesUsageTotals(storagesUsage: StorageUsage[]): { totalUsage: number; totalSize: number } {
  return storagesUsage.reduce(
    (totals, storage) => ({
      totalUsage: totals.totalUsage + storage.physical_usage,
      totalSize: totals.totalSize + storage.size,
    }),
    { totalUsage: 0, totalSize: 0 }
  )
}

export function toPercentProgressItem(usage: PercentUsage): ProgressBarGroupItem {
  return { id: usage.id, label: usage.name_label, current: usage.percent, total: 100 }
}

export function toHostRamProgressItem(usage: HostRamUsage): ProgressBarGroupItem {
  return { id: usage.id, label: usage.name_label, current: usage.usage, total: usage.size }
}

export function toVmRamProgressItem(usage: VmRamUsage): ProgressBarGroupItem {
  return { id: usage.id, label: usage.name_label, current: usage.memory - usage.memoryFree, total: usage.memory }
}
