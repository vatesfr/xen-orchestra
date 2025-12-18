/**
 * OpenMetrics Formatter Module
 *
 * Converts parsed RRD metrics to OpenMetrics/Prometheus format.
 * Defines metric mappings with transformations and labels.
 */

import { createLogger } from '@xen-orchestra/log'

import type { ParsedMetric, ParsedRrdData } from './rrd-parser.mjs'

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
  /** Timestamp in milliseconds */
  timestampMs: number
}

// Label lookup types for enriching metrics with human-readable names
interface VmLabelInfo {
  name_label: string
  vbdDeviceToVdiName: Record<string, string>
  vifIndexToNetworkName: Record<string, string>
}

interface HostLabelInfo {
  name_label: string
  pifDeviceToNetworkName: Record<string, string>
}

interface SrLabelInfo {
  name_label: string
}

interface LabelLookupData {
  vms: Record<string, VmLabelInfo>
  hosts: Record<string, HostLabelInfo>
  srs: Record<string, SrLabelInfo>
  srSuffixToUuid: Record<string, string>
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
    transformValue: v => v * Math.pow(2, 20), // MB to bytes
    extractLabels: matches => ({ sr: matches[1]! }),
  },
  {
    test: /^io_throughput_write_(.+)$/,
    openMetricName: 'host_disk_throughput_write_bytes',
    type: 'gauge',
    help: 'Host disk write throughput in bytes per second',
    transformValue: v => v * Math.pow(2, 20), // MB to bytes
    extractLabels: matches => ({ sr: matches[1]! }),
  },

  // Disk latency metrics
  {
    test: /^read_latency_(.+)$/,
    openMetricName: 'host_disk_read_latency_seconds',
    type: 'gauge',
    help: 'Host disk read latency in seconds',
    transformValue: v => v / 1000, // ms to seconds
    extractLabels: matches => ({ sr: matches[1]! }),
  },
  {
    test: /^write_latency_(.+)$/,
    openMetricName: 'host_disk_write_latency_seconds',
    type: 'gauge',
    help: 'Host disk write latency in seconds',
    transformValue: v => v / 1000, // ms to seconds
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
    transformValue: v => v / 1000, // ms to seconds
    extractLabels: matches => ({ device: `xvd${matches[1]!}` }),
  },
  {
    test: /^vbd_xvd(.)_write_latency$/,
    openMetricName: 'vm_disk_write_latency_seconds',
    type: 'gauge',
    help: 'VM disk write latency in seconds',
    transformValue: v => v / 1000, // ms to seconds
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
    if (metric.labels.type !== 'vm') {
      continue
    }

    const vmUuid = metric.labels.uuid
    if (vmUuid === undefined) {
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

      let coreValues = vmTimestamps.get(metric.timestampMs)
      if (coreValues === undefined) {
        coreValues = new Map()
        vmTimestamps.set(metric.timestampMs, coreValues)
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
    for (const [timestampMs, coreValues] of timestamps) {
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
      const sampleEntry = coreValues.values().next().value
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
        timestampMs,
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

// ============================================================================
// Formatting Functions
// ============================================================================

/** OpenMetrics prefix for all metrics */
const METRIC_PREFIX = 'xcp'

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
  labelContext?: LabelContext
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
          const srUuid = labelContext.labels.srSuffixToUuid[srSuffix]
          if (srUuid !== undefined) {
            const srInfo = labelContext.labels.srs[srUuid]
            if (srInfo !== undefined && srInfo.name_label !== '') {
              labels.sr_name = srInfo.name_label
            }
          }
        }
      }
    }

    if (legend.objectType === 'vm') {
      const vmInfo = labelContext.labels.vms[legend.uuid]
      if (vmInfo !== undefined) {
        if (vmInfo.name_label !== '') {
          labels.vm_name = vmInfo.name_label
        }

        // For VBD metrics, add vdi_name
        if (extractedLabels.device !== undefined) {
          const vdiName = vmInfo.vbdDeviceToVdiName[extractedLabels.device]
          if (vdiName !== undefined && vdiName !== '') {
            labels.vdi_name = vdiName
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

  return {
    name: `${METRIC_PREFIX}_${definition.openMetricName}`,
    help: definition.help,
    type: definition.type,
    labels,
    value: transformedValue,
    timestampMs: timestamp * 1000, // Convert to milliseconds
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
      lines.push(`${metric.name}${labelsStr} ${metric.value} ${metric.timestampMs}`)
    }
  }

  return lines.join('\n')
}

/**
 * Format all RRD data from multiple pools to OpenMetrics.
 *
 * @param rrdDataList - Array of ParsedRrdData from all pools
 * @param labelContext - Optional label context for enriching metrics with human-readable names
 * @returns Complete OpenMetrics output string with EOF marker
 */
export function formatAllPoolsToOpenMetrics(rrdDataList: ParsedRrdData[], labelContext?: LabelContext): string {
  const allMetrics: FormattedMetric[] = []
  const unmatchedMetrics: Set<string> = new Set()

  for (const rrdData of rrdDataList) {
    for (const metric of rrdData.metrics) {
      const formatted = transformMetric(metric, rrdData.poolId, labelContext)
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

  // Compute fallback vm_cpu_usage for VMs that don't have the native metric
  // This handles XCP-ng 8.2 and other versions that only report per-core metrics
  const syntheticCpuMetrics = computeVmCpuUsageFallback(allMetrics)
  allMetrics.push(...syntheticCpuMetrics)

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
