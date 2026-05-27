/**
 * Domain payload & label-lookup types exchanged over IPC and consumed by the
 * formatter.
 *
 * TYPE declarations only (erased at compile time). Moved verbatim out of
 * `index.mts` so the formatter (a pure leaf) can depend on the types without
 * depending on the plugin entry point.
 */

import type { XoHost, XoNetwork, XoPif, XoPool, XoSr, XoVbd, XoVdi, XoVif, XoVm, XoVmController } from '@vates/types'

import type { HostCredentials } from './ipc.mjs'

// Label lookup types for enriching metrics with human-readable names
export interface VmLabelInfo {
  name_label: string
  is_control_domain: boolean
  vbdDeviceToVdiName: Record<string, string> // { "xvda": "System Disk" }
  vbdDeviceToVdiUuid: Record<string, XoVdi['uuid']> // { "xvda": "vdi-uuid-123" }
  vifIndexToNetworkName: Record<string, string> // { "0": "Pool-wide network" }
  startTime: number | null // Unix timestamp of VM boot (from vm.startTime)
  power_state: string // VM power state (Running, Paused, Halted, Suspended)
  pool_id: string
  pool_name: string
}

export interface HostLabelInfo {
  name_label: string
  pifDeviceToNetworkName: Record<string, string> // { "eth0": "Management" }
  startTime: number | null // Unix timestamp of host boot (from host.startTime)
}

export interface SrLabelInfo {
  name_label: string
  /**
   * Mirrors `XoSr.SR_type` (kept in CamelCase to match the XAPI source field).
   * Resolved into the `sr_type` snake_case OpenMetrics label by `transformMetric`.
   */
  SR_type: string
}

export interface LabelLookupData {
  vms: Record<XoVm['uuid'] | XoVmController['uuid'], VmLabelInfo>
  hosts: Record<XoHost['uuid'], HostLabelInfo>
  srs: Record<XoSr['uuid'], SrLabelInfo>
  srTruncatedToUuid: Record<string, XoSr['uuid']> // maps any UUID truncation (prefix or suffix) to the full SR UUID
  vdiUuidToSrUuid: Record<XoVdi['uuid'], XoSr['uuid']> // maps VDI UUID to parent SR UUID
}

interface XapiCredentialsPayload {
  hosts: HostCredentials[]
  labels: LabelLookupData
}

export type SrDataItem = Pick<XoSr, 'uuid' | 'name_label' | 'size' | 'physical_usage' | 'usage'> & {
  pool_id: string
  pool_name: string
  /**
   * Verbatim `XoSr.SR_type` (e.g. `'linstor'`, `'lvm'`, `'nfs'`). Emitted as
   * the `sr_type` OpenMetrics label so Grafana queries can filter / split
   * by storage technology.
   */
  sr_type: string
  host_id?: string
  host_name?: string
}

export interface XoMetricsData {
  pendingTaskCount: number
  poolCount: number
  hostCount: number
  vmCount: number
  srCountByContentType: Record<string, number>
  userCount: number
  groupCount: number
  socketCount: number
  hostCountByVersion: Array<{ productBrand: string; version: string; count: number }>
  hostCountByLicense: Array<{ skuType: string; count: number }>
  backupJobStats: Array<{
    type: string
    jobCount: number
  }>
  nodeProcess: {
    eluMean: number
    eluP99: number
    eluMax: number
    memoryRssBytes: number
    memoryHeapUsedBytes: number
    memoryHeapTotalBytes: number
    memoryExternalBytes: number
    memoryArrayBuffersBytes: number
    heapSizeLimitBytes: number
    heapAvailableBytes: number
    detachedContexts: number
    cpuUserSeconds: number
    cpuSystemSeconds: number
  }
}

interface SrDataPayload {
  srs: SrDataItem[]
}

export type VdiDataItem = {
  uuid: string
  name_label: string
  size: number
  usage: number
  sr_uuid: string
  sr_name: string
  /** SR_type of the parent SR, mirrored as the `sr_type` label. */
  sr_type: string
  pool_id: string
  pool_name: string
  vm_uuid?: string
  vm_name?: string
}

interface VdiDataPayload {
  vdis: VdiDataItem[]
}

export type HostStatusItem = Pick<XoHost, 'uuid' | 'name_label' | 'power_state' | 'enabled'> & {
  pool_id: string
  pool_name: string
}

interface HostStatusPayload {
  hosts: HostStatusItem[]
}

export type VmStatusItem = Pick<XoVm, 'uuid' | 'name_label' | 'power_state'> & {
  pool_id: string
  pool_name: string
}

interface VmStatusPayload {
  vms: VmStatusItem[]
}

// Union type for all XO objects we handle
type XoObject = XoHost | XoPool | XoVm | XoVmController | XoVbd | XoVdi | XoVif | XoPif | XoSr | XoNetwork

export type { XapiCredentialsPayload, SrDataPayload, VdiDataPayload, HostStatusPayload, VmStatusPayload, XoObject }
