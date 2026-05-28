/**
 * Unit tests for the XOSTOR collectors.
 *
 * `getXostorAlarms` is pure (in-memory scan), so it is tested directly.
 * `collectXostorData` / `fetchHostSmart` / `fetchHostUpdates` perform XAPI
 * plugin calls via `xo.getXapi(sr).callAsync(...)`; the fake `xo` returns a
 * stub XAPI whose `callAsync` resolves a canned JSON string (or throws to
 * exercise the `up: false` path). The cache wrappers are driven through a real
 * `TtlCache` to confirm the deps object is threaded correctly.
 *
 * These collectors were extracted verbatim from `OpenMetricsPlugin` in
 * commit 6; the tests pin the contract.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { XoApp } from '@vates/types'

import { TtlCache } from '../utils/ttl-cache.mjs'
import type { XostorPayload, XostorSmartPayload, XostorUpdatesPayload } from '../types/xostor.mjs'
import {
  collectXostorData,
  fetchHostSmart,
  fetchHostUpdates,
  getXostorAlarms,
  getXostorData,
  type XostorCollectorDeps,
} from './collectors.mjs'

// ----------------------------------------------------------------------------
// Fake XoApp
// ----------------------------------------------------------------------------

type ObjectsByType = Partial<Record<string, Record<string, unknown>>>

/**
 * Build a fake `XoApp` answering `getObjects({ filter: { type } })` from the
 * per-type fixture map, and `getXapi()` with a stub XAPI whose `callAsync`
 * runs `callAsyncImpl` (defaults to a resolved empty-object JSON string).
 */
function fakeXo(
  objectsByType: ObjectsByType,
  callAsyncImpl: (...args: unknown[]) => Promise<string> = async () => '{}'
): XoApp {
  return {
    getObjects(opts?: { filter?: Record<string, unknown> }) {
      const type = opts?.filter?.type as string | undefined
      return type === undefined ? {} : (objectsByType[type] ?? {})
    },
    getXapi() {
      return { callAsync: callAsyncImpl }
    },
  } as unknown as XoApp
}

function depsFor(xo: XoApp): XostorCollectorDeps {
  return {
    xo,
    healthCheckCache: new TtlCache<XostorPayload>(60_000),
    smartCache: new TtlCache<XostorSmartPayload>(60_000),
    updatesCache: new TtlCache<XostorUpdatesPayload>(60_000),
  }
}

// ----------------------------------------------------------------------------
// getXostorAlarms (pure)
// ----------------------------------------------------------------------------

describe('getXostorAlarms', () => {
  it('returns no clusters when there are no linstor SRs', () => {
    const xo = fakeXo({ SR: { 'sr-1': { uuid: 'sr-1', SR_type: 'nfs', type: 'SR' } } })
    assert.deepEqual(getXostorAlarms(xo), { clusters: [] })
  })

  it('buckets alarm messages by name and target type (sr vs host)', () => {
    const xo = fakeXo({
      SR: {
        'sr-1': { id: 'sr-1', uuid: 'sr-uuid-1', SR_type: 'linstor', $poolId: 'pool-1', $PBDs: ['pbd-1'], type: 'SR' },
      },
      pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', type: 'pool' } },
      PBD: { 'pbd-1': { host: 'host-1', type: 'PBD' } },
      message: {
        m1: { name: 'ALARM', $object: 'sr-1', type: 'message' },
        m2: { name: 'ALARM', $object: 'sr-1', type: 'message' },
        m3: { name: 'MULTIPATH_PERIODIC_ALERT', $object: 'host-1', type: 'message' },
        m4: { name: 'NOT_AN_ALARM', $object: 'sr-1', type: 'message' },
        m5: { name: 'ALARM', $object: 'unrelated', type: 'message' },
      },
    })

    const { clusters } = getXostorAlarms(xo)

    assert.equal(clusters.length, 1)
    assert.equal(clusters[0]!.sr_uuid, 'sr-uuid-1')
    assert.equal(clusters[0]!.pool_name, 'Pool One')
    const entries = clusters[0]!.entries
    // ALARM|sr (count 2) and MULTIPATH_PERIODIC_ALERT|host (count 1); the
    // non-alarm and the unrelated-target messages are excluded.
    assert.deepEqual(
      [...entries].sort((a, b) => a.alarm_name.localeCompare(b.alarm_name)),
      [
        { alarm_name: 'ALARM', target_type: 'sr', count: 2 },
        { alarm_name: 'MULTIPATH_PERIODIC_ALERT', target_type: 'host', count: 1 },
      ]
    )
  })
})

// ----------------------------------------------------------------------------
// collectXostorData (XAPI healthCheck)
// ----------------------------------------------------------------------------

