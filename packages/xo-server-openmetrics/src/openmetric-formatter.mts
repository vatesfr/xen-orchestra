/**
 * OpenMetrics Formatter Module
 *
 * Converts parsed RRD metrics to OpenMetrics/Prometheus format.
 * Defines metric mappings with transformations and labels.
 */

import { createLogger } from '@xen-orchestra/log'

import type {
  HostStatusItem,
  LabelLookupData,
  SrDataItem,
  VdiDataItem,
  VmStatusItem,
  XoMetricsData,
  XostorAlarmEntry,
  XostorAlarmsItem,
  XostorAlarmsPayload,
  XostorClusterItem,
  XostorPayload,
  XostorSmartDevice,
  XostorSmartHost,
  XostorSmartPayload,
  XostorUpdateItem,
  XostorUpdatePackage,
  XostorUpdatesPayload,
} from './index.mjs'
import type { ParsedMetric, ParsedRrdData } from './rrd-parser.mjs'

export type {
  HostStatusItem,
  SrDataItem,
  VdiDataItem,
  VmStatusItem,
  XoMetricsData,
  XostorAlarmEntry,
  XostorAlarmsItem,
  XostorAlarmsPayload,
  XostorClusterItem,
  XostorPayload,
  XostorSmartDevice,
  XostorSmartHost,
  XostorSmartPayload,
  XostorUpdateItem,
  XostorUpdatePackage,
  XostorUpdatesPayload,
}

const logger = createLogger('xo:xo-server-openmetrics:formatter')

// ============================================================================
// Types
// ============================================================================

/** Metric definition for transformation */
export interface MetricDefinition {
  /** Regex or string to match RRD metric name */
  test: RegExp | string
  /** OpenMetrics metric name (without xcp_ prefix) */
  openMetricName: string
  /** Metric type for OpenMetrics */
  type: 'gauge' | 'counter'
  /** Help text for the metric */
  help: string
  /** Transform RRD value to OpenMetrics value */
  transformValue?: (value: number) => number
  /** Extract additional labels from regex matches */
  extractLabels?: (matches: RegExpMatchArray) => Record<string, string>
}

/** Formatted OpenMetrics entry */
export interface FormattedMetric {
  /** Full metric name with prefix */
  name: string
  /** Help text */
  help: string
  /** Metric type */
  type: 'gauge' | 'counter'
  /** All labels */
  labels: Record<string, string>
  /** Metric value */
  value: number
  /** Timestamp in seconds (Unix epoch) per OpenMetrics specification */
  timestamp: number
}

interface HostCredentials {
  hostId: string
  hostAddress: string
  hostLabel: string
  poolId: string
  poolLabel: string
  sessionId: string
  protocol: string
}

/** Credentials payload with label context for enriching metrics */
export interface LabelContext {
  hosts: HostCredentials[]
  labels: LabelLookupData
}

// ============================================================================
// Metric Definitions
// ============================================================================

/**
 * Host metric definitions.
 *
 * Maps RRD metric names to OpenMetrics format with transformations.
 */
