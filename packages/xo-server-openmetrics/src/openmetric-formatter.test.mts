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
    assert.equal(result.timestamp, 1700000000)
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
        timestamp: 1700000000,
      },
    ]

    const result = formatToOpenMetrics(metrics)

    assert.ok(result.includes('# HELP xcp_host_cpu_average Host average CPU usage ratio'))
    assert.ok(result.includes('# TYPE xcp_host_cpu_average gauge'))
    assert.ok(result.includes('xcp_host_cpu_average{pool_id="pool-1",uuid="host-1",type="host"} 0.5 1700000000'))
  })

  it('should group metrics by name', () => {
    const metrics: FormattedMetric[] = [
      {
        name: 'xcp_host_cpu_core_usage',
        help: 'Host CPU core usage ratio',
        type: 'gauge',
        labels: { pool_id: 'pool-1', uuid: 'host-1', type: 'host', core: '0' },
        value: 0.3,
        timestamp: 1700000000,
      },
      {
        name: 'xcp_host_cpu_core_usage',
        help: 'Host CPU core usage ratio',
        type: 'gauge',
        labels: { pool_id: 'pool-1', uuid: 'host-1', type: 'host', core: '1' },
        value: 0.4,
        timestamp: 1700000000,
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
        timestamp: 1700000000,
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
          is_control_domain: false,
          vbdDeviceToVdiName: { xvda: 'System Disk', xvdb: 'Data Disk' },
          vbdDeviceToVdiUuid: { xvda: 'vdi-uuid-system', xvdb: 'vdi-uuid-data' },
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
      vdiUuidToSrUuid: {
        'vdi-uuid-system': 'sr-uuid-full-1234567890',
        'vdi-uuid-data': 'sr-uuid-full-1234567890',
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

  it('should add sr_name label for VM disk metrics via VDI-SR mapping', () => {
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'vbd_xvda_iops_read',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:vbd_xvda_iops_read',
      },
      value: 150,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', createLabelContext())

    assert.ok(result)
    assert.equal(result.labels.device, 'xvda')
    assert.equal(result.labels.vdi_name, 'System Disk')
    assert.equal(result.labels.sr_name, 'Local Storage')
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

  it('should add is_control_domain="false" label for regular VMs', () => {
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
    assert.equal(result.labels.is_control_domain, 'false')
  })

  it('should add is_control_domain="true" label for dom0 VMs', () => {
    const context = createLabelContext()
    context.labels.vms['dom0-uuid'] = {
      name_label: 'Control domain on host: Host 1',
      is_control_domain: true,
      vbdDeviceToVdiName: {},
      vbdDeviceToVdiUuid: {},
      vifIndexToNetworkName: {},
    }

    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'dom0-uuid',
        metricName: 'cpu_usage',
        rawLegend: 'AVERAGE:vm:dom0-uuid:cpu_usage',
      },
      value: 0.3,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', context)

    assert.ok(result)
    assert.equal(result.labels.is_control_domain, 'true')
    assert.equal(result.labels.vm_name, 'Control domain on host: Host 1')
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
    assert.equal(result.labels.is_control_domain, undefined)
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
          is_control_domain: false,
          vbdDeviceToVdiName: { xvda: 'System Disk' },
          vbdDeviceToVdiUuid: { xvda: 'vdi-1' },
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
      vdiUuidToSrUuid: {},
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

// ============================================================================
// CPU Usage Fallback Tests
// ============================================================================

describe('CPU usage fallback', () => {
  it('should not generate fallback when vm_cpu_usage is present', () => {
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
            value: 0.5,
            timestamp: 1700000000,
          },
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-1',
              metricName: 'cpu0',
              rawLegend: 'AVERAGE:vm:vm-1:cpu0',
            },
            value: 0.6,
            timestamp: 1700000000,
          },
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-1',
              metricName: 'cpu1',
              rawLegend: 'AVERAGE:vm:vm-1:cpu1',
            },
            value: 0.4,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList)
    const lines = result.split('\n')

    // Should have exactly one vm_cpu_usage metric (the native one, not synthetic)
    const cpuUsageLines = lines.filter(l => l.includes('xcp_vm_cpu_usage{'))
    assert.equal(cpuUsageLines.length, 1)
    assert.ok(cpuUsageLines[0]?.includes('0.5'))
  })

  it('should generate fallback vm_cpu_usage from per-core metrics', () => {
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
              metricName: 'cpu0',
              rawLegend: 'AVERAGE:vm:vm-1:cpu0',
            },
            value: 0.6,
            timestamp: 1700000000,
          },
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-1',
              metricName: 'cpu1',
              rawLegend: 'AVERAGE:vm:vm-1:cpu1',
            },
            value: 0.4,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList)

    // Should have vm_cpu_usage metric generated from average of cores
    assert.ok(result.includes('xcp_vm_cpu_usage'))

    const lines = result.split('\n')
    const cpuUsageLine = lines.find(l => l.includes('xcp_vm_cpu_usage{'))
    assert.ok(cpuUsageLine)
    // Average of 0.6 and 0.4 = 0.5
    assert.ok(cpuUsageLine.includes('0.5'))
  })

  it('should generate fallback for multiple VMs', () => {
    const rrdDataList: ParsedRrdData[] = [
      {
        poolId: 'pool-1',
        timestamp: 1700000000,
        metrics: [
          // VM 1: only per-core metrics
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-1',
              metricName: 'cpu0',
              rawLegend: 'AVERAGE:vm:vm-1:cpu0',
            },
            value: 0.8,
            timestamp: 1700000000,
          },
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-1',
              metricName: 'cpu1',
              rawLegend: 'AVERAGE:vm:vm-1:cpu1',
            },
            value: 0.2,
            timestamp: 1700000000,
          },
          // VM 2: has native cpu_usage (should not get fallback)
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-2',
              metricName: 'cpu_usage',
              rawLegend: 'AVERAGE:vm:vm-2:cpu_usage',
            },
            value: 0.3,
            timestamp: 1700000000,
          },
          // VM 3: only per-core metrics
          {
            legend: {
              cf: 'AVERAGE',
              objectType: 'vm',
              uuid: 'vm-3',
              metricName: 'cpu0',
              rawLegend: 'AVERAGE:vm:vm-3:cpu0',
            },
            value: 0.9,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList)
    const lines = result.split('\n')

    // VM 1 should have synthetic cpu_usage (average of 0.8 and 0.2 = 0.5)
    const vm1CpuUsage = lines.find(l => l.includes('xcp_vm_cpu_usage') && l.includes('uuid="vm-1"'))
    assert.ok(vm1CpuUsage)
    assert.ok(vm1CpuUsage.includes('0.5'))

    // VM 2 should have its native cpu_usage (0.3)
    const vm2CpuUsage = lines.find(l => l.includes('xcp_vm_cpu_usage') && l.includes('uuid="vm-2"'))
    assert.ok(vm2CpuUsage)
    assert.ok(vm2CpuUsage.includes('0.3'))

    // VM 3 should have synthetic cpu_usage (0.9 single core)
    const vm3CpuUsage = lines.find(l => l.includes('xcp_vm_cpu_usage') && l.includes('uuid="vm-3"'))
    assert.ok(vm3CpuUsage)
    assert.ok(vm3CpuUsage.includes('0.9'))
  })

  it('should preserve labels in fallback metric', () => {
    const labelContext: LabelContext = {
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
            name_label: 'XCP-ng 8.2 VM',
            is_control_domain: false,
            vbdDeviceToVdiName: {},
            vbdDeviceToVdiUuid: {},
            vifIndexToNetworkName: {},
          },
        },
        hosts: {},
        srs: {},
        srSuffixToUuid: {},
        vdiUuidToSrUuid: {},
      },
    }

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
              metricName: 'cpu0',
              rawLegend: 'AVERAGE:vm:vm-1:cpu0',
            },
            value: 0.75,
            timestamp: 1700000000,
          },
        ],
      },
    ]

    const result = formatAllPoolsToOpenMetrics(rrdDataList, labelContext)

    // Fallback metric should have all the labels (pool_id, uuid, type, vm_name, pool_name)
    // but NOT the core label
    assert.ok(result.includes('xcp_vm_cpu_usage'))
    assert.ok(result.includes('pool_id="pool-1"'))
    assert.ok(result.includes('uuid="vm-1"'))
    assert.ok(result.includes('type="vm"'))
    assert.ok(result.includes('vm_name="XCP-ng 8.2 VM"'))
    assert.ok(result.includes('pool_name="Production"'))

    // Should NOT have core label in the fallback metric
    const lines = result.split('\n')
    const cpuUsageLine = lines.find(l => l.includes('xcp_vm_cpu_usage{'))
    assert.ok(cpuUsageLine)
    assert.ok(!cpuUsageLine.includes('core='))
  })
})
