import type { XoStats } from '@/types/xo/xo-stats.type.ts'

export type XoHostStats = {
  endTimestamp: number
  interval: number
  stats: {
    cpus: XoStats
    ioThroughput: {
      r: XoStats
      w: XoStats
    }
    iops: {
      r: XoStats
      w: XoStats
    }
    iowait: XoStats
    latency: {
      r: XoStats
      w: XoStats
    }
    load: number[]
    memory: number[]
    memoryFree: number[]
    pifs: {
      rx: XoStats
      tx: XoStats
    }
  }
}
