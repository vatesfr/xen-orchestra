/**
 * Tests for OpenMetrics Formatter — Primitives
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  findMetricDefinition,
  formatToOpenMetrics,
  transformMetric,
  type FormattedMetric,
  type LabelContext,
} from './primitives.mjs'

import type { ParsedMetric } from '../rrd-parser.mjs'

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

  it('should find VM VBD throughput metric', () => {
    const result = findMetricDefinition('vbd_xvdb_io_throughput_read', 'vm')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'vm_disk_throughput_read_bytes')
    assert.ok(result.matches)
    assert.equal(result.matches[1], 'b')
  })

  it('should find VM VBD average latency metric', () => {
    const result = findMetricDefinition('vbd_xvda_latency', 'vm')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'vm_disk_latency_seconds')
  })

  it('should find host DCMI power reading metric', () => {
    const result = findMetricDefinition('DCMI-power-reading', 'host')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'host_power_consumption_watts')
    assert.equal(result.matches, null)
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
          startTime: null,
          power_state: 'Running',
          pool_id: 'pool-456',
          pool_name: 'Production Pool',
        },
      },
      hosts: {
        'host-uuid-123': {
          name_label: 'Host 1',
          pifDeviceToNetworkName: { eth0: 'Pool-wide network', eth1: 'Storage network' },
          startTime: null,
        },
      },
      srs: {
        'sr-uuid-full-1234567890': {
          name_label: 'Local Storage',
          SR_type: 'lvm',
        },
      },
      srTruncatedToUuid: {
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

  it('should add sr_type label for host SR-tagged metrics (iops/throughput/latency)', () => {
    const ctx = createLabelContext()
    ctx.labels.srs['sr-uuid-full-1234567890']!.SR_type = 'linstor'
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

    const result = transformMetric(metric, 'pool-456', ctx)

    assert.ok(result)
    assert.equal(result.labels.sr_type, 'linstor')
  })

  it('should add sr_type label for VBD VM disk metrics via VDI→SR mapping', () => {
    const ctx = createLabelContext()
    ctx.labels.srs['sr-uuid-full-1234567890']!.SR_type = 'linstor'
    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'vm',
        uuid: 'vm-uuid-789',
        metricName: 'vbd_xvda_iops_read',
        rawLegend: 'AVERAGE:vm:vm-uuid-789:vbd_xvda_iops_read',
      },
      value: 200,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', ctx)

    assert.ok(result)
    assert.equal(result.labels.sr_type, 'linstor')
  })

  it('should omit sr_type label when SR_type is empty', () => {
    const ctx = createLabelContext()
    ctx.labels.srs['sr-uuid-full-1234567890']!.SR_type = ''
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

    const result = transformMetric(metric, 'pool-456', ctx)

    assert.ok(result)
    assert.equal(result.labels.sr_type, undefined)
  })

  it('should resolve sr_name and sr_type from a UUID prefix (XCP-ng RRD encoding)', () => {
    // XCP-ng encodes the SR in RRD legends as the first 8 chars of the UUID.
    // The label context must therefore index that prefix.
    const fullUuid = 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33'
    const prefix = fullUuid.slice(0, 8)
    const ctx = createLabelContext()
    ctx.labels.srs[fullUuid] = { name_label: 'XOSTOR NVME', SR_type: 'linstor' }
    ctx.labels.srTruncatedToUuid[prefix] = fullUuid

    const metric: ParsedMetric = {
      legend: {
        cf: 'AVERAGE',
        objectType: 'host',
        uuid: 'host-uuid-123',
        metricName: `iops_read_${prefix}`,
        rawLegend: `AVERAGE:host:host-uuid-123:iops_read_${prefix}`,
      },
      value: 42,
      timestamp: 1700000000,
    }

    const result = transformMetric(metric, 'pool-456', ctx)

    assert.ok(result)
    assert.equal(result.labels.sr, prefix)
    assert.equal(result.labels.sr_name, 'XOSTOR NVME')
    assert.equal(result.labels.sr_type, 'linstor')
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
      startTime: null,
      power_state: 'Running',
      pool_id: 'pool-456',
      pool_name: 'Production Pool',
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
