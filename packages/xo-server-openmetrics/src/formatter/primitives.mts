/**
 * OpenMetrics Formatter — Primitives
 *
 * Low-level formatting helpers, metric-matching functions, the shared
 * metric/label types, and the XCP metric prefix constant.
 */

import type { LabelLookupData } from '../types/domain.mjs'
import type { ParsedMetric } from '../rrd-parser.mjs'

import { HOST_METRICS, VM_METRICS } from './definitions.mjs'

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
// Formatting Functions
// ============================================================================

/** OpenMetrics prefix for XCP/XAPI-level metrics */
export const METRIC_PREFIX = 'xcp'

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
      const vmInfo = labelContext.labels.vms[legend.uuid]
      if (vmInfo !== undefined) {
        if (vmInfo.name_label !== '') {
          labels.vm_name = vmInfo.name_label
        }
        labels.is_control_domain = vmInfo.is_control_domain ? 'true' : 'false'

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
