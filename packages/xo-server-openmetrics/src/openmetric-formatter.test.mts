/**
 * Tests for OpenMetrics Formatter Module
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  HOST_METRICS,
  VM_METRICS,
  findMetricDefinition,
  transformMetric,
  formatToOpenMetrics,
  formatAllPoolsToOpenMetrics,
  type FormattedMetric,
  type LabelContext,
} from './openmetric-formatter.mjs'

import type { ParsedMetric, ParsedRrdData } from './rrd-parser.mjs'

// ============================================================================
// Metric Definitions Tests
// ============================================================================

describe('HOST_METRICS', () => {
  it('should have metric definitions', () => {
    assert.ok(HOST_METRICS.length > 0)
  })

  it('should include loadavg metric', () => {
    const loadMetric = HOST_METRICS.find(m => m.openMetricName === 'host_load_average')
    assert.ok(loadMetric)
    assert.equal(loadMetric.type, 'gauge')
  })

  it('should include memory metrics with transformations', () => {
    const memFree = HOST_METRICS.find(m => m.openMetricName === 'host_memory_free_bytes')
    assert.ok(memFree)
    assert.ok(memFree.transformValue)
    // memory_free_kib * 1024 = bytes
    assert.equal(memFree.transformValue!(1024), 1024 * 1024)
  })

  it('should include CPU core metric with label extraction', () => {
    const cpuCore = HOST_METRICS.find(m => m.openMetricName === 'host_cpu_core_usage')
    assert.ok(cpuCore)
    assert.ok(cpuCore.extractLabels)

    // Test regex and label extraction
    const regex = cpuCore.test as RegExp
    const match = regex.exec('cpu0')
    assert.ok(match)
    assert.deepEqual(cpuCore.extractLabels!(match), { core: '0' })
  })

  it('should include network metrics', () => {
    const netRx = HOST_METRICS.find(m => m.openMetricName === 'host_network_receive_bytes_total')
    assert.ok(netRx)
    assert.equal(netRx.type, 'counter')
  })

  it('should include disk throughput metrics with MB to bytes transformation', () => {
    const throughput = HOST_METRICS.find(m => m.openMetricName === 'host_disk_throughput_read_bytes')
    assert.ok(throughput)
    assert.ok(throughput.transformValue)
    // 1 MB = 2^20 bytes
    assert.equal(throughput.transformValue!(1), Math.pow(2, 20))
  })

  it('should include latency metrics with ms to seconds transformation', () => {
    const latency = HOST_METRICS.find(m => m.openMetricName === 'host_disk_read_latency_seconds')
    assert.ok(latency)
    assert.ok(latency.transformValue)
    // 1000 ms = 1 second
    assert.equal(latency.transformValue!(1000), 1)
  })
})

describe('VM_METRICS', () => {
  it('should have metric definitions', () => {
    assert.ok(VM_METRICS.length > 0)
  })

  it('should include memory metrics', () => {
    const memMetric = VM_METRICS.find(m => m.openMetricName === 'vm_memory_bytes')
    assert.ok(memMetric)
  })

  it('should include CPU usage metric', () => {
    const cpuUsage = VM_METRICS.find(m => m.openMetricName === 'vm_cpu_usage')
    assert.ok(cpuUsage)
    assert.equal(cpuUsage.type, 'gauge')
  })

  it('should include VIF metrics with label extraction', () => {
    const vifRx = VM_METRICS.find(m => m.openMetricName === 'vm_network_receive_bytes_total')
    assert.ok(vifRx)
    assert.ok(vifRx.extractLabels)

    const regex = vifRx.test as RegExp
    const match = regex.exec('vif_0_rx')
    assert.ok(match)
    assert.deepEqual(vifRx.extractLabels!(match), { vif: '0' })
  })

  it('should include VBD metrics with device label', () => {
    const vbdRead = VM_METRICS.find(m => m.openMetricName === 'vm_disk_read_bytes_total')
    assert.ok(vbdRead)
    assert.ok(vbdRead.extractLabels)

    const regex = vbdRead.test as RegExp
    const match = regex.exec('vbd_xvda_read')
    assert.ok(match)
    assert.deepEqual(vbdRead.extractLabels!(match), { device: 'xvda' })
  })

  it('should include runstate metrics', () => {
    const runstate = VM_METRICS.find(m => m.openMetricName === 'vm_runstate_fullrun')
    assert.ok(runstate)
    assert.equal(runstate.type, 'gauge')
  })
})

// ============================================================================
// findMetricDefinition Tests
// ============================================================================

describe('findMetricDefinition', () => {
  it('should find host loadavg metric', () => {
    const result = findMetricDefinition('loadavg', 'host')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'host_load_average')
  })

  it('should find host CPU core metric and return matches', () => {
    const result = findMetricDefinition('cpu3', 'host')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'host_cpu_core_usage')
    assert.ok(result.matches)
    assert.equal(result.matches[1], '3')
  })

  it('should find VM cpu_usage metric', () => {
    const result = findMetricDefinition('cpu_usage', 'vm')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'vm_cpu_usage')
  })

  it('should find VM VIF metric', () => {
    const result = findMetricDefinition('vif_2_tx', 'vm')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'vm_network_transmit_bytes_total')
    assert.ok(result.matches)
    assert.equal(result.matches[1], '2')
  })

  it('should find VM VBD metric', () => {
    const result = findMetricDefinition('vbd_xvdb_write', 'vm')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'vm_disk_write_bytes_total')
    assert.ok(result.matches)
    assert.equal(result.matches[1], 'b')
  })

  it('should return null for unknown metric', () => {
    const result = findMetricDefinition('unknown_metric', 'host')
    assert.equal(result, null)
  })

  it('should return null for SR object type', () => {
    const result = findMetricDefinition('iops_read', 'sr')
    assert.equal(result, null)
  })
})

// ============================================================================
// transformMetric Tests
// ============================================================================

describe('transformMetric', () => {
  it('should transform host CPU metric', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'cpu_avg',
        rawLegend: 'AVERAGE:host:host-uuid-123:cpu_avg',
      },
      value: 0.75,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.ok(result)
    assert.equal(result.name, 'xcp_host_cpu_average')
    assert.equal(result.type, 'gauge')
    assert.equal(result.value, 0.75)
    assert.equal(result.timestampMs, 1700000000000)
    assert.equal(result.labels.pool_id, 'pool-456')
    assert.equal(result.labels.uuid, 'host-uuid-123')
    assert.equal(result.labels.type, 'host')
  })

  it('should apply value transformation for memory', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'memory_free_kib',
        rawLegend: 'AVERAGE:host:host-uuid-123:memory_free_kib',
      },
      value: 1024, // 1024 KiB
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.ok(result)
    assert.equal(result.name, 'xcp_host_memory_free_bytes')
    assert.equal(result.value, 1024 * 1024) // 1 MiB in bytes
  })

  it('should extract labels from regex matches', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'cpu5',
        rawLegend: 'AVERAGE:host:host-uuid-123:cpu5',
      },
      value: 0.25,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.ok(result)
    assert.equal(result.name, 'xcp_host_cpu_core_usage')
    assert.equal(result.labels.core, '5')
  })

  it('should return null for null values', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'cpu_avg',
        rawLegend: 'AVERAGE:host:host-uuid-123:cpu_avg',
      },
      value: null, // NaN was converted to null
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.equal(result, null)
  })

  it('should return null for unknown metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'unknown_metric',
        rawLegend: 'AVERAGE:host:host-uuid-123:unknown_metric',
      },
      value: 42,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.equal(result, null)
  })

  it('should transform VM VIF metric with extracted labels', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'vif_0_rx',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:vif_0_rx',
      },
      value: 1000000,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.ok(result)
    assert.equal(result.name, 'xcp_vm_network_receive_bytes_total')
    assert.equal(result.type, 'counter')
    assert.equal(result.labels.vif, '0')
    assert.equal(result.labels.type, 'vm')
  })
})

// ============================================================================
// formatToOpenMetrics Tests
// ============================================================================

describe('formatToOpenMetrics', () => {
  it('should format metrics to OpenMetrics text', () => {
    const metrics: FormattedMetric[] = [
      {
        name: 'xcp_host_cpu_average',
        help: 'Host average CPU usage ratio',
        type: 'gauge',
        labels: { pool_id: 'pool-1', uuid: 'host-1', type: 'host' },
        value: 0.5,
        timestampMs: 1700000000000,
      },
    ]

    const result = formatToOpenMetrics(metrics)

    assert.ok(result.includes('# HELP xcp_host_cpu_average Host average CPU usage ratio'))
    assert.ok(result.includes('# TYPE xcp_host_cpu_average gauge'))
    assert.ok(result.includes('xcp_host_cpu_average{pool_id="pool-1",uuid="host-1",type="host"} 0.5 1700000000000'))
  })

  it('should group metrics by name', () => {
    const metrics: FormattedMetric[] = [
      {
        name: 'xcp_host_cpu_core_usage',
        help: 'Host CPU core usage ratio',
        type: 'gauge',
        labels: { pool_id: 'pool-1', uuid: 'host-1', type: 'host', core: '0' },
        value: 0.3,
        timestampMs: 1700000000000,
      },
      {
        name: 'xcp_host_cpu_core_usage',
        help: 'Host CPU core usage ratio',
        type: 'gauge',
        labels: { pool_id: 'pool-1', uuid: 'host-1', type: 'host', core: '1' },
        value: 0.4,
        timestampMs: 1700000000000,
      },
    ]

    const result = formatToOpenMetrics(metrics)

    // Should only have one HELP and TYPE declaration
    const helpCount = (result.match(/# HELP xcp_host_cpu_core_usage/g) || []).length
    const typeCount = (result.match(/# TYPE xcp_host_cpu_core_usage/g) || []).length

    assert.equal(helpCount, 1)
    assert.equal(typeCount, 1)

    // Should have two value lines
    assert.ok(result.includes('core="0"'))
    assert.ok(result.includes('core="1"'))
  })

  it('should return empty string for empty metrics', () => {
    const result = formatToOpenMetrics([])
    assert.equal(result, '')
  })

  it('should escape special characters in label values', () => {
    const metrics: FormattedMetric[] = [
      {
        name: 'xcp_test_metric',
        help: 'Test metric',
        type: 'gauge',
        labels: { name: 'value with "quotes"' },
        value: 1,
        timestampMs: 1700000000000,
      },
    ]

    const result = formatToOpenMetrics(metrics)

    assert.ok(result.includes('name="value with \\"quotes\\""'))
  })
})

// ============================================================================
// formatAllPoolsToOpenMetrics Tests
// ============================================================================

describe('formatAllPoolsToOpenMetrics', () => {
  it('should format RRD data from multiple pools', () => {
    const rrdDataList: ParsedRrdData[] = [
      {
        poolId: 'pool-1',
        timestamp: 1700000000,
        metrics: [
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'host',
              uuid: 'host-1',
              metricName: 'cpu_avg',
              rawLegend: 'AVERAGE:host:host-1:cpu_avg',
            },
            value: 0.5,
            timestamp: 1700000000,
          },
        ],
      },
      {
        poolId: 'pool-2',
        timestamp: 1700000000,
        metrics: [
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'host',
              uuid: 'host-2',
              metricName: 'cpu_avg',
              rawLegend: 'AVERAGE:host:host-2:cpu_avg',
            },
            value: 0.7,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList)

    assert.ok(result.includes('pool_id="pool-1"'))
    assert.ok(result.includes('pool_id="pool-2"'))
    assert.ok(result.includes('# EOF'))
  })

  it('should return empty string for empty data', () => {
    const result = formatAllPoolsToOpenMetrics([])

    assert.equal(result, '')
  })

  it('should skip metrics with null values', () => {
    const rrdDataList: ParsedRrdData[] = [
      {
        poolId: 'pool-1',
        timestamp: 1700000000,
        metrics: [
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'host',
              uuid: 'host-1',
              metricName: 'cpu_avg',
              rawLegend: 'AVERAGE:host:host-1:cpu_avg',
            },
            value: null, // NaN converted to null
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList)

    // Should return empty string since the metric has null value
    assert.equal(result, '')
  })

  it('should sort metrics by name for consistent output', () => {
    const rrdDataList: ParsedRrdData[] = [
      {
        poolId: 'pool-1',
        timestamp: 1700000000,
        metrics: [
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'host',
              uuid: 'host-1',
              metricName: 'memory_free_kib',
              rawLegend: 'AVERAGE:host:host-1:memory_free_kib',
            },
            value: 1024,
            timestamp: 1700000000,
          },
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'host',
              uuid: 'host-1',
              metricName: 'cpu_avg',
              rawLegend: 'AVERAGE:host:host-1:cpu_avg',
            },
            value: 0.5,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList)
    const lines = result.split('\n')

    // cpu_average should come before memory_free_bytes alphabetically
    const cpuIndex = lines.findIndex(l => l.includes('xcp_host_cpu_average'))
    const memIndex = lines.findIndex(l => l.includes('xcp_host_memory_free_bytes'))

    assert.ok(cpuIndex < memIndex, 'Metrics should be sorted alphabetically')
  })
})

// ============================================================================
// Label Context Tests
// ============================================================================

describe('transformMetric with labelContext', () => {
  const createLabelContext = (): LabelContext => ({
    hosts: [
      {
        hostId: 'host-uuid-123',
        hostAddress: '192.168.1.1',
        hostLabel: 'Host 1',
        poolId: 'pool-456',
        poolLabel: 'Production Pool',
        sessionId: 'session-123',
        protocol: 'https:',
      },
    ],
    labels: {
      vms: {
        'vm-uuid-789': {
          name_label: 'Web Server',
          vbdDeviceToVdiName: { xvda: 'System Disk', xvdb: 'Data Disk' },
          vifIndexToNetworkName: { '0': 'Pool-wide network', '1': 'Storage network' },
        },
      },
      hosts: {
        'host-uuid-123': {
          name_label: 'Host 1',
          pifDeviceToNetworkName: { eth0: 'Pool-wide network', eth1: 'Storage network' },
        },
      },
      srs: {
        'sr-uuid-full-1234567890': {
          name_label: 'Local Storage',
        },
      },
      srSuffixToUuid: {
        '1234567890': 'sr-uuid-full-1234567890',
      },
    },
  })

  it('should add pool_name label from host credentials', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'cpu_avg',
        rawLegend: 'AVERAGE:host:host-uuid-123:cpu_avg',
      },
      value: 0.75,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.pool_name, 'Production Pool')
  })

  it('should add host_name label for host metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'cpu_avg',
        rawLegend: 'AVERAGE:host:host-uuid-123:cpu_avg',
      },
      value: 0.75,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.host_name, 'Host 1')
  })

  it('should add vm_name label for VM metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'cpu_usage',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:cpu_usage',
      },
      value: 0.5,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.vm_name, 'Web Server')
  })

  it('should add vdi_name label for VBD metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'vbd_xvda_read',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:vbd_xvda_read',
      },
      value: 1000000,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.device, 'xvda')
    assert.equal(result.labels.vdi_name, 'System Disk')
  })

  it('should add network_name label for VIF metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'vif_0_rx',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:vif_0_rx',
      },
      value: 500000,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.vif, '0')
    assert.equal(result.labels.network_name, 'Pool-wide network')
  })

  it('should add network_name label for PIF metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'pif_eth0_rx',
        rawLegend: 'AVERAGE:host:host-uuid-123:pif_eth0_rx',
      },
      value: 1000000,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.interface, 'eth0')
    assert.equal(result.labels.network_name, 'Pool-wide network')
  })

  it('should add sr_name label for SR metrics', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'iops_read_1234567890',
        rawLegend: 'AVERAGE:host:host-uuid-123:iops_read_1234567890',
      },
      value: 100,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.sr, '1234567890')
    assert.equal(result.labels.sr_name, 'Local Storage')
  })

  it('should handle missing label context gracefully', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: 'cpu_avg',
        rawLegend: 'AVERAGE:host:host-uuid-123:cpu_avg',
      },
      value: 0.75,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456')

    assert.ok(result)
    assert.equal(result.labels.pool_name, undefined)
    assert.equal(result.labels.host_name, undefined)
  })

  it('should handle missing VM in label context gracefully', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'unknown-vm-uuid',
        metricName: 'cpu_usage',
        rawLegend: 'AVERAGE:vm:unknown-vm-uuid:cpu_usage',
      },
      value: 0.5,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.vm_name, undefined)
  })

  it('should handle missing VDI mapping gracefully', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'vbd_xvdc_read',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:vbd_xvdc_read',
      },
      value: 1000000,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.device, 'xvdc')
    assert.equal(result.labels.vdi_name, undefined)
  })
})

describe('formatAllPoolsToOpenMetrics with labelContext', () => {
  const createLabelContext = (): LabelContext => ({
    hosts: [
      {
        hostId: 'host-1',
        hostAddress: '192.168.1.1',
        hostLabel: 'Host 1',
        poolId: 'pool-1',
        poolLabel: 'Production',
        sessionId: 'session-1',
        protocol: 'https:',
      },
    ],
    labels: {
      vms: {
        'vm-1': {
          name_label: 'Web Server',
          vbdDeviceToVdiName: { xvda: 'System Disk' },
          vifIndexToNetworkName: { '0': 'Management' },
        },
      },
      hosts: {
        'host-1': {
          name_label: 'Host 1',
          pifDeviceToNetworkName: { eth0: 'Management' },
        },
      },
      srs: {},
      srSuffixToUuid: {},
    },
  })

  it('should include human-readable labels in formatted output', () => {
    const rrdDataList: ParsedRrdData[] = [
      {
        poolId: 'pool-1',
        timestamp: 1700000000,
        metrics: [
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'host',
              uuid: 'host-1',
              metricName: 'cpu_avg',
              rawLegend: 'AVERAGE:host:host-1:cpu_avg',
            },
            value: 0.5,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList, createLabelContext())

    assert.ok(result.includes('pool_name="Production"'))
    assert.ok(result.includes('host_name="Host 1"'))
  })

  it('should include VM labels in VM metrics', () => {
    const rrdDataList: ParsedRrdData[] = [
      {
        poolId: 'pool-1',
        timestamp: 1700000000,
        metrics: [
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-1',
              metricName: 'cpu_usage',
              rawLegend: 'AVERAGE:vm:vm-1:cpu_usage',
            },
            value: 0.75,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList, createLabelContext())

    assert.ok(result.includes('vm_name="Web Server"'))
  })
})
