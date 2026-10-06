import { buildTimestamps, type ChartPoint } from '@/shared/utils/chart-stats.util.ts'
import type { XapiHostStats } from '@vates/types/common'

export function buildHostLoadAverageSeries(data: XapiHostStats | null): ChartPoint[] {
  if (!data?.stats.load) {
    return []
  }

  const load = data.stats.load
  const timestamps = buildTimestamps(data, load.length)

  return timestamps.map((timestamp, index) => ({ timestamp, value: Number(load[index]?.toFixed(2)) }))
}
