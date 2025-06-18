import type { XoStats } from '@/types/xo/xo-stats.type.ts'

export type XoVmStats = {
  endTimestamp: number
  interval: number
  stats: {
    cpus: XoStats
    memory: number[]
    iops: {
      r: XoStats
      w: XoStats
    }
    xvds: {
      r: XoStats
      w: XoStats
    }
    vifs: {
      rx: XoStats
      tx: XoStats
    }
    memoryFree: number[]
  }
}
