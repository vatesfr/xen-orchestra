/**
 * Tests for RRD Parser Module
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  parseNumber,
  parseLegend,
  parseRrdText,
  parseRrdData,
  parseRrdResponse,
  type RrdResponse,
} from './rrd-parser.mjs'

// ============================================================================
// parseNumber Tests
// ============================================================================

describe('parseNumber', () => {
  it('should parse regular numbers', () => {
    assert.equal(parseNumber(42), 42)
    assert.equal(parseNumber(3.14159), 3.14159)
    assert.equal(parseNumber(0), 0)
    assert.equal(parseNumber(-100), -100)
  })

  it('should parse string-encoded numbers (XAPI 23.31+)', () => {
    assert.equal(parseNumber('42'), 42)
    assert.equal(parseNumber('3.14159'), 3.14159)
    assert.equal(parseNumber('0'), 0)
    assert.equal(parseNumber('-100'), -100)
    assert.equal(parseNumber('1.5e10'), 1.5e10)
  })

  it('should return null for NaN values', () => {
    assert.equal(parseNumber(NaN), null)
    assert.equal(parseNumber('NaN'), null)
  })

  it('should return null for Infinity values', () => {
    assert.equal(parseNumber(Infinity), null)
    assert.equal(parseNumber(-Infinity), null)
    assert.equal(parseNumber('Infinity'), null)
    assert.equal(parseNumber('-Infinity'), null)
  })

  it('should return null for invalid string values', () => {
    assert.equal(parseNumber('not a number'), null)
    assert.equal(parseNumber(''), null)
  })
})

// ============================================================================
// parseLegend Tests
// ============================================================================

describe('parseLegend', () => {
  it('should parse host legend format', () => {
    const result = parseLegend('AVERAGE:host:abc-123-def:cpu_avg')

    assert.deepEqual(result, {
      cf: 'AVERAGE',
      objectType: 'host',
      uuid: 'abc-123-def',
      metricName: 'cpu_avg',
      rawLegend: 'AVERAGE:host:abc-123-def:cpu_avg',
    })
  })

  it('should parse vm legend format', () => {
    const result = parseLegend('AVERAGE:vm:vm-uuid-456:memory_internal_free')

    assert.deepEqual(result, {
      cf: 'AVERAGE',
      objectType: 'vm',
      uuid: 'vm-uuid-456',
      metricName: 'memory_internal_free',
      rawLegend: 'AVERAGE:vm:vm-uuid-456:memory_internal_free',
    })
  })

  it('should parse sr legend format', () => {
    const result = parseLegend('AVERAGE:sr:sr-uuid-789:iops_read')

    assert.deepEqual(result, {
      cf: 'AVERAGE',
      objectType: 'sr',
      uuid: 'sr-uuid-789',
      metricName: 'iops_read',
      rawLegend: 'AVERAGE:sr:sr-uuid-789:iops_read',
    })
  })

  it('should handle metric names with underscores', () => {
    const result = parseLegend('AVERAGE:host:uuid:memory_free_kib')

    assert.equal(result?.metricName, 'memory_free_kib')
  })

  it('should handle CPU core metrics', () => {
    const result = parseLegend('AVERAGE:host:uuid:cpu0')

    assert.equal(result?.metricName, 'cpu0')
  })

  it('should handle VIF metrics with numbers', () => {
    const result = parseLegend('AVERAGE:vm:uuid:vif_0_rx')

    assert.equal(result?.metricName, 'vif_0_rx')
  })

  it('should handle VBD metrics', () => {
    const result = parseLegend('AVERAGE:vm:uuid:vbd_xvda_read')

    assert.equal(result?.metricName, 'vbd_xvda_read')
  })

  it('should return null for invalid format', () => {
    assert.equal(parseLegend('invalid'), null)
    assert.equal(parseLegend('AVERAGE:host'), null)
    assert.equal(parseLegend('AVERAGE:host:uuid'), null)
    assert.equal(parseLegend(''), null)
  })

  it('should return null for unknown object types', () => {
    assert.equal(parseLegend('AVERAGE:unknown:uuid:metric'), null)
    assert.equal(parseLegend('AVERAGE:pool:uuid:metric'), null)
  })
})

// ============================================================================
// parseRrdText Tests
// ============================================================================

describe('parseRrdText', () => {
  it('should parse valid JSON', () => {
    const json = JSON.stringify({
      meta: {
        start: 1700000000,
        step: 60,
        end: 1700003600,
        rows: 1,
        columns: 60,
        legend: ['AVERAGE:host:uuid:cpu_avg'],
      },
      data: [{ t: 1700003600, values: [0.5] }],
    })

    const result = parseRrdText(json)

    assert.equal(result.meta.step, 60)
    assert.equal(result.data.length, 1)
  })

  it('should parse JSON5 with NaN values (XAPI < 23.31)', () => {
    // JSON5 allows unquoted NaN
    const json5 = `{
      meta: {
        start: 1700000000,
        step: 60,
        end: 1700003600,
        rows: 1,
        columns: 60,
        legend: ['AVERAGE:host:uuid:cpu_avg']
      },
      data: [{ t: 1700003600, values: [NaN] }]
    }`

    const result = parseRrdText(json5)

    assert.equal(result.meta.step, 60)
    assert.equal(result.data.length, 1)
    assert.ok(Number.isNaN(result.data[0]!.values[0] as number))
  })

  it('should throw on completely invalid input', () => {
    assert.throws(() => parseRrdText('not json at all {{{'))
  })
})

// ============================================================================
// parseRrdData Tests
// ============================================================================

describe('parseRrdData', () => {
  const sampleRrd: RrdResponse = {
    meta: {
      start: 1700000000,
      step: 60,
      end: 1700003600,
      rows: 3,
      columns: 60,
      legend: [
        'AVERAGE:host:host-uuid-1:cpu_avg',
        'AVERAGE:host:host-uuid-1:memory_free_kib',
        'AVERAGE:vm:vm-uuid-1:cpu_usage',
      ],
    },
    data: [
      { t: 1700003540, values: [0.3, 1048576, 0.2] },
      { t: 1700003600, values: [0.5, 2097152, 0.4] }, // Most recent
    ],
  }

  it('should extract metrics from RRD data', () => {
    const result = parseRrdData(sampleRrd, 'pool-123')

    assert.equal(result.poolId, 'pool-123')
    assert.equal(result.timestamp, 1700003600)
    assert.equal(result.metrics.length, 3)
  })

  it('should use the most recent data point', () => {
    const result = parseRrdData(sampleRrd, 'pool-123')

    // Values should be from the most recent data point (last in array)
    const cpuMetric = result.metrics.find(m => m.legend.metricName === 'cpu_avg')
    assert.equal(cpuMetric?.value, 0.5)
  })

  it('should parse legend correctly for each metric', () => {
    const result = parseRrdData(sampleRrd, 'pool-123')

    const hostMetric = result.metrics.find(m => m.legend.metricName === 'cpu_avg')
    assert.equal(hostMetric?.legend.objectType, 'host')
    assert.equal(hostMetric?.legend.uuid, 'host-uuid-1')

    const vmMetric = result.metrics.find(m => m.legend.metricName === 'cpu_usage')
    assert.equal(vmMetric?.legend.objectType, 'vm')
    assert.equal(vmMetric?.legend.uuid, 'vm-uuid-1')
  })

  it('should handle empty data array', () => {
    const emptyRrd: RrdResponse = {
      meta: {
        start: 1700000000,
        step: 60,
        end: 1700003600,
        rows: 0,
        columns: 0,
        legend: [],
      },
      data: [],
    }

    const result = parseRrdData(emptyRrd, 'pool-123')

    assert.equal(result.metrics.length, 0)
    assert.equal(result.timestamp, 1700003600) // Uses meta.end
  })

  it('should handle NaN values in data', () => {
    const rrdWithNaN: RrdResponse = {
      meta: {
        start: 1700000000,
        step: 60,
        end: 1700003600,
        rows: 2,
        columns: 1,
        legend: ['AVERAGE:host:uuid:cpu_avg', 'AVERAGE:host:uuid:loadavg'],
      },
      data: [{ t: 1700003600, values: [NaN, 0.5] }],
    }

    const result = parseRrdData(rrdWithNaN, 'pool-123')

    const cpuMetric = result.metrics.find(m => m.legend.metricName === 'cpu_avg')
    assert.equal(cpuMetric?.value, null) // NaN becomes null

    const loadMetric = result.metrics.find(m => m.legend.metricName === 'loadavg')
    assert.equal(loadMetric?.value, 0.5)
  })

  it('should skip invalid legend entries', () => {
    const rrdWithInvalidLegend: RrdResponse = {
      meta: {
        start: 1700000000,
        step: 60,
        end: 1700003600,
        rows: 2,
        columns: 1,
        legend: ['INVALID_FORMAT', 'AVERAGE:host:uuid:cpu_avg'],
      },
      data: [{ t: 1700003600, values: [0.5, 0.3] }],
    }

    const result = parseRrdData(rrdWithInvalidLegend, 'pool-123')

    assert.equal(result.metrics.length, 1)
    assert.equal(result.metrics[0]!.legend.metricName, 'cpu_avg')
  })
})

// ============================================================================
// parseRrdResponse Tests
// ============================================================================

describe('parseRrdResponse', () => {
  it('should parse JSON text and extract metrics', () => {
    const json = JSON.stringify({
      meta: {
        start: 1700000000,
        step: 60,
        end: 1700003600,
        rows: 1,
        columns: 1,
        legend: ['AVERAGE:host:uuid:cpu_avg'],
      },
      data: [{ t: 1700003600, values: [0.75] }],
    })

    const result = parseRrdResponse(json, 'pool-456')

    assert.equal(result.poolId, 'pool-456')
    assert.equal(result.metrics.length, 1)
    assert.equal(result.metrics[0]!.value, 0.75)
  })
})
