import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import type { ProgressBarGroupItem } from '@core/components/progress-bar-group/VtsProgressBarGroup.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import type { XapiHostStats, XapiPoolStats } from '@vates/types/common'

type ChartTimeSeriesPoint = { timestamp: number; value: number }

type StorageUsage = NonNullable<NonNullable<XoPoolDashboard['srs']>['topFiveUsage']>[number]

export function getHostsStats(
  data: XapiPoolStats,
  hasRequiredStats: (hostStats: XapiHostStats) => boolean
): XapiHostStats[] {
  return Object.values(data).filter((entry): entry is XapiHostStats => hasRequiredStats(entry as XapiHostStats))
}

export function buildTimestamps(host: XapiHostStats, dataLength: number): number[] {
  const timestampStart = host.endTimestamp - host.interval * (dataLength - 1)

  return Array.from({ length: dataLength }, (_, index) => (timestampStart + index * host.interval) * 1000)
}

export function buildStackedTimeSeries(
  hostsStats: XapiHostStats[],
  dataLength: number,
  getHostValueAtIndex: (host: XapiHostStats, index: number) => number
): ChartTimeSeriesPoint[] {
  if (hostsStats.length === 0) {
    return []
  }

  const timestamps = buildTimestamps(hostsStats[0], dataLength)

  return timestamps.map((timestamp, index) => {
    const value = hostsStats.reduce((sum, host) => sum + getHostValueAtIndex(host, index), 0)

    return { timestamp, value }
  })
}

export function roundUpChartMax(values: number[], step: number, fallback: number): number {
  if (values.length === 0) {
    return fallback
  }

  return Math.ceil((Math.max(...values) * 1.2) / step) * step
}

export function formatChartBytes(value: number | null): string {
  if (value === null) {
    return ''
  }

  const size = formatSizeRaw(value, 1)

  return `${size.value} ${size.prefix}`
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

export function buildStoragesProgressItems(storagesUsage: StorageUsage[]): ProgressBarGroupItem[] {
  return storagesUsage.map(
    storage =>
      ({
        id: storage.id,
        label: storage.name_label,
        current: storage.percent,
        total: 100,
      }) satisfies ProgressBarGroupItem
  )
}
