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

export interface Alarm {
  level: number
  triggerLevel: number
  type: XenApiAlarmType
}
