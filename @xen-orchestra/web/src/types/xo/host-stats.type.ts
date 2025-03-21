type XoStats = Record<string, number[]>

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