export const HOST_METRICS: MetricDefinition[] = [
  // Load average
  {
    test: 'loadavg',
    openMetricName: 'host_load_average',
    type: 'gauge',
    help: 'Host load average',
  },

  // Memory metrics
  {
    test: 'memory_free_kib',
    openMetricName: 'host_memory_free_bytes',
    type: 'gauge',
    help: 'Host free memory in bytes',
    transformValue: v => v * 1024,
  },
  {
    test: 'memory_total_kib',
    openMetricName: 'host_memory_total_bytes',
    type: 'gauge',
    help: 'Host total memory in bytes',
    transformValue: v => v * 1024,
  },

  // CPU metrics
  {
    test: 'cpu_avg',
    openMetricName: 'host_cpu_average',
    type: 'gauge',
    help: 'Host average CPU usage ratio',
  },
  {
    test: /^cpu(\d+)$/,
    openMetricName: 'host_cpu_core_usage',
    type: 'gauge',
    help: 'Host CPU core usage ratio',
    extractLabels: matches => ({ core: matches[1]! }),
  },

  // Aggregated network metrics (PIF)
  {
    test: 'pif_aggr_rx',
    openMetricName: 'host_network_aggregated_receive_bytes',
    type: 'gauge',
    help: 'Aggregated received bytes per second',
  },
  {
    test: 'pif_aggr_tx',
    openMetricName: 'host_network_aggregated_transmit_bytes',
    type: 'gauge',
    help: 'Aggregated transmitted bytes per second',
  },

  // Network metrics (PIF)
  {
    test: /^pif_(.+)_rx$/,
    openMetricName: 'host_network_receive_bytes_total',
    type: 'counter',
    help: 'Host network interface received bytes',
    extractLabels: matches => ({ interface: matches[1]! }),
  },
  {
    test: /^pif_(.+)_tx$/,
    openMetricName: 'host_network_transmit_bytes_total',
    type: 'counter',
    help: 'Host network interface transmitted bytes',
    extractLabels: matches => ({ interface: matches[1]! }),
  },

  // Disk IOPS metrics
  {
    test: /^iops_read_(.+)$/,
    openMetricName: 'host_disk_iops_read',
    type: 'gauge',
    help: 'Host disk read IOPS',
    extractLabels: matches => ({ sr: matches[1]! }),
  },
  {
    test: /^iops_write_(.+)$/,
    openMetricName: 'host_disk_iops_write',
    type: 'gauge',
    help: 'Host disk write IOPS',
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // Disk throughput metrics
  {
    test: /^io_throughput_read_(.+)$/,
    openMetricName: 'host_disk_throughput_read_bytes',
    type: 'gauge',
    help: 'Host disk read throughput in bytes per second',
    transformValue: v => v * Math.pow(2, 20), // MiB to bytes
    extractLabels: matches => ({ sr: matches[1]! }),
  },
  {
    test: /^io_throughput_write_(.+)$/,
    openMetricName: 'host_disk_throughput_write_bytes',
    type: 'gauge',
    help: 'Host disk write throughput in bytes per second',
    transformValue: v => v * Math.pow(2, 20), // MiB to bytes
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // Disk latency metrics
  {
    test: /^read_latency_(.+)$/,
    openMetricName: 'host_disk_read_latency_seconds',
    type: 'gauge',
    help: 'Host disk read latency in seconds',
    transformValue: v => v / 1e6, // µs to seconds
    extractLabels: matches => ({ sr: matches[1]! }),
  },
  {
    test: /^write_latency_(.+)$/,
    openMetricName: 'host_disk_write_latency_seconds',
    type: 'gauge',
    help: 'Host disk write latency in seconds',
    transformValue: v => v / 1e6, // µs to seconds
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // Disk iowait
  {
    test: /^iowait_(.+)$/,
    openMetricName: 'host_disk_iowait',
    type: 'gauge',
    help: 'Host disk IO wait ratio',
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // DCMI power reading
  {
    test: 'DCMI-power-reading',
    openMetricName: 'host_power_consumption_watts',
    type: 'gauge',
    help: 'Host power consumption in watts (DCMI)',
  },

  // Normalized host load
  {
    test: 'hostload',
    openMetricName: 'host_load',
    type: 'gauge',
    help: 'Normalized host load',
  },

  // Reclaimed memory metrics
  {
    test: 'memory_reclaimed',
    openMetricName: 'host_memory_reclaimed_bytes',
    type: 'gauge',
    help: 'Reclaimed host memory in bytes',
    transformValue: v => v * 1024, // KiB to bytes
  },
  {
    test: 'memory_reclaimed_max',
    openMetricName: 'host_memory_reclaimed_max_bytes',
    type: 'gauge',
    help: 'Maximum reclaimable host memory in bytes',
    transformValue: v => v * 1024, // KiB to bytes
  },

  // Running vCPUs
  {
    test: 'running_vcpus',
    openMetricName: 'host_running_vcpus',
    type: 'gauge',
    help: 'Total number of running vCPUs',
  },

  // Total disk IOPS per SR
  {
    test: /^iops_total_(.+)$/,
    openMetricName: 'host_disk_iops_total',
    type: 'gauge',
    help: 'Total IOPS (read + write) per SR',
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // Total disk throughput per SR
  {
    test: /^io_throughput_total_(.+)$/,
    openMetricName: 'host_disk_throughput_total_bytes',
    type: 'gauge',
    help: 'Total I/O throughput per SR in bytes per second',
    transformValue: v => v * Math.pow(2, 20), // MiB to bytes
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // Combined disk latency per SR
  {
    test: /^latency_(.+)$/,
    openMetricName: 'host_disk_latency_seconds',
    type: 'gauge',
    help: 'Combined I/O latency per SR in seconds',
    transformValue: v => v / 1e6, // µs to seconds
    extractLabels: matches => ({ sr: matches[1]! }),
  },
]

/**
 * VM metric definitions.
 *
 * Maps RRD metric names to OpenMetrics format with transformations.
 */
export const VM_METRICS: MetricDefinition[] = [
  // Memory metrics
  {
    test: /memory$/,
    openMetricName: 'vm_memory_bytes',
    type: 'gauge',
    help: 'VM memory usage in bytes',
  },
  {
    test: 'memory_internal_free',
    openMetricName: 'vm_memory_internal_free_bytes',
    type: 'gauge',
    help: 'VM internal free memory in bytes',
    transformValue: v => v * 1024,
  },
  {
    test: 'memory_target',
    openMetricName: 'vm_memory_target_bytes',
    type: 'gauge',
    help: 'VM memory target in bytes',
  },

  // CPU metrics
  {
    test: 'cpu_usage',
    openMetricName: 'vm_cpu_usage',
    type: 'gauge',
    help: 'VM CPU usage ratio',
  },
  {
    test: /^cpu(\d+)$/,
    openMetricName: 'vm_cpu_core_usage',
    type: 'gauge',
    help: 'VM CPU core usage ratio',
    extractLabels: matches => ({ core: matches[1]! }),
  },

  // Runstate metrics
  {
    test: 'runstate_fullrun',
    openMetricName: 'vm_runstate_fullrun',
    type: 'gauge',
    help: 'VM runstate fullrun ratio',
  },
  {
    test: 'runstate_full_contention',
    openMetricName: 'vm_runstate_full_contention',
    type: 'gauge',
    help: 'VM runstate full contention ratio',
  },
  {
    test: 'runstate_partial_run',
    openMetricName: 'vm_runstate_partial_run',
    type: 'gauge',
    help: 'VM runstate partial run ratio',
  },
  {
    test: 'runstate_partial_contention',
    openMetricName: 'vm_runstate_partial_contention',
    type: 'gauge',
    help: 'VM runstate partial contention ratio',
  },
  {
    test: 'runstate_concurrency_hazard',
    openMetricName: 'vm_runstate_concurrency_hazard',
    type: 'gauge',
    help: 'VM runstate concurrency hazard ratio',
  },
  {
    test: 'runstate_blocked',
    openMetricName: 'vm_runstate_blocked',
    type: 'gauge',
    help: 'VM runstate blocked ratio',
  },

  // Network metrics (VIF)
  {
    test: /^vif_(\d+)_rx$/,
    openMetricName: 'vm_network_receive_bytes_total',
    type: 'counter',
    help: 'VM network interface received bytes',
    extractLabels: matches => ({ vif: matches[1]! }),
  },
  {
    test: /^vif_(\d+)_tx$/,
    openMetricName: 'vm_network_transmit_bytes_total',
    type: 'counter',
    help: 'VM network interface transmitted bytes',
    extractLabels: matches => ({ vif: matches[1]! }),
  },
  {
    test: /^vif_(\d+)_rx_errors$/,
    openMetricName: 'vm_network_receive_errors_total',
    type: 'counter',
    help: 'VM network interface receive errors',
    extractLabels: matches => ({ vif: matches[1]! }),
  },
  {
    test: /^vif_(\d+)_tx_errors$/,
    openMetricName: 'vm_network_transmit_errors_total',
    type: 'counter',
    help: 'VM network interface transmit errors',
    extractLabels: matches => ({ vif: matches[1]! }),
  },

  // Disk read/write bytes (VBD)
  {
    test: /^vbd_xvd(.)_read$/,
    openMetricName: 'vm_disk_read_bytes_total',
    type: 'counter',
    help: 'VM disk read bytes',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_write$/,
    openMetricName: 'vm_disk_write_bytes_total',
    type: 'counter',
    help: 'VM disk write bytes',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },

  // Disk IOPS (VBD)
  {
    test: /^vbd_xvd(.)_iops_read$/,
    openMetricName: 'vm_disk_iops_read',
    type: 'gauge',
    help: 'VM disk read IOPS',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_iops_write$/,
    openMetricName: 'vm_disk_iops_write',
    type: 'gauge',
    help: 'VM disk write IOPS',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_iops_total$/,
    openMetricName: 'vm_disk_iops_total',
    type: 'gauge',
    help: 'VM disk total IOPS',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },

  // Disk latency (VBD)
  {
    test: /^vbd_xvd(.)_read_latency$/,
    openMetricName: 'vm_disk_read_latency_seconds',
    type: 'gauge',
    help: 'VM disk read latency in seconds',
    transformValue: v => v / 1e6, // µs to seconds
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_write_latency$/,
    openMetricName: 'vm_disk_write_latency_seconds',
    type: 'gauge',
    help: 'VM disk write latency in seconds',
    transformValue: v => v / 1e6, // µs to seconds
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },

  // Disk throughput (VBD)
  {
    test: /^vbd_xvd(.)_io_throughput_read$/,
    openMetricName: 'vm_disk_throughput_read_bytes',
    type: 'gauge',
    help: 'VM disk read throughput in bytes per second',
    transformValue: v => v * 2 ** 20, // MiB/s to bytes/s
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_io_throughput_write$/,
    openMetricName: 'vm_disk_throughput_write_bytes',
    type: 'gauge',
    help: 'VM disk write throughput in bytes per second',
    transformValue: v => v * 2 ** 20, // MiB/s to bytes/s
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_io_throughput_total$/,
    openMetricName: 'vm_disk_throughput_total_bytes',
    type: 'gauge',
    help: 'VM disk total throughput in bytes per second',
    transformValue: v => v * 2 ** 20, // MiB/s to bytes/s
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },

  // Disk average latency (VBD)
  {
    test: /^vbd_xvd(.)_latency$/,
    openMetricName: 'vm_disk_latency_seconds',
    type: 'gauge',
    help: 'VM disk average IO latency in seconds',
    transformValue: v => v / 1e6, // µs to seconds
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },

  // Disk other metrics (VBD)
  {
    test: /^vbd_xvd(.)_iowait$/,
    openMetricName: 'vm_disk_iowait',
    type: 'gauge',
    help: 'VM disk IO wait ratio',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_inflight$/,
    openMetricName: 'vm_disk_inflight',
    type: 'gauge',
    help: 'VM disk inflight operations',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_avgqu_sz$/,
    openMetricName: 'vm_disk_queue_size',
    type: 'gauge',
    help: 'VM disk average queue size',
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
]

/**
 * SR capacity metric definitions.
 *
 * These metrics are derived from XO SR objects, not RRD data.
 * They provide storage capacity information for monitoring.
 */
export const SR_METRICS: MetricDefinition[] = [
  {
    test: 'virtual_size',
    openMetricName: 'sr_virtual_size_bytes',
    type: 'gauge',
    help: 'SR virtual allocated size in bytes',
  },
  {
    test: 'physical_size',
    openMetricName: 'sr_physical_size_bytes',
    type: 'gauge',
    help: 'SR physical size in bytes',
  },
  {
    test: 'physical_usage',
    openMetricName: 'sr_physical_usage_bytes',
    type: 'gauge',
    help: 'SR physical space used in bytes',
  },
]

/**
 * VDI disk metric definitions.
 *
 * These metrics are derived from XO VDI objects, not RRD data.
 * They provide per-VDI disk size information for monitoring.
 */
export const VDI_METRICS: MetricDefinition[] = [
  {
    test: 'virtual_size',
    openMetricName: 'vdi_virtual_size_bytes',
    type: 'gauge',
    help: 'VDI virtual size in bytes',
  },
  {
    test: 'physical_usage',
    openMetricName: 'vdi_physical_usage_bytes',
    type: 'gauge',
    help: 'VDI physical space used in bytes (allocated on SR)',
  },
]

// ============================================================================
// Metric Matching Functions
// ============================================================================

/**
 * Test if a metric name matches a definition.
 *
 * @param metricName - RRD metric name
 * @param test - String or regex to test against
 * @returns RegExpMatchArray if matched with regex, true if string match, null otherwise
 */
function testMetric(metricName: string, test: string | RegExp): RegExpMatchArray | boolean | null {
  if (typeof test === 'string') {
    return metricName === test ? true : null
  }
  return test.exec(metricName)
}

/**
 * Find matching metric definition for a given RRD metric name.
 *
 * @param metricName - RRD metric name
 * @param objectType - Object type: 'host' or 'vm'
 * @returns Matching definition with regex matches, or null
 */
export function findMetricDefinition(
  metricName: string,
  objectType: 'host' | 'vm' | 'sr'
): { definition: MetricDefinition; matches: RegExpMatchArray | null } | null {
  const definitions = objectType === 'host' ? HOST_METRICS : objectType === 'vm' ? VM_METRICS : []

  for (const definition of definitions) {
    const result = testMetric(metricName, definition.test)

    if (result !== null) {
      // If result is true (string match), convert to null for matches
      const matches = result === true ? null : (result as RegExpMatchArray)
      return { definition, matches }
    }
  }

  return null
}

// ============================================================================
// CPU Usage Fallback
// ============================================================================

/**
 * Compute vm_cpu_usage from per-core metrics when cpu_usage is not available.
 *
 * Some VMs (particularly on XCP-ng 8.2) don't report a single cpu_usage metric,
 * but they do report individual per-core CPU metrics (cpu0, cpu1, cpu2, etc.).
 * This function creates synthetic vm_cpu_usage metrics by averaging the per-core values.
 *
 * @param metrics - Array of formatted metrics
 * @returns Array of synthetic vm_cpu_usage metrics for VMs missing the native metric
 */
function computeVmCpuUsageFallback(metrics: FormattedMetric[]): FormattedMetric[] {
  // Track VMs that have vm_cpu_usage
  const vmsWithCpuUsage = new Set<string>()

  // Track per-core metrics by VM UUID: { uuid -> { timestamp -> { core -> value } } }
  const vmCoreMetrics = new Map<string, Map<number, Map<string, { value: number; metric: FormattedMetric }>>>()

  for (const metric of metrics) {
    const vmUuid = metric.labels.uuid
    if (metric.labels.type !== 'vm' || vmUuid === undefined) {
      continue
    }

    if (metric.name === 'xcp_vm_cpu_usage') {
      vmsWithCpuUsage.add(vmUuid)
    } else if (metric.name === 'xcp_vm_cpu_core_usage' && metric.labels.core !== undefined) {
      // Store per-core metrics grouped by VM and timestamp
      let vmTimestamps = vmCoreMetrics.get(vmUuid)
      if (vmTimestamps === undefined) {
        vmTimestamps = new Map()
        vmCoreMetrics.set(vmUuid, vmTimestamps)
      }

      let coreValues = vmTimestamps.get(metric.timestamp)
      if (coreValues === undefined) {
        coreValues = new Map()
        vmTimestamps.set(metric.timestamp, coreValues)
      }

      coreValues.set(metric.labels.core, { value: metric.value, metric })
    }
  }

  // Generate synthetic vm_cpu_usage for VMs that don't have the native metric
  const syntheticMetrics: FormattedMetric[] = []

  for (const [vmUuid, timestamps] of vmCoreMetrics) {
    // Skip VMs that already have cpu_usage
    if (vmsWithCpuUsage.has(vmUuid)) {
      continue
    }

    // For each timestamp, compute average of all cores
    for (const [timestamp, coreValues] of timestamps) {
      if (coreValues.size === 0) {
        continue
      }

      // Calculate average CPU usage across all cores
      let sum = 0
      for (const { value } of coreValues.values()) {
        sum += value
      }
      const averageUsage = sum / coreValues.size

      // Get a sample metric to copy labels from (without core label)
      const [sampleEntry] = coreValues.values()
      if (sampleEntry === undefined) {
        continue
      }
      const sampleMetric = sampleEntry.metric

      // Create synthetic metric with same labels (excluding core)
      const labels: Record<string, string> = {}
      for (const [key, value] of Object.entries(sampleMetric.labels)) {
        if (key !== 'core') {
          labels[key] = value
        }
      }

      syntheticMetrics.push({
        name: 'xcp_vm_cpu_usage',
        help: 'VM CPU usage ratio (computed from per-core average)',
        type: 'gauge',
        labels,
        value: averageUsage,
        timestamp,
      })
    }
  }

  if (syntheticMetrics.length > 0) {
    logger.debug('Generated synthetic vm_cpu_usage metrics', {
      count: syntheticMetrics.length,
      vms: [...new Set(syntheticMetrics.map(m => m.labels.uuid))],
    })
  }

  return syntheticMetrics
}

function emitHostPowerMetrics(
  metrics: FormattedMetric[],
  hostPowerWatts: Record<string, number> | undefined,
  labelContext?: LabelContext
): void {
  if (hostPowerWatts === undefined) {
    return
  }

  for (const [hostId, watts] of Object.entries(hostPowerWatts)) {
    // Drop any existing host power series for this host (dedup, IPMI preferred).
    for (let i = metrics.length - 1; i >= 0; i--) {
      const m = metrics[i]
      if (m !== undefined && m.name === 'xcp_host_power_consumption_watts' && m.labels.uuid === hostId) {
        metrics.splice(i, 1)
      }
    }

    const labels: Record<string, string> = { uuid: hostId, type: 'host', source: 'ipmi' }
    const hostName = labelContext?.labels.hosts[hostId]?.name_label
    if (hostName !== undefined && hostName !== '') {
      labels.host_name = hostName
    }

    metrics.push({
      name: 'xcp_host_power_consumption_watts',
      help: 'Host power consumption in watts (IPMI)',
      type: 'gauge',
      labels,
      value: watts,
      timestamp: Math.floor(Date.now() / 1000),
    })
  }
}

function computeVmPowerConsumption(metrics: FormattedMetric[], labelContext?: LabelContext): FormattedMetric[] {
  // Labels carried by per-resource VM metrics that must not leak onto the
  // aggregate per-VM power series.
  const PER_RESOURCE_LABELS = new Set([
    'core',
    'device',
    'vdi_name',
    'sr_name',
    'sr_type',
    'vif',
    'network_name',
    'interface',
  ])

  const hostPower = new Map<string, { watts: number; timestamp: number }>()
  const guestsByHost = new Map<string, Map<string, FormattedMetric>>() // hostId -> vmUuid -> representative metric
  const cpuByVm = new Map<string, { value: number; timestamp: number }>()

  for (const metric of metrics) {
    const { labels } = metric
    if (labels.uuid === undefined) {
      continue
    }

    if (labels.type === 'host' && metric.name === 'xcp_host_power_consumption_watts') {
      hostPower.set(labels.uuid, { watts: metric.value, timestamp: metric.timestamp })
      continue
    }

    if (labels.type !== 'vm') {
      continue
    }
    const hostId = labels.host_id
    // No residence host or dom0 → takes no share.
    if (hostId === undefined || hostId === '' || labels.is_control_domain === 'true') {
      continue
    }

    let guests = guestsByHost.get(hostId)
    if (guests === undefined) {
      guests = new Map()
      guestsByHost.set(hostId, guests)
    }
    if (!guests.has(labels.uuid)) {
      guests.set(labels.uuid, metric)
    }

    if (metric.name === 'xcp_vm_cpu_usage') {
      cpuByVm.set(labels.uuid, { value: metric.value, timestamp: metric.timestamp })
    }
  }

  const out: FormattedMetric[] = []

  for (const [hostId, power] of hostPower) {
    const guests = guestsByHost.get(hostId)
    if (guests === undefined || guests.size === 0) {
      continue
    }

    const loadByVm = new Map<string, { load: number; complete: boolean }>()
    let totalLoad = 0
    for (const vmUuid of guests.keys()) {
      const cpu = cpuByVm.get(vmUuid)?.value
      const vcpus = labelContext?.labels.vms[vmUuid]?.vcpus ?? 1
      const load = (cpu ?? 0) * vcpus
      loadByVm.set(vmUuid, { load, complete: cpu !== undefined })
      totalLoad += load
    }

    const equalSplit = totalLoad < 0.01

    for (const [vmUuid, representative] of guests) {
      const entry = loadByVm.get(vmUuid)
      const load = entry?.load ?? 0
      const watts = equalSplit ? power.watts / guests.size : (power.watts * load) / totalLoad

      const labels: Record<string, string> = {}
      for (const [key, value] of Object.entries(representative.labels)) {
        if (!PER_RESOURCE_LABELS.has(key)) {
          labels[key] = value
        }
      }
      labels.estimate = 'true'
      if (entry?.complete === false) {
        labels.data_complete = 'false'
      }

      out.push({
        name: 'xcp_vm_power_consumption_watts',
        help: 'Estimated VM power consumption in watts (estimate, host power split by CPU load)',
        type: 'gauge',
        labels,
        value: watts,
        timestamp: cpuByVm.get(vmUuid)?.timestamp ?? power.timestamp,
      })
    }
  }

  return out
}

// ============================================================================
// Formatting Functions
// ============================================================================

/** OpenMetrics prefix for XCP/XAPI-level metrics */
const METRIC_PREFIX = 'xcp'

/** OpenMetrics prefix for XO management plane metrics */
const XO_METRIC_PREFIX = 'xo'

/**
 * Serialize XO object tags into the `tags` label value
 *
 * @param tags - Raw tag list from the XO object
 * @returns Comma-separated, sorted tag list (e.g. `"prod,web"`)
 */
export function serializeTags(tags: readonly string[] | undefined): string {
  if (tags === undefined || tags.length === 0) {
    return ''
  }
  return [...new Set(tags)]
    .filter(tag => tag.trim() !== '')
    .sort()
    .join(',')
}

function addTagsLabel(labels: Record<string, string>, tags: readonly string[] | undefined): void {
  const serialized = serializeTags(tags)
  if (serialized !== '') {
    labels.tags = serialized
  }
}

/**
 * Escape special characters in label values.
 *
 * OpenMetrics requires escaping of backslash, double quote, and newline.
 *
 * @param value - Label value to escape
 * @returns Escaped label value
 */
function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

/**
 * Format labels as OpenMetrics label string.
 *
 * @param labels - Label key-value pairs
 * @returns Formatted label string (e.g., `{pool_id="abc",uuid="def"}`)
 */
function formatLabels(labels: Record<string, string>): string {
  const pairs = Object.entries(labels)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}="${escapeLabelValue(value)}"`)

  return pairs.length > 0 ? `{${pairs.join(',')}}` : ''
}

/**
 * Transform a parsed metric to a formatted OpenMetrics entry.
 *
 * @param metric - Parsed metric from RRD
 * @param poolId - Pool UUID
 * @param labelContext - Optional label context for enriching metrics with human-readable names
 * @returns FormattedMetric or null if no matching definition or null value
 */
export function transformMetric(
  metric: ParsedMetric,
  poolId: string,
  labelContext?: LabelContext,
  hostId?: string
): FormattedMetric | null {
  const { legend, value, timestamp } = metric

  // Skip null values (NaN/Infinity)
  if (value === null) {
    return null
  }

  // Find matching metric definition
  const match = findMetricDefinition(legend.metricName, legend.objectType)

  if (match === null) {
    return null
  }

  const { definition, matches } = match

  // Apply value transformation if defined
  const transformedValue = definition.transformValue !== undefined ? definition.transformValue(value) : value

  // Extract labels from regex matches first (we need them for name lookups)
  const extractedLabels: Record<string, string> = {}
  if (matches !== null && definition.extractLabels !== undefined) {
    Object.assign(extractedLabels, definition.extractLabels(matches))
  }

  // Build base labels
  const labels: Record<string, string> = {
    pool_id: poolId,
    uuid: legend.uuid,
    type: legend.objectType,
  }

  if (legend.objectType === 'vm' && hostId !== undefined && hostId !== '') {
    labels.host_id = hostId
  }

  let objectTags: readonly string[] | undefined

  // Add pool_name from host credentials
  if (labelContext !== undefined) {
    const hostCred = labelContext.hosts.find(h => h.poolId === poolId)
    if (hostCred !== undefined && hostCred.poolLabel !== '') {
      labels.pool_name = hostCred.poolLabel
    }

    // Add type-specific human-readable labels
    if (legend.objectType === 'host') {
      const hostInfo = labelContext.labels.hosts[legend.uuid]
      if (hostInfo !== undefined) {
        if (hostInfo.name_label !== '') {
          labels.host_name = hostInfo.name_label
        }
        objectTags = hostInfo.tags

        // For PIF metrics, add network_name
        if (extractedLabels.interface !== undefined) {
          const networkName = hostInfo.pifDeviceToNetworkName[extractedLabels.interface]
          if (networkName !== undefined && networkName !== '') {
            labels.network_name = networkName
          }
        }

        // For SR metrics (iops, throughput, latency), resolve sr suffix to sr_name
        if (extractedLabels.sr !== undefined) {
          const srSuffix = extractedLabels.sr
          // Try to find the full SR UUID from the suffix
          const srUuid = labelContext.labels.srTruncatedToUuid[srSuffix]
          if (srUuid !== undefined) {
            const srInfo = labelContext.labels.srs[srUuid]
            if (srInfo !== undefined) {
              if (srInfo.name_label !== '') {
                labels.sr_name = srInfo.name_label
              }
              if (srInfo.SR_type !== '') {
                labels.sr_type = srInfo.SR_type
              }
            }
          }
        }
      }
    }

    if (legend.objectType === 'vm') {
      if (hostId !== undefined && hostId !== '') {
        const residentHost = labelContext.labels.hosts[hostId]
        if (residentHost !== undefined && residentHost.name_label !== '') {
          labels.host_name = residentHost.name_label
        }
      }
      const vmInfo = labelContext.labels.vms[legend.uuid]
      if (vmInfo !== undefined) {
        if (vmInfo.name_label !== '') {
          labels.vm_name = vmInfo.name_label
        }
        labels.is_control_domain = vmInfo.is_control_domain ? 'true' : 'false'
        objectTags = vmInfo.tags

        // For VBD metrics, add vdi_name and sr_name
        if (extractedLabels.device !== undefined) {
          const vdiName = vmInfo.vbdDeviceToVdiName[extractedLabels.device]
          if (vdiName !== undefined && vdiName !== '') {
            labels.vdi_name = vdiName
          }

          // Resolve sr_name and sr_type via device → VDI UUID → SR UUID → SR info
          const vdiUuid = vmInfo.vbdDeviceToVdiUuid[extractedLabels.device]
          if (vdiUuid !== undefined) {
            const srUuid = labelContext.labels.vdiUuidToSrUuid[vdiUuid]
            if (srUuid !== undefined) {
              const srInfo = labelContext.labels.srs[srUuid]
              if (srInfo !== undefined) {
                if (srInfo.name_label !== '') {
                  labels.sr_name = srInfo.name_label
                }
                if (srInfo.SR_type !== '') {
                  labels.sr_type = srInfo.SR_type
                }
              }
            }
          }
        }

        // For VIF metrics, add network_name
        if (extractedLabels.vif !== undefined) {
          const networkName = vmInfo.vifIndexToNetworkName[extractedLabels.vif]
          if (networkName !== undefined && networkName !== '') {
            labels.network_name = networkName
          }
        }
      }
    }
  }

  // Add extracted labels (device, interface, vif, sr, core)
  Object.assign(labels, extractedLabels)
  addTagsLabel(labels, objectTags)

  return {
    name: `${METRIC_PREFIX}_${definition.openMetricName}`,
    help: definition.help,
    type: definition.type,
    labels,
    value: transformedValue,
    timestamp,
  }
}

/**
 * Group formatted metrics by metric name.
 *
 * This is needed to output HELP/TYPE declarations only once per metric.
 *
 * @param metrics - Array of formatted metrics
 * @returns Map of metric name to array of metrics
 */
function groupMetricsByName(metrics: FormattedMetric[]): Map<string, FormattedMetric[]> {
  const grouped = new Map<string, FormattedMetric[]>()

  for (const metric of metrics) {
    const existing = grouped.get(metric.name)
    if (existing !== undefined) {
      existing.push(metric)
    } else {
      grouped.set(metric.name, [metric])
    }
  }

  return grouped
}

/**
 * Format an array of metrics to OpenMetrics text format.
 *
 * @param metrics - Array of formatted metrics
 * @returns OpenMetrics-formatted string
 */
export function formatToOpenMetrics(metrics: FormattedMetric[]): string {
  if (metrics.length === 0) {
    return ''
  }

  const grouped = groupMetricsByName(metrics)
  const lines: string[] = []

  for (const [name, metricsForName] of grouped) {
    // Output HELP and TYPE only once per metric name
    const first = metricsForName[0]
    if (first === undefined) continue
    lines.push(`# HELP ${name} ${first.help}`)
    lines.push(`# TYPE ${name} ${first.type}`)

    // Output all metric values
    for (const metric of metricsForName) {
      const labelsStr = formatLabels(metric.labels)
      lines.push(`${metric.name}${labelsStr} ${metric.value} ${metric.timestamp}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format all RRD data from multiple pools to OpenMetrics.
 *
 * @param rrdDataList - Array of ParsedRrdData from all pools
 * @param labelContext - Optional label context for enriching metrics with human-readable names
 * @param hostPowerWatts - Optional map of host UUID -> power draw in watts (IPMI)
 * @returns Complete OpenMetrics output string with EOF marker
 */
export function formatAllPoolsToOpenMetrics(
  rrdDataList: ParsedRrdData[],
  labelContext?: LabelContext,
  hostPowerWatts?: Record<string, number>
): string {
  const allMetrics: FormattedMetric[] = []
  const unmatchedMetrics: Set<string> = new Set()

  for (const rrdData of rrdDataList) {
    for (const metric of rrdData.metrics) {
      const formatted = transformMetric(metric, rrdData.poolId, labelContext, rrdData.hostId)
      if (formatted !== null) {
        allMetrics.push(formatted)
      } else if (metric.value !== null) {
        // Track unmatched metrics that have valid values (not null due to NaN/Infinity)
        unmatchedMetrics.add(`${metric.legend.objectType}:${metric.legend.metricName}`)
      }
    }
  }

  // Log unmatched metrics for debugging (this helps identify missing metric definitions)
  if (unmatchedMetrics.size > 0) {
    logger.debug('Unmatched RRD metrics', { metrics: Array.from(unmatchedMetrics).sort() })
  }

  emitHostPowerMetrics(allMetrics, hostPowerWatts, labelContext)

  // Compute fallback vm_cpu_usage for VMs that don't have the native metric
  // This handles XCP-ng 8.2 and other versions that only report per-core metrics
  const syntheticCpuMetrics = computeVmCpuUsageFallback(allMetrics)
  allMetrics.push(...syntheticCpuMetrics)
  allMetrics.push(...computeVmPowerConsumption(allMetrics, labelContext))

  // Sort metrics by name for consistent output
  allMetrics.sort((a, b) => {
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name)
    }
    // Sort by labels for same metric name
    return JSON.stringify(a.labels).localeCompare(JSON.stringify(b.labels))
  })

  const output = formatToOpenMetrics(allMetrics)

  // Add EOF marker as per OpenMetrics specification
  // Return empty string if no metrics (caller handles EOF)
  return output !== '' ? `${output}\n# EOF` : ''
}

/**
 * Format SR capacity metrics to OpenMetrics format.
 *
 * Creates FormattedMetric entries for each SR's capacity metrics:
 * - virtual_size (usage/virtual_allocation)
 * - physical_size (size)
 * - physical_usage
 *
 * For local (non-shared) SRs, host_id and host_name labels are included.
 *
 * @param srDataList - Array of SR data with capacity information
 * @returns Array of FormattedMetric entries for SR capacity
 */
export function formatSrMetrics(srDataList: SrDataItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const sr of srDataList) {
    const baseLabels: Record<string, string> = {
      pool_id: sr.pool_id,
      sr_uuid: sr.uuid,
      sr_name: sr.name_label,
    }

    if (sr.pool_name !== '') {
      baseLabels.pool_name = sr.pool_name
    }
    if (sr.sr_type !== '') {
      baseLabels.sr_type = sr.sr_type
    }

    // For local SRs, add host information
    if (sr.host_id !== undefined) {
      baseLabels.host_id = sr.host_id
    }
    if (sr.host_name !== undefined) {
      baseLabels.host_name = sr.host_name
    }

    addTagsLabel(baseLabels, sr.tags)

    // Virtual size (virtual_allocation)
    metrics.push({
      name: `${METRIC_PREFIX}_sr_virtual_size_bytes`,
      help: 'SR virtual allocated size in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: sr.usage,
      timestamp,
    })

    // Physical size
    metrics.push({
      name: `${METRIC_PREFIX}_sr_physical_size_bytes`,
      help: 'SR physical size in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: sr.size,
      timestamp,
    })

    // Physical usage
    metrics.push({
      name: `${METRIC_PREFIX}_sr_physical_usage_bytes`,
      help: 'SR physical space used in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: sr.physical_usage,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format VDI disk size metrics.
 *
 * Creates two FormattedMetric entries per VDI:
 * - virtual_size_bytes (virtual disk size)
 * - physical_usage_bytes (actual space allocated on SR)
 *
 * Labels include pool, SR, VDI identifiers, and optionally VM info if attached.
 *
 * @param vdiDataList - Array of VDI data with size information
 * @returns Array of FormattedMetric entries for VDI disk sizes
 */
export function formatVdiMetrics(vdiDataList: VdiDataItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const vdi of vdiDataList) {
    const baseLabels: Record<string, string> = {
      pool_id: vdi.pool_id,
      sr_uuid: vdi.sr_uuid,
      sr_name: vdi.sr_name,
      vdi_uuid: vdi.uuid,
      vdi_name: vdi.name_label,
    }

    if (vdi.pool_name !== '') {
      baseLabels.pool_name = vdi.pool_name
    }
    if (vdi.sr_type !== '') {
      baseLabels.sr_type = vdi.sr_type
    }

    // Add VM labels if VDI is attached to a VM
    if (vdi.vm_uuid !== undefined) {
      baseLabels.vm_uuid = vdi.vm_uuid
    }
    if (vdi.vm_name !== undefined) {
      baseLabels.vm_name = vdi.vm_name
    }

    // Virtual size
    metrics.push({
      name: `${METRIC_PREFIX}_vdi_virtual_size_bytes`,
      help: 'VDI virtual size in bytes',
      type: 'gauge',
      labels: { ...baseLabels },
      value: vdi.size,
      timestamp,
    })

    // Physical usage (allocated on SR)
    metrics.push({
      name: `${METRIC_PREFIX}_vdi_physical_usage_bytes`,
      help: 'VDI physical space used in bytes (allocated on SR)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: vdi.usage,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format host status metrics.
 *
 * Creates one FormattedMetric per host with power_state and enabled labels.
 *
 * @param hostStatusList - Array of host status data
 * @returns Array of FormattedMetric entries for host status
 */
export function formatHostStatusMetrics(hostStatusList: HostStatusItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const host of hostStatusList) {
    const labels: Record<string, string> = {
      pool_id: host.pool_id,
      uuid: host.uuid,
      host_name: host.name_label,
      power_state: host.power_state,
      enabled: String(host.enabled),
    }

    if (host.pool_name !== '') {
      labels.pool_name = host.pool_name
    }

    addTagsLabel(labels, host.tags)

    metrics.push({
      name: `${METRIC_PREFIX}_host_status`,
      help: 'Host status (1 = current state)',
      type: 'gauge',
      labels,
      value: 1,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format VM status metrics.
 *
 * Creates one FormattedMetric per VM with power_state label.
 *
 * @param vmStatusList - Array of VM status data
 * @returns Array of FormattedMetric entries for VM status
 */
export function formatVmStatusMetrics(vmStatusList: VmStatusItem[]): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  for (const vm of vmStatusList) {
    const labels: Record<string, string> = {
      pool_id: vm.pool_id,
      uuid: vm.uuid,
      power_state: vm.power_state,
    }

    if (vm.pool_name !== '') {
      labels.pool_name = vm.pool_name
    }

    if (vm.name_label !== '') {
      labels.vm_name = vm.name_label
    }

    addTagsLabel(labels, vm.tags)

    metrics.push({
      name: `${METRIC_PREFIX}_vm_status`,
      help: 'VM power state indicator (always 1; current state is carried by the power_state label)',
      type: 'gauge',
      labels,
      value: 1,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format XOSTOR cluster metrics derived from `linstor-manager.healthCheck`.
 *
 * Produces three metric families per detected LINSTOR-backed SR:
 *  - `xcp_xostor_up` (gauge): 1 when healthCheck succeeded, 0 otherwise.
 *    Acts as a collection-health signal so a silently-failing cluster shows
 *    up on the dashboard instead of disappearing.
 *  - `xcp_xostor_node_status` (gauge, value = 1): one entry per LINSTOR node,
 *    with `role` (master|satellite) and `state` labels. Following the same
 *    pattern as `xcp_host_status`, the actual state is carried by the label
 *    rather than encoded as a numeric value.
 *  - `xcp_xostor_resource_total` (gauge): total count of LINSTOR resources
 *    in the cluster — Phase 1 analogue of the proposed OSD count.
 */
export function formatXostorClusterMetrics(payload: XostorPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.clusters.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const cluster of payload.clusters) {
    const baseLabels: Record<string, string> = {
      sr_uuid: cluster.sr_uuid,
      pool_id: cluster.pool_id,
    }
    if (cluster.pool_name !== '') {
      baseLabels.pool_name = cluster.pool_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_up`,
      help: 'XOSTOR cluster reachability (1 = healthCheck succeeded, 0 = collection failed)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: cluster.up ? 1 : 0,
      timestamp,
    })

    for (const node of cluster.nodes) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_node_status`,
        help: 'XOSTOR cluster node status (always 1; current state is carried by the role and state labels)',
        type: 'gauge',
        labels: {
          ...baseLabels,
          node_name: node.node_name,
          role: node.role,
          state: node.state,
        },
        value: 1,
        timestamp,
      })
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_resource_total`,
      help: 'Total number of LINSTOR resources defined in the XOSTOR cluster',
      type: 'gauge',
      labels: { ...baseLabels },
      value: cluster.resourceCount,
      timestamp,
    })

    for (const [state, count] of Object.entries(cluster.replicaStates)) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_resource_state_count`,
        help: 'Number of LINSTOR resource replicas in each disk-state across the XOSTOR cluster',
        type: 'gauge',
        labels: { ...baseLabels, state },
        value: count,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XOSTOR active alarm metrics derived from XAPI messages.
 *
 * Two metric families per cluster:
 *  - `xcp_xostor_alarms_up` (gauge): 1 when alarm collection succeeded, 0
 *    otherwise. Mirrors the per-feature collection-status pattern used by
 *    Phase 1's `xcp_xostor_up`.
 *  - `xcp_xostor_alarms_count` (gauge): one series per
 *    (cluster, alarm_name, target_type) carrying the number of matching
 *    XAPI messages. Buckets with zero count are not emitted; their absence
 *    means "no such alarm currently raised".
 *
 * Designed so PromQL alerting rules can express
 * `sum by (sr_uuid) (xcp_xostor_alarms_count) > 0` without per-host knowledge.
 */
export function formatXostorAlarmsMetrics(payload: XostorAlarmsPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.clusters.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const cluster of payload.clusters) {
    const baseLabels: Record<string, string> = {
      sr_uuid: cluster.sr_uuid,
      pool_id: cluster.pool_id,
    }
    if (cluster.pool_name !== '') {
      baseLabels.pool_name = cluster.pool_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_alarms_up`,
      help: 'XOSTOR alarm collection success (1 = collected, 0 = collection failed)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: cluster.up ? 1 : 0,
      timestamp,
    })

    for (const entry of cluster.entries) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_alarms_count`,
        help: 'Number of active XAPI alarm messages targeting a XOSTOR SR or one of its hosts',
        type: 'gauge',
        labels: {
          ...baseLabels,
          alarm_name: entry.alarm_name,
          target_type: entry.target_type,
        },
        value: entry.count,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XOSTOR per-host SMART health metrics derived from `smartctl.py`.
 *
 * Two metric families per XOSTOR host:
 *  - `xcp_xostor_smart_up` (gauge): 1 when the plugin returned data, 0 when
 *    the plugin call failed or `smartctl.py` is not installed on the host.
 *    Always emitted so absence is unambiguous.
 *  - `xcp_xostor_disk_smart_status` (gauge, value=1): one series per
 *    (host, device) carrying the overall-health string as a `status` label.
 *    Following the same pattern as `xcp_host_status` and
 *    `xcp_xostor_node_status`, the actual state lives in a label rather
 *    than the value.
 *
 * The host scope is "every host backing a XOSTOR PBD" — non-XOSTOR disks
 * on these hosts are still relevant because a boot disk failure removes
 * the node from the cluster.
 */
export function formatXostorSmartMetrics(payload: XostorSmartPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.hosts.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const host of payload.hosts) {
    const baseLabels: Record<string, string> = {
      sr_uuid: host.sr_uuid,
      pool_id: host.pool_id,
      host_uuid: host.host_uuid,
    }
    if (host.pool_name !== '') {
      baseLabels.pool_name = host.pool_name
    }
    if (host.host_name !== '') {
      baseLabels.host_name = host.host_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_smart_up`,
      help: 'XOSTOR SMART data collection success per host (1 = smartctl.py replied, 0 = plugin missing or call failed)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: host.up ? 1 : 0,
      timestamp,
    })

    for (const device of host.devices) {
      metrics.push({
        name: `${METRIC_PREFIX}_xostor_disk_smart_status`,
        help: 'SMART overall-health status per disk on a XOSTOR host (always 1; current status is carried by the status label)',
        type: 'gauge',
        labels: {
          ...baseLabels,
          device: device.device,
          status: device.status,
        },
        value: 1,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XOSTOR pending-update metrics derived from `updater.py check_update`.
 *
 * Two metric families per XOSTOR host:
 *  - `xcp_xostor_updates_up` (gauge): 1 when the plugin returned data, 0
 *    when the call failed or repos are unreachable (e.g. air-gapped hosts).
 *  - `xcp_xostor_package_update_available` (gauge, value=1): one entry per
 *    pending package update on a host. Emitted with a *presence* pattern
 *    (no `0` lines) — absence means "no update pending AND collection
 *    succeeded" (because `_up=1`). Duplicate package entries collapse to a
 *    single series.
 *
 * No `severity` label is exposed: XCP-ng's `updater.py` payload does not
 * carry one and emitting a constant placeholder would mislead operators.
 */
export function formatXostorUpdatesMetrics(payload: XostorUpdatesPayload): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  if (payload.hosts.length === 0) {
    return metrics
  }

  const timestamp = Math.floor(Date.now() / 1000)

  for (const host of payload.hosts) {
    const baseLabels: Record<string, string> = {
      sr_uuid: host.sr_uuid,
      pool_id: host.pool_id,
      host_uuid: host.host_uuid,
    }
    if (host.pool_name !== '') {
      baseLabels.pool_name = host.pool_name
    }
    if (host.host_name !== '') {
      baseLabels.host_name = host.host_name
    }

    metrics.push({
      name: `${METRIC_PREFIX}_xostor_updates_up`,
      help: 'XOSTOR update check success per host (1 = updater.py replied, 0 = call failed or repo unreachable)',
      type: 'gauge',
      labels: { ...baseLabels },
      value: host.up ? 1 : 0,
      timestamp,
    })

    const seenPackages = new Set<string>()
    for (const entry of host.packages) {
      if (seenPackages.has(entry.package)) continue
      seenPackages.add(entry.package)

      metrics.push({
        name: `${METRIC_PREFIX}_xostor_package_update_available`,
        help: 'Pending XOSTOR-related package update on a host (always 1; absent means no update pending)',
        type: 'gauge',
        labels: { ...baseLabels, package: entry.package },
        value: 1,
        timestamp,
      })
    }
  }

  return metrics
}

/**
 * Format XO management plane metrics to OpenMetrics format.
 *
 * Produces counters/gauges for pools, hosts, VMs, SRs, users, groups,
 * sockets, host versions, host licenses, and backup job counts.
 *
 * @param data - XO metrics data collected from the parent process
 * @returns Array of FormattedMetric entries
 */
export function formatXoMetrics(data: XoMetricsData): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const timestamp = Math.floor(Date.now() / 1000)

  // Simple totals
  const simpleTotals: Array<{ name: string; help: string; value: number }> = [
    { name: `${XO_METRIC_PREFIX}_task_pending`, help: 'Total number of tasks pending', value: data.pendingTaskCount },
    { name: `${XO_METRIC_PREFIX}_pool_total`, help: 'Total number of pools', value: data.poolCount },
    { name: `${XO_METRIC_PREFIX}_host_total`, help: 'Total number of hosts', value: data.hostCount },
    { name: `${XO_METRIC_PREFIX}_vm_total`, help: 'Total number of virtual machines', value: data.vmCount },
    { name: `${XO_METRIC_PREFIX}_user_total`, help: 'Total number of users', value: data.userCount },
    { name: `${XO_METRIC_PREFIX}_group_total`, help: 'Total number of groups', value: data.groupCount },
    {
      name: `${XO_METRIC_PREFIX}_socket_total`,
      help: 'Total number of CPU sockets across all hosts',
      value: data.socketCount,
    },
  ]

  for (const { name, help, value } of simpleTotals) {
    metrics.push({ name, help, type: 'gauge', labels: {}, value, timestamp })
  }

  // SR count by content type
  for (const [contentType, count] of Object.entries(data.srCountByContentType)) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_sr_total`,
      help: 'Total number of storage repositories by content type',
      type: 'gauge',
      labels: { content_type: contentType },
      value: count,
      timestamp,
    })
  }

  // Host count by product brand and version
  for (const { productBrand, version, count } of data.hostCountByVersion) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_host_version_total`,
      help: 'Total number of hosts by product brand and version',
      type: 'gauge',
      labels: { product_brand: productBrand, version },
      value: count,
      timestamp,
    })
  }

  // Host count by license SKU type
  for (const { skuType, count } of data.hostCountByLicense) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_host_license_total`,
      help: 'Total number of hosts by license SKU type',
      type: 'gauge',
      labels: { sku_type: skuType },
      value: count,
      timestamp,
    })
  }

  // Node.js process metrics
  const { nodeProcess: np } = data
  const nodeMemMetrics: Array<{ type: string; value: number }> = [
    { type: 'rss', value: np.memoryRssBytes },
    { type: 'heap_used', value: np.memoryHeapUsedBytes },
    { type: 'heap_total', value: np.memoryHeapTotalBytes },
    { type: 'external', value: np.memoryExternalBytes },
    { type: 'array_buffers', value: np.memoryArrayBuffersBytes },
  ]
  for (const { type, value } of nodeMemMetrics) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_nodejs_process_memory_bytes`,
      help: 'Memory usage of the XO main process in bytes',
      type: 'gauge',
      labels: { type },
      value,
      timestamp,
    })
  }

  metrics.push(
    {
      name: `${XO_METRIC_PREFIX}_nodejs_heap_size_limit_bytes`,
      help: 'V8 heap size limit in bytes — OOM occurs when heap_used approaches this value',
      type: 'gauge',
      labels: {},
      value: np.heapSizeLimitBytes,
      timestamp,
    },
    {
      name: `${XO_METRIC_PREFIX}_nodejs_heap_available_bytes`,
      help: 'Remaining V8 heap space before hitting the size limit',
      type: 'gauge',
      labels: {},
      value: np.heapAvailableBytes,
      timestamp,
    },
    {
      name: `${XO_METRIC_PREFIX}_nodejs_detached_contexts`,
      help: "Number of detached V8 contexts not yet GC'd — non-zero and growing indicates a memory leak",
      type: 'gauge',
      labels: {},
      value: np.detachedContexts,
      timestamp,
    }
  )

  const nodeCpuMetrics: Array<{ mode: string; value: number }> = [
    { mode: 'user', value: np.cpuUserSeconds },
    { mode: 'system', value: np.cpuSystemSeconds },
  ]
  for (const { mode, value } of nodeCpuMetrics) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_nodejs_process_cpu_seconds`,
      help: 'CPU time consumed by the XO main process since last collection in seconds',
      type: 'gauge',
      labels: { mode },
      value,
      timestamp,
    })
  }

  const eluMetrics: Array<{ metric: string; value: number }> = [
    { metric: 'mean', value: np.eluMean },
    { metric: 'p99', value: np.eluP99 },
    { metric: 'max', value: np.eluMax },
  ]
  for (const { metric, value } of eluMetrics) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_nodejs_event_loop_utilization`,
      help: 'Event loop utilization ratio of the XO main process since last collection',
      type: 'gauge',
      labels: { metric },
      value,
      timestamp,
    })
  }

  // Backup job count by type
  for (const { type, jobCount } of data.backupJobStats) {
    metrics.push({
      name: `${XO_METRIC_PREFIX}_backup_job_total`,
      help: 'Total number of backup jobs by type',
      type: 'gauge',
      labels: { type },
      value: jobCount,
      timestamp,
    })
  }

  return metrics
}

/**
 * Format host uptime metrics to OpenMetrics format.
 *
 * Creates a FormattedMetric entry for each host's uptime, calculated as
 * the difference between current time and host.startTime (boot time).
 *
 * @param labelContext - Label context containing host credentials and label lookup data
 * @returns Array of FormattedMetric entries for host uptime
 */
export function formatHostUptimeMetrics(labelContext: LabelContext): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const now = Math.floor(Date.now() / 1000)

  for (const host of labelContext.hosts) {
    const hostInfo = labelContext.labels.hosts[host.hostId]
    if (hostInfo === undefined || hostInfo.startTime === null) {
      continue
    }

    const uptimeSeconds = now - hostInfo.startTime

    const labels: Record<string, string> = {
      pool_id: host.poolId,
      uuid: host.hostId,
    }

    if (host.poolLabel !== '') {
      labels.pool_name = host.poolLabel
    }

    if (hostInfo.name_label !== '') {
      labels.host_name = hostInfo.name_label
    }

    addTagsLabel(labels, hostInfo.tags)

    metrics.push({
      name: `${METRIC_PREFIX}_host_uptime_seconds`,
      help: 'Host uptime in seconds since boot',
      type: 'gauge',
      labels,
      value: uptimeSeconds,
      timestamp: now,
    })
  }

  return metrics
}

/**
 * Format VM uptime metrics to OpenMetrics format.
 *
 * Creates a FormattedMetric entry for each VM's uptime, calculated as
 * the difference between current time and vm.startTime (boot time).
 * VM-controllers (dom0) are excluded.
 *
 * @param labelContext - Label context containing host credentials and label lookup data
 * @returns Array of FormattedMetric entries for VM uptime
 */
export function formatVmUptimeMetrics(labelContext: LabelContext): FormattedMetric[] {
  const metrics: FormattedMetric[] = []
  const now = Math.floor(Date.now() / 1000)

  for (const [vmUuid, vmInfo] of Object.entries(labelContext.labels.vms)) {
    if (vmInfo.is_control_domain) {
      continue
    }

    // Only emit uptime for running VMs — halted/suspended VMs retain stale startTime
    if (vmInfo.power_state !== 'Running') {
      continue
    }

    if (vmInfo.startTime === null || vmInfo.startTime === undefined) {
      continue
    }

    const uptimeSeconds = Math.max(0, now - vmInfo.startTime)

    const labels: Record<string, string> = {
      pool_id: vmInfo.pool_id,
      uuid: vmUuid,
    }

    if (vmInfo.pool_name !== '') {
      labels.pool_name = vmInfo.pool_name
    }

    if (vmInfo.name_label !== '') {
      labels.vm_name = vmInfo.name_label
    }

    addTagsLabel(labels, vmInfo.tags)

    metrics.push({
      name: `${METRIC_PREFIX}_vm_uptime_seconds`,
      help: 'VM uptime in seconds since boot',
      type: 'gauge',
      labels,
      value: uptimeSeconds,
      timestamp: now,
    })
  }

  return metrics
}
