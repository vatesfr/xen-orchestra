import type { XenApiMessage } from '@vates/types'

export type XenApiAlarmType =
  | 'cpu_usage'
  | 'network_usage'
  | 'disk_usage'
  | 'fs_usage'
  | 'log_fs_usage'
  | 'mem_usage'
  | 'physical_utilisation'
  | 'sr_io_throughput_total_per_host'
  | 'memory_free_kib'
  | 'unknown'

export interface XenApiAlarm extends XenApiMessage {
  level: number
  triggerLevel: number
  type: XenApiAlarmType
}

export type XenApiPatch = {
  $id: string
  name: string
  description: string
  license: string
  release: string
  size: number
  url: string
  version: string
  changelog:
    | null
    | undefined
    | {
        date: number
        description: string
        author: string
      }
}
