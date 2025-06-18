import type { XoStats } from '@/types/xo/xo-stats.type.ts'

export type XoVmStats = {
  endTimestamp: number
  interval: number
  stats: {
    cpus?: XoStats
    memory?: (number | null)[]
    iops?: {
      r: XoStats
      w: XoStats
    }
    xvds?: {
      r?: XoStats
      w?: XoStats
      total?: XoStats
    }
    vifs?: {
      rx: XoStats
      tx: XoStats
    }
    memoryFree?: (number | null)[]
    cpuUsage?: (number | null)[]
    runstateFullrun?: (number | null)[]
    runstateFullContention?: (number | null)[]
    runstatePartialRun?: (number | null)[]
    runstatePartialContention?: (number | null)[]
    runstateConcurrencyHazard?: (number | null)[]
    runstateBlocked?: (number | null)[]
    memoryTarget?: (number | null)[]
    vifErrors?: {
      rx: XoStats
      tx: XoStats
    }
    vbdLatency?: {
      w: XoStats
      r: XoStats
    }
    vbdIowait?: XoStats
    vbdInflight?: XoStats
    vbdAvgquSz?: XoStats
  }
}
