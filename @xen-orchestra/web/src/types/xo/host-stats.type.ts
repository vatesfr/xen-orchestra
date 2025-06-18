import type { XoStats } from '@/types/xo/xo-stats.type.ts'

export type XoHostStats = {
  endTimestamp: number
  interval: number
  stats: {
    cpus?: XoStats
    ioThroughput?: {
      r: XoStats
      w: XoStats
    }
    iops?: {
      r: XoStats
      w: XoStats
    }
    iowait?: XoStats
    latency?: {
      r: XoStats
      w: XoStats
    }
    load?: (number | null)[]
    memory?: (number | null)[]
    memoryFree?: (number | null)[]
    pifs?: {
      rx: XoStats
      tx: XoStats
    }
  }
}
