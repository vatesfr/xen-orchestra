/**
 * OpenMetrics Formatter — Metric Definitions
 *
 * Maps RRD metric names to OpenMetrics format with transformations and labels.
 */

import type { MetricDefinition } from './primitives.mjs'

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
