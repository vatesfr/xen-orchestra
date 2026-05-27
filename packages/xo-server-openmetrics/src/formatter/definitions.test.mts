/**
 * Tests for OpenMetrics Formatter — Metric Definitions
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { HOST_METRICS, VM_METRICS } from './definitions.mjs'
import { findMetricDefinition } from './primitives.mjs'

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

  it('should include latency metrics with µs to seconds transformation', () => {
    const latency = HOST_METRICS.find(m => m.openMetricName === 'host_disk_read_latency_seconds')
    assert.ok(latency)
    assert.ok(latency.transformValue)
    // 1000000 µs = 1 second
    assert.equal(latency.transformValue!(1000000), 1)
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

  it('should include VBD throughput metrics with transformation', () => {
    const throughputRead = VM_METRICS.find(m => m.openMetricName === 'vm_disk_throughput_read_bytes')
    assert.ok(throughputRead)
    assert.equal(throughputRead.type, 'gauge')
    assert.ok(throughputRead.transformValue)
    // 1.5 MiB/s * 2^20 = 1572864 bytes/s
    assert.equal(throughputRead.transformValue!(1.5), 1.5 * 2 ** 20)

    const regex = throughputRead.test as RegExp
    const match = regex.exec('vbd_xvda_io_throughput_read')
    assert.ok(match)
    assert.deepEqual(throughputRead.extractLabels!(match), { device: 'xvda' })
  })

  it('should include VBD throughput write and total metrics', () => {
    const throughputWrite = VM_METRICS.find(m => m.openMetricName === 'vm_disk_throughput_write_bytes')
    assert.ok(throughputWrite)
    assert.equal(throughputWrite.type, 'gauge')
    assert.ok(throughputWrite.transformValue)

    const throughputTotal = VM_METRICS.find(m => m.openMetricName === 'vm_disk_throughput_total_bytes')
    assert.ok(throughputTotal)
    assert.equal(throughputTotal.type, 'gauge')
    assert.ok(throughputTotal.transformValue)
  })

  it('should include VBD average latency metric with transformation', () => {
    const latency = VM_METRICS.find(m => m.openMetricName === 'vm_disk_latency_seconds')
    assert.ok(latency)
    assert.equal(latency.type, 'gauge')
    assert.ok(latency.transformValue)
    // 500 µs / 1e6 = 0.0005 seconds
    assert.equal(latency.transformValue!(500), 0.0005)

    const regex = latency.test as RegExp
    const match = regex.exec('vbd_xvda_latency')
    assert.ok(match)
    assert.deepEqual(latency.extractLabels!(match), { device: 'xvda' })
  })

  it('should not match vbd_xvda_latency with read_latency or write_latency regex', () => {
    const readLatency = VM_METRICS.find(m => m.openMetricName === 'vm_disk_read_latency_seconds')
    assert.ok(readLatency)
    const readRegex = readLatency.test as RegExp
    assert.equal(readRegex.exec('vbd_xvda_latency'), null)

    const writeLatency = VM_METRICS.find(m => m.openMetricName === 'vm_disk_write_latency_seconds')
    assert.ok(writeLatency)
    const writeRegex = writeLatency.test as RegExp
    assert.equal(writeRegex.exec('vbd_xvda_latency'), null)
  })
})

describe('HOST_METRICS DCMI', () => {
  it('should include DCMI power reading metric', () => {
    const dcmi = HOST_METRICS.find(m => m.openMetricName === 'host_power_consumption_watts')
    assert.ok(dcmi)
    assert.equal(dcmi.type, 'gauge')
    assert.equal(dcmi.test, 'DCMI-power-reading')
    assert.equal(dcmi.transformValue, undefined)
    assert.equal(dcmi.extractLabels, undefined)
  })
})

describe('HOST_METRICS new metrics', () => {
  it('should include hostload metric', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_load')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.test, 'hostload')
    assert.equal(metric.transformValue, undefined)
  })

  it('should include memory_reclaimed metric with KiB to bytes transformation', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_memory_reclaimed_bytes')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.test, 'memory_reclaimed')
    assert.ok(metric.transformValue)
    // 512 KiB * 1024 = 524288 bytes
    assert.equal(metric.transformValue!(512), 512 * 1024)
  })

  it('should include memory_reclaimed_max metric with KiB to bytes transformation', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_memory_reclaimed_max_bytes')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.test, 'memory_reclaimed_max')
    assert.ok(metric.transformValue)
    assert.equal(metric.transformValue!(1024), 1024 * 1024)
  })

  it('should include running_vcpus metric', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_running_vcpus')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.test, 'running_vcpus')
    assert.equal(metric.transformValue, undefined)
  })

  it('should include pif_aggr_rx metric', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_network_aggregated_receive_bytes')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.test, 'pif_aggr_rx')
    assert.equal(metric.transformValue, undefined)
  })

  it('should include pif_aggr_tx metric', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_network_aggregated_transmit_bytes')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.equal(metric.test, 'pif_aggr_tx')
    assert.equal(metric.transformValue, undefined)
  })

  it('should match pif_aggr_rx before the generic PIF regex', () => {
    const result = findMetricDefinition('pif_aggr_rx', 'host')
    assert.ok(result)
    assert.equal(result.definition.openMetricName, 'host_network_aggregated_receive_bytes')
  })

  it('should include iops_total per SR with label extraction', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_disk_iops_total')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.ok(metric.extractLabels)

    const regex = metric.test as RegExp
    const match = regex.exec('iops_total_abc12345')
    assert.ok(match)
    assert.deepEqual(metric.extractLabels!(match), { sr: 'abc12345' })
  })

  it('should include io_throughput_total per SR with MiB to bytes transformation', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_disk_throughput_total_bytes')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.ok(metric.transformValue)
    assert.ok(metric.extractLabels)

    // 2 MiB/s = 2 * 2^20 bytes/s
    assert.equal(metric.transformValue!(2), 2 * 2 ** 20)

    const regex = metric.test as RegExp
    const match = regex.exec('io_throughput_total_def-456-789')
    assert.ok(match)
    assert.deepEqual(metric.extractLabels!(match), { sr: 'def-456-789' })
  })

  it('should include latency per SR with µs to seconds transformation', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_disk_latency_seconds')
    assert.ok(metric)
    assert.equal(metric.type, 'gauge')
    assert.ok(metric.transformValue)
    assert.ok(metric.extractLabels)

    // 500 µs / 1e6 = 0.0005 seconds
    assert.equal(metric.transformValue!(500), 0.0005)

    const regex = metric.test as RegExp
    const match = regex.exec('latency_abc-def-123')
    assert.ok(match)
    assert.deepEqual(metric.extractLabels!(match), { sr: 'abc-def-123' })
  })

  it('should not match read_latency or write_latency with latency_<sr> regex', () => {
    const metric = HOST_METRICS.find(m => m.openMetricName === 'host_disk_latency_seconds')
    assert.ok(metric)
    const regex = metric.test as RegExp
    // ^latency_ anchor prevents matching read_latency_ and write_latency_
    assert.equal(regex.exec('read_latency_abc12345'), null)
    assert.equal(regex.exec('write_latency_abc12345'), null)
  })
})
