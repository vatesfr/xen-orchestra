/**
 * OpenMetrics Formatter — RRD Formatters
 *
 * Formats parsed RRD data from all pools to OpenMetrics, including the
 * synthetic vm_cpu_usage fallback computed from per-core metrics.
 */

import { createLogger } from '@xen-orchestra/log'

import type { ParsedRrdData } from '../rrd-parser.mjs'

import { formatToOpenMetrics, transformMetric, type FormattedMetric, type LabelContext } from './primitives.mjs'

const logger = createLogger('xo:xo-server-openmetrics:formatter')

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

// ============================================================================
// Formatting Functions
// ============================================================================

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
