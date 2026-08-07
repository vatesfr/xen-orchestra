import assert from 'assert/strict'
import test from 'node:test'

import {
  describeTwinstorState,
  isTwinstorDaemonAlive,
  isTwinstorHost,
  isTwinstorSr,
  parseTwinstorSrState,
  TWINSTOR_ALIVE_STALE_PERIOD,
  TWINSTOR_STALE_PERIOD,
} from './_twinstor.mjs'

const { describe, it } = test

const NOW = 1_700_000_000_000
const stamp = (msAgo = 0) => String(Math.round((NOW - msAgo) / 1e3))

const synced = (msAgo = 0) => ({
  'twinstor-schema': '1',
  'twinstor-managed': 'true',
  'twinstor-synced': 'true',
  'twinstor-storage-state': 'synced',
  'twinstor-sync-pct': '100',
  'twinstor-sync-eta': '0',
  'twinstor-updated-at': stamp(msAgo),
})

const syncing = (msAgo = 0) => ({
  'twinstor-schema': '1',
  'twinstor-managed': 'true',
  'twinstor-synced': 'false',
  'twinstor-storage-state': 'syncing',
  'twinstor-sync-pct': '42',
  'twinstor-sync-eta': '600',
  'twinstor-updated-at': stamp(msAgo),
})

describe('isTwinstorSr', function () {
  it('detects a TWINSTOR SR', function () {
    assert.equal(isTwinstorSr(synced()), true)
  })

  it('falls back on the sync flag when the managed flag is missing', function () {
    assert.equal(isTwinstorSr({ 'twinstor-synced': 'false' }), true)
  })

  it('ignores other SRs', function () {
    assert.equal(isTwinstorSr({ 'some-key': 'true' }), false)
    assert.equal(isTwinstorSr({}), false)
    assert.equal(isTwinstorSr(undefined), false)
  })
})

describe('parseTwinstorSrState', function () {
  it('reports a fresh synced advertisement as synced', function () {
    const state = parseTwinstorSrState(synced(), { now: NOW })
    assert.equal(state.isSynced, true)
    assert.equal(state.isStale, false)
    assert.equal(state.state, 'synced')
    assert.equal(state.progress, 100)
  })

  it('reports a running resync', function () {
    const state = parseTwinstorSrState(syncing(), { now: NOW })
    assert.equal(state.isSynced, false)
    assert.equal(state.progress, 42)
    assert.equal(state.eta, 600)
  })

  // the case this whole gate exists for: a host which just rebooted leaves the
  // advertisement frozen on `synced=true`, since that is what allowed its reboot
  it('never reports a stale advertisement as synced', function () {
    const state = parseTwinstorSrState(synced(TWINSTOR_STALE_PERIOD), { now: NOW })
    assert.equal(state.isStale, true)
    assert.equal(state.isSynced, false)
  })

  it('rejects a stamp coming from a clock far ahead of XO', function () {
    const state = parseTwinstorSrState(synced(-TWINSTOR_STALE_PERIOD), { now: NOW })
    assert.equal(state.isStale, true)
    assert.equal(state.isSynced, false)
  })

  it('treats a missing or unparsable stamp as stale', function () {
    for (const value of [undefined, '', 'not-a-number']) {
      const state = parseTwinstorSrState({ ...synced(), 'twinstor-updated-at': value }, { now: NOW })
      assert.equal(state.isStale, true, `stamp: ${value}`)
      assert.equal(state.isSynced, false, `stamp: ${value}`)
    }
  })

  it('discards the -1 the daemon reports for an unknown ETA', function () {
    const state = parseTwinstorSrState({ ...syncing(), 'twinstor-sync-eta': '-1' }, { now: NOW })
    assert.equal(state.eta, undefined)
    assert.equal(state.progress, 42)
  })

  it('does not report a degraded storage as synced', function () {
    const otherConfig = { ...synced(), 'twinstor-synced': 'false', 'twinstor-storage-state': 'degraded' }
    assert.equal(parseTwinstorSrState(otherConfig, { now: NOW }).isSynced, false)
  })

  it('accepts the schema it knows, and the absence of one', function () {
    assert.equal(parseTwinstorSrState(synced(), { now: NOW }).isSchemaSupported, true)
    const legacy = { ...synced(), 'twinstor-schema': undefined }
    assert.equal(parseTwinstorSrState(legacy, { now: NOW }).isSchemaSupported, true)
  })

  // the daemon bumps the schema when the meaning of the keys changes, so a
  // `twinstor-synced` from an unknown one cannot be taken at face value
  it('rejects a schema it does not know', function () {
    const future = { ...synced(), 'twinstor-schema': '2' }
    const state = parseTwinstorSrState(future, { now: NOW })
    assert.equal(state.isSchemaSupported, false)
    assert.equal(state.schema, '2')
  })

  // the daemon republishes only the keys it *believes* changed, against a cache
  // which outlives a pool-master change: any divergence must fail closed
  it('requires the sync flag and the state to agree', function () {
    const flagOnly = { ...synced(), 'twinstor-storage-state': 'syncing' }
    assert.equal(parseTwinstorSrState(flagOnly, { now: NOW }).isSynced, false)
    const stateOnly = { ...synced(), 'twinstor-synced': 'false' }
    assert.equal(parseTwinstorSrState(stateOnly, { now: NOW }).isSynced, false)
  })

  it('treats a blank number as absent rather than as zero', function () {
    const blank = { ...syncing(), 'twinstor-sync-pct': '', 'twinstor-sync-eta': ' ' }
    const state = parseTwinstorSrState(blank, { now: NOW })
    assert.equal(state.progress, undefined)
    assert.equal(state.eta, undefined)
    // an empty stamp must not date the advertisement to the Unix epoch
    assert.equal(parseTwinstorSrState({ ...synced(), 'twinstor-updated-at': '' }).updatedAt, undefined)
  })

  it('survives a garbage or absent other_config', function () {
    for (const otherConfig of [undefined, {}, { 'twinstor-synced': 'yes' }]) {
      const state = parseTwinstorSrState(otherConfig, { now: NOW })
      assert.equal(state.isSynced, false)
      assert.equal(state.isStale, true)
    }
  })
})

