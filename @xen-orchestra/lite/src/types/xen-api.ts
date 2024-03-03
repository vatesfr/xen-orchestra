import type { RawObjectType, XenApiMessage } from '@/libs/xen-api/xen-api.types'

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

export interface XenApiAlarm<RelationType extends RawObjectType> extends XenApiMessage<RelationType> {
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