describe('collectXostorData', () => {
  it('marks a cluster up: false when master or group-name is missing', async () => {
    const xo = fakeXo({
      SR: { 'sr-1': { uuid: 'sr-uuid-1', SR_type: 'linstor', $poolId: 'pool-1', $PBDs: [], type: 'SR' } },
      pool: {},
      host: {},
      PBD: {},
    })

    const { clusters } = await collectXostorData(xo)

    assert.equal(clusters.length, 1)
    assert.equal(clusters[0]!.up, false)
    assert.deepEqual(clusters[0]!.nodes, [])
  })

  it('parses healthCheck output into nodes and replica states when up', async () => {
    const healthCheck = JSON.stringify({
      nodes: { 'master-host': 'ONLINE', 'sat-host': 'ONLINE' },
      resources: { res1: { nodes: { n1: { volumes: [{ 'disk-state': 'UpToDate' }] } } } },
    })
    const xo = fakeXo(
      {
        SR: { 'sr-1': { uuid: 'sr-uuid-1', SR_type: 'linstor', $poolId: 'pool-1', $PBDs: ['pbd-1'], type: 'SR' } },
        pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', master: 'host-1', type: 'pool' } },
        host: { 'host-1': { uuid: 'host-1', hostname: 'master-host', _xapiRef: 'OpaqueRef:host-1', type: 'host' } },
        PBD: { 'pbd-1': { host: 'host-1', device_config: { 'group-name': 'linstor_group' }, type: 'PBD' } },
      },
      async () => healthCheck
    )

    const { clusters } = await collectXostorData(xo)

    assert.equal(clusters.length, 1)
    assert.equal(clusters[0]!.up, true)
    assert.equal(clusters[0]!.resourceCount, 1)
    assert.deepEqual(clusters[0]!.replicaStates, { UpToDate: 1 })
    const roles = clusters[0]!.nodes.map(n => `${n.node_name}:${n.role}`).sort()
    assert.deepEqual(roles, ['master-host:master', 'sat-host:satellite'])
  })
})

// ----------------------------------------------------------------------------
// fetchHostSmart / fetchHostUpdates (per-host XAPI, failure isolation)
// ----------------------------------------------------------------------------

describe('fetchHostSmart', () => {
  it('returns up: false with empty devices when the plugin call throws', async () => {
    const xo = fakeXo({}, async () => {
      throw new Error('smartctl missing')
    })
    const sr = { uuid: 'sr-uuid-1', $poolId: 'pool-1' } as never
    const host = { uuid: 'host-1', name_label: 'Host One', _xapiRef: 'OpaqueRef:host-1' } as never

    const result = await fetchHostSmart(xo, sr, 'Pool One', host)

    assert.equal(result.up, false)
    assert.deepEqual(result.devices, [])
    assert.equal(result.host_uuid, 'host-1')
  })

  it('parses SMART devices when the plugin call succeeds', async () => {
    const xo = fakeXo({}, async () => JSON.stringify({ '/dev/sda': 'PASSED' }))
    const sr = { uuid: 'sr-uuid-1', $poolId: 'pool-1' } as never
    const host = { uuid: 'host-1', name_label: 'Host One', _xapiRef: 'OpaqueRef:host-1' } as never

    const result = await fetchHostSmart(xo, sr, 'Pool One', host)

    assert.equal(result.up, true)
    assert.deepEqual(result.devices, [{ device: '/dev/sda', status: 'PASSED' }])
  })
})

describe('fetchHostUpdates', () => {
  it('returns up: false when the plugin call throws', async () => {
    const xo = fakeXo({}, async () => {
      throw new Error('updater unavailable')
    })
    const sr = { uuid: 'sr-uuid-1', $poolId: 'pool-1' } as never
    const host = { uuid: 'host-1', name_label: 'Host One', _xapiRef: 'OpaqueRef:host-1' } as never

    const result = await fetchHostUpdates(xo, sr, 'Pool One', host)

    assert.equal(result.up, false)
    assert.deepEqual(result.packages, [])
  })
})

// ----------------------------------------------------------------------------
// cache wrapper threading
// ----------------------------------------------------------------------------

describe('getXostorData (cache wrapper)', () => {
  it('caches the collected payload across calls (single XAPI invocation)', async () => {
    let calls = 0
    const xo = fakeXo(
      {
        SR: { 'sr-1': { uuid: 'sr-uuid-1', SR_type: 'linstor', $poolId: 'pool-1', $PBDs: ['pbd-1'], type: 'SR' } },
        pool: { 'pool-1': { uuid: 'pool-1', name_label: 'Pool One', master: 'host-1', type: 'pool' } },
        host: { 'host-1': { uuid: 'host-1', hostname: 'master-host', _xapiRef: 'OpaqueRef:host-1', type: 'host' } },
        PBD: { 'pbd-1': { host: 'host-1', device_config: { 'group-name': 'g' }, type: 'PBD' } },
      },
      async () => {
        calls++
        return JSON.stringify({ nodes: { 'master-host': 'ONLINE' }, resources: {} })
      }
    )
    const deps = depsFor(xo)

    const first = await getXostorData(deps)
    const second = await getXostorData(deps)

    assert.equal(calls, 1) // second call served from cache
    assert.deepEqual(first, second)
    assert.equal(first.clusters[0]!.up, true)
  })
})