describe('isTwinstorHost / isTwinstorDaemonAlive', function () {
  it('recognizes a host TWINSTOR is or was installed on', function () {
    assert.equal(isTwinstorHost({ 'twinstor-version': '0.5.0' }), true)
    assert.equal(isTwinstorHost({}), false)
  })

  it('reports a freshly stamped daemon as alive', function () {
    assert.equal(isTwinstorDaemonAlive({ 'twinstor-alive': stamp(60e3) }, { now: NOW }), true)
  })

  // the stamp is removed on a graceful stop and simply ages out on a crash;
  // either way DRBD keeps running in the kernel and the pair still looks healthy
  it('reports a stopped or stale daemon as down', function () {
    assert.equal(isTwinstorDaemonAlive({}, { now: NOW }), false)
    assert.equal(isTwinstorDaemonAlive({ 'twinstor-alive': stamp(TWINSTOR_ALIVE_STALE_PERIOD) }, { now: NOW }), false)
    assert.equal(isTwinstorDaemonAlive({ 'twinstor-alive': '' }, { now: NOW }), false)
  })
})

describe('describeTwinstorState', function () {
  it('describes a running resync with its progress and ETA', function () {
    const description = describeTwinstorState(parseTwinstorSrState(syncing(), { now: NOW }), { now: NOW })
    assert.match(description, /catching up/)
    assert.match(description, /42%/)
    assert.match(description, /10 min left/)
  })

  it('describes a degraded storage', function () {
    const otherConfig = { ...synced(), 'twinstor-synced': 'false', 'twinstor-storage-state': 'degraded' }
    const description = describeTwinstorState(parseTwinstorSrState(otherConfig, { now: NOW }), { now: NOW })
    assert.match(description, /no redundant copy/)
  })

  it('points at the daemon and the clocks when the advertisement is stale', function () {
    const state = parseTwinstorSrState(synced(10 * 60e3), { now: NOW })
    const description = describeTwinstorState(state, { now: NOW })
    assert.match(description, /unknown/)
    assert.match(description, /10 minutes old/)
    assert.match(description, /clock/)
  })

  it('does not claim an ETA it does not have', function () {
    const otherConfig = { ...syncing(), 'twinstor-sync-eta': '-1' }
    const description = describeTwinstorState(parseTwinstorSrState(otherConfig, { now: NOW }), { now: NOW })
    assert.match(description, /\(42%\)/)
  })

  // the ETA is what tells an operator whether to raise the timeout or go and
  // look at the replication link: never drop it just because progress is missing
  it('still reports the ETA when the progress is unknown', function () {
    const otherConfig = { ...syncing(), 'twinstor-sync-pct': '' }
    const description = describeTwinstorState(parseTwinstorSrState(otherConfig, { now: NOW }), { now: NOW })
    assert.match(description, /\(~10 min left\)/)
  })

  it('describes a stalled resync', function () {
    const otherConfig = { ...syncing(), 'twinstor-storage-state': 'stalled', 'twinstor-sync-eta': '-1' }
    const description = describeTwinstorState(parseTwinstorSrState(otherConfig, { now: NOW }), { now: NOW })
    assert.match(description, /not making progress \(42%\)/)
  })

  it('does not print a bare "undefined" for a missing state', function () {
    const otherConfig = { 'twinstor-synced': 'false', 'twinstor-updated-at': stamp() }
    const description = describeTwinstorState(parseTwinstorSrState(otherConfig, { now: NOW }), { now: NOW })
    assert.equal(description, 'TWINSTOR published no state')
  })
})
