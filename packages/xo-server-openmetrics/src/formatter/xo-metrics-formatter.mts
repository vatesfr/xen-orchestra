/**
 * OpenMetrics Formatter — XO Management Plane Metrics
 *
 * Formats XO management plane metrics (pools, hosts, VMs, SRs, users, groups,
 * sockets, Node.js process stats, backup jobs) into OpenMetrics entries.
 */

import type { XoMetricsData } from '../types/domain.mjs'

import type { FormattedMetric } from './primitives.mjs'

/** OpenMetrics prefix for XO management plane metrics */
const XO_METRIC_PREFIX = 'xo'

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
