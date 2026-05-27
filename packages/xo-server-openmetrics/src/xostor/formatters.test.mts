/**
 * Tests for XOSTOR metric formatters.
 *
 * Covers the four `formatXostor*Metrics` functions moved out of
 * `openmetric-formatter.mts` into `./formatters.mjs`.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatXostorAlarmsMetrics,
  formatXostorClusterMetrics,
  formatXostorSmartMetrics,
  formatXostorUpdatesMetrics,
} from './formatters.mjs'

import { formatToOpenMetrics } from '../formatter/primitives.mjs'

import type { XostorAlarmsItem, XostorClusterItem, XostorSmartHost, XostorUpdateItem } from '../types/xostor.mjs'

// ============================================================================
// formatXostorClusterMetrics Tests
// ============================================================================

describe('formatXostorClusterMetrics', () => {
  const makeCluster = (overrides: Partial<XostorClusterItem> = {}): XostorClusterItem => ({
    sr_uuid: 'sr-xostor-1',
    pool_id: 'pool-1',
    pool_name: 'Production',
    up: true,
    nodes: [
      { node_name: 'host-a', role: 'master', state: 'ONLINE' },
      { node_name: 'host-b', role: 'satellite', state: 'ONLINE' },
      { node_name: 'host-c', role: 'satellite', state: 'ONLINE' },
    ],
    resourceCount: 12,
    replicaStates: {},
    ...overrides,
  })

  it('should return empty array for empty input', () => {
    const result = formatXostorClusterMetrics({ clusters: [] })
    assert.deepEqual(result, [])
  })

  it('should emit xcp_xostor_up metric per cluster with value 1 on success', () => {
    const result = formatXostorClusterMetrics({ clusters: [makeCluster()] })
    const up = result.find(m => m.name === 'xcp_xostor_up')
    assert.ok(up)
    assert.equal(up.type, 'gauge')
    assert.equal(up.value, 1)
    assert.equal(up.labels.sr_uuid, 'sr-xostor-1')
    assert.equal(up.labels.pool_id, 'pool-1')
    assert.equal(up.labels.pool_name, 'Production')
  })

  it('should emit xcp_xostor_up with value 0 when collection failed', () => {
    const result = formatXostorClusterMetrics({
      clusters: [makeCluster({ up: false, nodes: [], resourceCount: 0 })],
    })
    const up = result.find(m => m.name === 'xcp_xostor_up')
    assert.ok(up)
    assert.equal(up.value, 0)
  })

  it('should emit one xcp_xostor_node_status per node with role and state labels', () => {
    const result = formatXostorClusterMetrics({ clusters: [makeCluster()] })
    const nodeMetrics = result.filter(m => m.name === 'xcp_xostor_node_status')

    assert.equal(nodeMetrics.length, 3)
    for (const m of nodeMetrics) {
      assert.equal(m.type, 'gauge')
      assert.equal(m.value, 1)
      assert.equal(m.labels.sr_uuid, 'sr-xostor-1')
      assert.equal(m.labels.pool_id, 'pool-1')
      assert.equal(m.labels.pool_name, 'Production')
      assert.ok(m.labels.node_name)
      assert.ok(m.labels.role)
      assert.ok(m.labels.state)
    }

    const masterMetric = nodeMetrics.find(m => m.labels.role === 'master')
    assert.ok(masterMetric)
    assert.equal(masterMetric.labels.node_name, 'host-a')

    const satelliteMetrics = nodeMetrics.filter(m => m.labels.role === 'satellite')
    assert.equal(satelliteMetrics.length, 2)
  })

  it('should emit xcp_xostor_resource_total gauge with count value', () => {
    const result = formatXostorClusterMetrics({ clusters: [makeCluster({ resourceCount: 42 })] })
    const total = result.find(m => m.name === 'xcp_xostor_resource_total')

    assert.ok(total)
    assert.equal(total.type, 'gauge')
    assert.equal(total.value, 42)
    assert.equal(total.labels.sr_uuid, 'sr-xostor-1')
    assert.equal(total.labels.pool_id, 'pool-1')
    assert.equal(total.labels.pool_name, 'Production')
  })

  it('should preserve offline node states (no filtering)', () => {
    const result = formatXostorClusterMetrics({
      clusters: [
        makeCluster({
          nodes: [
            { node_name: 'host-a', role: 'master', state: 'ONLINE' },
            { node_name: 'host-b', role: 'satellite', state: 'OFFLINE' },
          ],
        }),
      ],
    })

    const nodeMetrics = result.filter(m => m.name === 'xcp_xostor_node_status')
    assert.equal(nodeMetrics.length, 2)

    const offline = nodeMetrics.find(m => m.labels.state === 'OFFLINE')
    assert.ok(offline)
    assert.equal(offline.value, 1)
  })

  it('should omit pool_name label when empty', () => {
    const result = formatXostorClusterMetrics({ clusters: [makeCluster({ pool_name: '' })] })

    for (const metric of result) {
      assert.equal(metric.labels.pool_name, undefined)
    }
  })

  it('should handle cluster with no nodes (partial data tolerated)', () => {
    const result = formatXostorClusterMetrics({
      clusters: [makeCluster({ nodes: [], resourceCount: 0 })],
    })

    const upMetric = result.find(m => m.name === 'xcp_xostor_up')
    assert.ok(upMetric)
    assert.equal(result.filter(m => m.name === 'xcp_xostor_node_status').length, 0)

    const totalMetric = result.find(m => m.name === 'xcp_xostor_resource_total')
    assert.ok(totalMetric)
    assert.equal(totalMetric.value, 0)
  })

  it('should isolate clusters: each cluster emits its own set of metrics', () => {
    const result = formatXostorClusterMetrics({
      clusters: [
        makeCluster({ sr_uuid: 'sr-a', pool_id: 'pool-a', resourceCount: 5 }),
        makeCluster({ sr_uuid: 'sr-b', pool_id: 'pool-b', resourceCount: 7 }),
      ],
    })

    const upMetrics = result.filter(m => m.name === 'xcp_xostor_up')
    assert.equal(upMetrics.length, 2)
    assert.ok(upMetrics.some(m => m.labels.sr_uuid === 'sr-a'))
    assert.ok(upMetrics.some(m => m.labels.sr_uuid === 'sr-b'))

    const resourceMetrics = result.filter(m => m.name === 'xcp_xostor_resource_total')
    assert.equal(resourceMetrics.length, 2)
    const valuesBySr = new Map(resourceMetrics.map(m => [m.labels.sr_uuid, m.value]))
    assert.equal(valuesBySr.get('sr-a'), 5)
    assert.equal(valuesBySr.get('sr-b'), 7)
  })

  it('should produce metrics that round-trip through formatToOpenMetrics', () => {
    const metrics = formatXostorClusterMetrics({ clusters: [makeCluster()] })
    const output = formatToOpenMetrics(metrics)

    assert.match(output, /# HELP xcp_xostor_up /)
    assert.match(output, /# TYPE xcp_xostor_up gauge/)
    assert.match(output, /# HELP xcp_xostor_node_status /)
    assert.match(output, /# TYPE xcp_xostor_node_status gauge/)
    assert.match(output, /# HELP xcp_xostor_resource_total /)
    assert.match(output, /# TYPE xcp_xostor_resource_total gauge/)
    assert.match(output, /role="master"/)
    assert.match(output, /role="satellite"/)
  })

  it('should emit no resource_state_count when replicaStates is empty', () => {
    const result = formatXostorClusterMetrics({ clusters: [makeCluster({ replicaStates: {} })] })
    const stateMetrics = result.filter(m => m.name === 'xcp_xostor_resource_state_count')
    assert.equal(stateMetrics.length, 0)
  })

  it('should emit one resource_state_count per state with the bucket count as value', () => {
    const result = formatXostorClusterMetrics({
      clusters: [
        makeCluster({
          replicaStates: { UpToDate: 28, Inconsistent: 2 },
        }),
      ],
    })

    const stateMetrics = result.filter(m => m.name === 'xcp_xostor_resource_state_count')
    assert.equal(stateMetrics.length, 2)
    for (const m of stateMetrics) {
      assert.equal(m.type, 'gauge')
      assert.equal(m.labels.sr_uuid, 'sr-xostor-1')
      assert.equal(m.labels.pool_id, 'pool-1')
      assert.equal(m.labels.pool_name, 'Production')
      assert.ok(m.labels.state)
    }

    const valuesByState = new Map(stateMetrics.map(m => [m.labels.state, m.value]))
    assert.equal(valuesByState.get('UpToDate'), 28)
    assert.equal(valuesByState.get('Inconsistent'), 2)
  })

  it('should preserve raw state names verbatim (no case normalization)', () => {
    const result = formatXostorClusterMetrics({
      clusters: [
        makeCluster({
          replicaStates: { UpToDate: 5, Outdated: 1, Diskless: 3, Unknown: 0 },
        }),
      ],
    })

    const states = new Set(result.filter(m => m.name === 'xcp_xostor_resource_state_count').map(m => m.labels.state))

    assert.ok(states.has('UpToDate'))
    assert.ok(states.has('Outdated'))
    assert.ok(states.has('Diskless'))
    assert.ok(states.has('Unknown'))
  })

  it('should omit pool_name on resource_state_count when pool_name empty', () => {
    const result = formatXostorClusterMetrics({
      clusters: [makeCluster({ pool_name: '', replicaStates: { UpToDate: 3 } })],
    })

    const stateMetric = result.find(m => m.name === 'xcp_xostor_resource_state_count')
    assert.ok(stateMetric)
    assert.equal(stateMetric.labels.pool_name, undefined)
  })

  it('should isolate replicaStates per cluster', () => {
    const result = formatXostorClusterMetrics({
      clusters: [
        makeCluster({ sr_uuid: 'sr-a', replicaStates: { UpToDate: 9 } }),
        makeCluster({ sr_uuid: 'sr-b', replicaStates: { UpToDate: 6, Inconsistent: 1 } }),
      ],
    })

    const stateMetrics = result.filter(m => m.name === 'xcp_xostor_resource_state_count')
    assert.equal(stateMetrics.length, 3)

    const srAState = stateMetrics.find(m => m.labels.sr_uuid === 'sr-a')
    assert.ok(srAState)
    assert.equal(srAState.value, 9)

    const srBInconsistent = stateMetrics.find(m => m.labels.sr_uuid === 'sr-b' && m.labels.state === 'Inconsistent')
    assert.ok(srBInconsistent)
    assert.equal(srBInconsistent.value, 1)
  })
})

// ============================================================================
// formatXostorAlarmsMetrics Tests
// ============================================================================

describe('formatXostorAlarmsMetrics', () => {
  const makeCluster = (overrides: Partial<XostorAlarmsItem> = {}): XostorAlarmsItem => ({
    sr_uuid: 'sr-xostor-1',
    pool_id: 'pool-1',
    pool_name: 'Production',
    up: true,
    entries: [],
    ...overrides,
  })

  it('should return empty array for empty input', () => {
    const result = formatXostorAlarmsMetrics({ clusters: [] })
    assert.deepEqual(result, [])
  })

  it('should emit xcp_xostor_alarms_up per cluster with value 1 on success', () => {
    const result = formatXostorAlarmsMetrics({ clusters: [makeCluster()] })
    const up = result.find(m => m.name === 'xcp_xostor_alarms_up')

    assert.ok(up)
    assert.equal(up.type, 'gauge')
    assert.equal(up.value, 1)
    assert.equal(up.labels.sr_uuid, 'sr-xostor-1')
    assert.equal(up.labels.pool_id, 'pool-1')
    assert.equal(up.labels.pool_name, 'Production')
  })

  it('should emit xcp_xostor_alarms_up with value 0 when collection failed', () => {
    const result = formatXostorAlarmsMetrics({ clusters: [makeCluster({ up: false })] })
    const up = result.find(m => m.name === 'xcp_xostor_alarms_up')

    assert.ok(up)
    assert.equal(up.value, 0)
  })

  it('should emit one xcp_xostor_alarms_count per entry with count value', () => {
    const result = formatXostorAlarmsMetrics({
      clusters: [
        makeCluster({
          entries: [
            { alarm_name: 'ALARM', target_type: 'sr', count: 3 },
            { alarm_name: 'BOND_STATUS_CHANGED', target_type: 'host', count: 2 },
          ],
        }),
      ],
    })

    const counts = result.filter(m => m.name === 'xcp_xostor_alarms_count')
    assert.equal(counts.length, 2)

    const sr = counts.find(m => m.labels.alarm_name === 'ALARM')
    assert.ok(sr)
    assert.equal(sr.value, 3)
    assert.equal(sr.labels.target_type, 'sr')

    const host = counts.find(m => m.labels.alarm_name === 'BOND_STATUS_CHANGED')
    assert.ok(host)
    assert.equal(host.value, 2)
    assert.equal(host.labels.target_type, 'host')
  })

  it('should emit no alarms_count when entries is empty', () => {
    const result = formatXostorAlarmsMetrics({ clusters: [makeCluster({ entries: [] })] })
    const counts = result.filter(m => m.name === 'xcp_xostor_alarms_count')
    assert.equal(counts.length, 0)

    const up = result.find(m => m.name === 'xcp_xostor_alarms_up')
    assert.ok(up)
  })

  it('should omit pool_name label when empty', () => {
    const result = formatXostorAlarmsMetrics({
      clusters: [
        makeCluster({
          pool_name: '',
          entries: [{ alarm_name: 'ALARM', target_type: 'sr', count: 1 }],
        }),
      ],
    })

    for (const m of result) {
      assert.equal(m.labels.pool_name, undefined)
    }
  })

  it('should isolate alarms_count per cluster', () => {
    const result = formatXostorAlarmsMetrics({
      clusters: [
        makeCluster({
          sr_uuid: 'sr-a',
          entries: [{ alarm_name: 'ALARM', target_type: 'sr', count: 5 }],
        }),
        makeCluster({
          sr_uuid: 'sr-b',
          entries: [{ alarm_name: 'MULTIPATH_PERIODIC_ALERT', target_type: 'host', count: 2 }],
        }),
      ],
    })

    const counts = result.filter(m => m.name === 'xcp_xostor_alarms_count')
    assert.equal(counts.length, 2)

    const a = counts.find(m => m.labels.sr_uuid === 'sr-a')
    assert.ok(a)
    assert.equal(a.value, 5)
    assert.equal(a.labels.alarm_name, 'ALARM')

    const b = counts.find(m => m.labels.sr_uuid === 'sr-b')
    assert.ok(b)
    assert.equal(b.value, 2)
    assert.equal(b.labels.alarm_name, 'MULTIPATH_PERIODIC_ALERT')
  })

  it('should produce metrics that round-trip through formatToOpenMetrics', () => {
    const result = formatXostorAlarmsMetrics({
      clusters: [
        makeCluster({
          entries: [
            { alarm_name: 'ALARM', target_type: 'sr', count: 1 },
            { alarm_name: 'BOND_STATUS_CHANGED', target_type: 'host', count: 2 },
          ],
        }),
      ],
    })
    const output = formatToOpenMetrics(result)

    assert.match(output, /# HELP xcp_xostor_alarms_up /)
    assert.match(output, /# TYPE xcp_xostor_alarms_up gauge/)
    assert.match(output, /# HELP xcp_xostor_alarms_count /)
    assert.match(output, /# TYPE xcp_xostor_alarms_count gauge/)
    assert.match(output, /alarm_name="ALARM"/)
    assert.match(output, /target_type="host"/)
  })
})

// ============================================================================
// formatXostorSmartMetrics Tests
// ============================================================================

describe('formatXostorSmartMetrics', () => {
  const makeHost = (overrides: Partial<XostorSmartHost> = {}): XostorSmartHost => ({
    sr_uuid: 'sr-xostor-1',
    pool_id: 'pool-1',
    pool_name: 'Production',
    host_uuid: 'host-a-uuid',
    host_name: 'host-a',
    up: true,
    devices: [
      { device: 'sda', status: 'PASSED' },
      { device: 'sdb', status: 'PASSED' },
    ],
    ...overrides,
  })

  it('should return empty array for empty input', () => {
    const result = formatXostorSmartMetrics({ hosts: [] })
    assert.deepEqual(result, [])
  })

  it('should emit xcp_xostor_smart_up per host with value 1 on success', () => {
    const result = formatXostorSmartMetrics({ hosts: [makeHost()] })
    const up = result.find(m => m.name === 'xcp_xostor_smart_up')

    assert.ok(up)
    assert.equal(up.type, 'gauge')
    assert.equal(up.value, 1)
    assert.equal(up.labels.sr_uuid, 'sr-xostor-1')
    assert.equal(up.labels.pool_id, 'pool-1')
    assert.equal(up.labels.pool_name, 'Production')
    assert.equal(up.labels.host_uuid, 'host-a-uuid')
    assert.equal(up.labels.host_name, 'host-a')
  })

  it('should emit xcp_xostor_smart_up with value 0 when plugin call failed', () => {
    const result = formatXostorSmartMetrics({ hosts: [makeHost({ up: false, devices: [] })] })
    const up = result.find(m => m.name === 'xcp_xostor_smart_up')

    assert.ok(up)
    assert.equal(up.value, 0)
  })

  it('should emit one xcp_xostor_disk_smart_status per device with value 1', () => {
    const result = formatXostorSmartMetrics({ hosts: [makeHost()] })
    const disks = result.filter(m => m.name === 'xcp_xostor_disk_smart_status')

    assert.equal(disks.length, 2)
    for (const m of disks) {
      assert.equal(m.type, 'gauge')
      assert.equal(m.value, 1)
      assert.equal(m.labels.host_uuid, 'host-a-uuid')
      assert.equal(m.labels.host_name, 'host-a')
      assert.ok(m.labels.device)
      assert.ok(m.labels.status)
    }

    const sda = disks.find(m => m.labels.device === 'sda')
    assert.ok(sda)
    assert.equal(sda.labels.status, 'PASSED')
  })

  it('should preserve mixed status strings verbatim (no normalization)', () => {
    const result = formatXostorSmartMetrics({
      hosts: [
        makeHost({
          devices: [
            { device: 'sda', status: 'PASSED' },
            { device: 'sdb', status: 'FAILED' },
            { device: 'nvme0n1', status: 'UNKNOWN' },
          ],
        }),
      ],
    })

    const statuses = new Set(result.filter(m => m.name === 'xcp_xostor_disk_smart_status').map(m => m.labels.status))
    assert.ok(statuses.has('PASSED'))
    assert.ok(statuses.has('FAILED'))
    assert.ok(statuses.has('UNKNOWN'))
  })

  it('should emit only smart_up (no disk metrics) when devices is empty and up=true', () => {
    const result = formatXostorSmartMetrics({ hosts: [makeHost({ devices: [] })] })

    const up = result.find(m => m.name === 'xcp_xostor_smart_up')
    assert.ok(up)
    assert.equal(up.value, 1)

    const disks = result.filter(m => m.name === 'xcp_xostor_disk_smart_status')
    assert.equal(disks.length, 0)
  })

  it('should omit pool_name and host_name labels when empty', () => {
    const result = formatXostorSmartMetrics({
      hosts: [makeHost({ pool_name: '', host_name: '' })],
    })

    for (const m of result) {
      assert.equal(m.labels.pool_name, undefined)
      assert.equal(m.labels.host_name, undefined)
    }
  })

  it('should isolate disks per host across multiple hosts', () => {
    const result = formatXostorSmartMetrics({
      hosts: [
        makeHost({ host_uuid: 'host-a', devices: [{ device: 'sda', status: 'PASSED' }] }),
        makeHost({ host_uuid: 'host-b', devices: [{ device: 'sdc', status: 'FAILED' }] }),
      ],
    })

    const disks = result.filter(m => m.name === 'xcp_xostor_disk_smart_status')
    assert.equal(disks.length, 2)

    const a = disks.find(m => m.labels.host_uuid === 'host-a')
    assert.ok(a)
    assert.equal(a.labels.device, 'sda')

    const b = disks.find(m => m.labels.host_uuid === 'host-b')
    assert.ok(b)
    assert.equal(b.labels.device, 'sdc')
    assert.equal(b.labels.status, 'FAILED')
  })

  it('should produce metrics that round-trip through formatToOpenMetrics', () => {
    const metrics = formatXostorSmartMetrics({ hosts: [makeHost()] })
    const output = formatToOpenMetrics(metrics)

    assert.match(output, /# HELP xcp_xostor_smart_up /)
    assert.match(output, /# TYPE xcp_xostor_smart_up gauge/)
    assert.match(output, /# HELP xcp_xostor_disk_smart_status /)
    assert.match(output, /# TYPE xcp_xostor_disk_smart_status gauge/)
    assert.match(output, /device="sda"/)
    assert.match(output, /status="PASSED"/)
  })
})

// ============================================================================
// formatXostorUpdatesMetrics Tests
// ============================================================================

describe('formatXostorUpdatesMetrics', () => {
  const makeHost = (overrides: Partial<XostorUpdateItem> = {}): XostorUpdateItem => ({
    sr_uuid: 'sr-xostor-1',
    pool_id: 'pool-1',
    pool_name: 'Production',
    host_uuid: 'host-a-uuid',
    host_name: 'host-a',
    up: true,
    packages: [],
    ...overrides,
  })

  it('should return empty array for empty input', () => {
    const result = formatXostorUpdatesMetrics({ hosts: [] })
    assert.deepEqual(result, [])
  })

  it('should emit xcp_xostor_updates_up per host with value 1 on success', () => {
    const result = formatXostorUpdatesMetrics({ hosts: [makeHost()] })
    const up = result.find(m => m.name === 'xcp_xostor_updates_up')

    assert.ok(up)
    assert.equal(up.type, 'gauge')
    assert.equal(up.value, 1)
    assert.equal(up.labels.sr_uuid, 'sr-xostor-1')
    assert.equal(up.labels.pool_id, 'pool-1')
    assert.equal(up.labels.pool_name, 'Production')
    assert.equal(up.labels.host_uuid, 'host-a-uuid')
    assert.equal(up.labels.host_name, 'host-a')
  })

  it('should emit xcp_xostor_updates_up with value 0 when collection failed', () => {
    const result = formatXostorUpdatesMetrics({ hosts: [makeHost({ up: false })] })
    const up = result.find(m => m.name === 'xcp_xostor_updates_up')

    assert.ok(up)
    assert.equal(up.value, 0)
  })

  it('should emit one xcp_xostor_package_update_available per pending package', () => {
    const result = formatXostorUpdatesMetrics({
      hosts: [
        makeHost({
          packages: [{ package: 'linstor-satellite' }, { package: 'linstor-controller' }],
        }),
      ],
    })

    const updates = result.filter(m => m.name === 'xcp_xostor_package_update_available')
    assert.equal(updates.length, 2)
    for (const m of updates) {
      assert.equal(m.value, 1)
      assert.equal(m.type, 'gauge')
      assert.equal(m.labels.host_uuid, 'host-a-uuid')
      assert.ok(m.labels.package)
    }
    const packages = new Set(updates.map(m => m.labels.package))
    assert.ok(packages.has('linstor-satellite'))
    assert.ok(packages.has('linstor-controller'))
  })

  it('should emit only updates_up (no package metrics) when packages is empty and up=true', () => {
    const result = formatXostorUpdatesMetrics({ hosts: [makeHost({ packages: [] })] })

    const up = result.find(m => m.name === 'xcp_xostor_updates_up')
    assert.ok(up)
    assert.equal(up.value, 1)

    const updates = result.filter(m => m.name === 'xcp_xostor_package_update_available')
    assert.equal(updates.length, 0)
  })

  it('should omit pool_name and host_name labels when empty', () => {
    const result = formatXostorUpdatesMetrics({
      hosts: [makeHost({ pool_name: '', host_name: '', packages: [{ package: 'linstor-satellite' }] })],
    })

    for (const m of result) {
      assert.equal(m.labels.pool_name, undefined)
      assert.equal(m.labels.host_name, undefined)
    }
  })

  it('should isolate packages per host across multiple hosts', () => {
    const result = formatXostorUpdatesMetrics({
      hosts: [
        makeHost({ host_uuid: 'host-a', packages: [{ package: 'linstor-satellite' }] }),
        makeHost({ host_uuid: 'host-b', packages: [{ package: 'xcp-ng-linstor' }] }),
      ],
    })

    const updates = result.filter(m => m.name === 'xcp_xostor_package_update_available')
    assert.equal(updates.length, 2)

    const a = updates.find(m => m.labels.host_uuid === 'host-a')
    assert.ok(a)
    assert.equal(a.labels.package, 'linstor-satellite')

    const b = updates.find(m => m.labels.host_uuid === 'host-b')
    assert.ok(b)
    assert.equal(b.labels.package, 'xcp-ng-linstor')
  })

  it('should dedupe duplicate package entries per host', () => {
    const result = formatXostorUpdatesMetrics({
      hosts: [
        makeHost({
          packages: [
            { package: 'linstor-satellite' },
            { package: 'linstor-satellite' }, // dup, should be merged
          ],
        }),
      ],
    })

    const updates = result.filter(m => m.name === 'xcp_xostor_package_update_available')
    assert.equal(updates.length, 1)
  })

  it('should produce metrics that round-trip through formatToOpenMetrics', () => {
    const metrics = formatXostorUpdatesMetrics({
      hosts: [makeHost({ packages: [{ package: 'linstor-controller' }] })],
    })
    const output = formatToOpenMetrics(metrics)

    assert.match(output, /# HELP xcp_xostor_updates_up /)
    assert.match(output, /# TYPE xcp_xostor_updates_up gauge/)
    assert.match(output, /# HELP xcp_xostor_package_update_available /)
    assert.match(output, /# TYPE xcp_xostor_package_update_available gauge/)
    assert.match(output, /package="linstor-controller"/)
  })
})
