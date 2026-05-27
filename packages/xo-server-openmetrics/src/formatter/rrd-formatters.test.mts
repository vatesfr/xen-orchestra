/**
 * Tests for OpenMetrics Formatter — RRD Formatters
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatAllPoolsToOpenMetrics } from './rrd-formatters.mjs'
import type { LabelContext } from './primitives.mjs'

import type { ParsedRrdData } from '../rrd-parser.mjs'

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
          startTime: null,
          power_state: 'Running',
          pool_id: 'pool-1',
          pool_name: 'Production',
        },
      },
      hosts: {
        'host-1': {
          name_label: 'Host 1',
          pifDeviceToNetworkName: { eth0: 'Management' },
          startTime: null,
        },
      },
      srs: {},
      srTruncatedToUuid: {},
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
            startTime: null,
            power_state: 'Running',
            pool_id: 'pool-1',
            pool_name: 'Production',
          },
        },
        hosts: {},
        srs: {},
        srTruncatedToUuid: {},
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
