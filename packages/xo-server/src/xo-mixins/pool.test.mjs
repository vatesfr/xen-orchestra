import assert from 'node:assert/strict'
import { after, describe, it } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { forbiddenOperation, incorrectState, noSuchObject } from 'xo-common/api-errors.js'
import { Task } from '@vates/task'

import Pools from './pool.mjs'
import { acquireRpuGuard } from '../_rpuGuard.mjs'
import { createRpuRecoveryRecord } from '../_rpuRecovery.mjs'

const pool = { id: 'pool-1', name_label: 'pool 1' }
const tracesDir = mkdtempSync(join(tmpdir(), 'xo-rpr-test-'))
after(() => rmSync(tracesDir, { recursive: true, force: true }))

function createApp({ backupRunning = false } = {}) {
  const calls = []
  return {
    calls,
    hooks: { on() {} },
    config: {
      getOptional: key => (key === 'rpu.tracesDir' ? tracesDir : undefined),
      getOptionalDuration: () => undefined,
    },
    tasks: { create: properties => new Task({ properties }) },
    async checkFeatureAuthorization() {},
    async backupGuard(poolId, opts) {
      calls.push(['backupGuard', poolId, opts])
      if (backupRunning) {
        throw forbiddenOperation('backup')
      }
    },
    getXapi: () => ({
      async rollingPoolReboot(task, opts) {
        calls.push(['xapi.rollingPoolReboot', opts])
      },
    }),
  }
}

describe('Pools.rollingPoolReboot', function () {
  it('is refused by the backup guard before anything else happens', async function () {
    const app = createApp({ backupRunning: true })
    await assert.rejects(new Pools(app).rollingPoolReboot(pool), forbiddenOperation.is)
    assert.deepEqual(app.calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: undefined, operation: 'rollingPoolReboot' }],
    ])
  })

  it('forwards bypassBackupCheck to the backup guard, then runs', async function () {
    const app = createApp()
    await new Pools(app).rollingPoolReboot(pool, { bypassBackupCheck: true, shutdownPinnedVms: true })
    assert.deepEqual(app.calls, [
      ['backupGuard', 'pool-1', { bypassBackupCheck: true, operation: 'rollingPoolReboot' }],
      ['xapi.rollingPoolReboot', { shutdownPinnedVms: true }],
    ])
  })
})

// the store of a pool with one record, or none; the string `garbage` stands
// for a value the store cannot decode
function makeStore(record) {
  const values = new Map(record === undefined ? [] : [['pool-1', record]])
  return {
    values,
    async get(key) {
      if (!values.has(key)) {
        throw Object.assign(new Error('not found'), { notFound: true })
      }
      if (values.get(key) === 'garbage') {
        throw new Error('could not decode')
      }
      return values.get(key)
    },
    async del(key) {
      values.delete(key)
    },
  }
}

function createPools({ record } = {}) {
  const app = createApp()
  app.tasks = {
    create(properties) {
      app.calls.push(['tasks.create', properties])
      return new Task({ properties })
    },
  }
  // HA left disabled, host 1 left disabled: what a dirty record lists
  app.getXapi = () => ({
    pool: { ha_enabled: false, wlb_enabled: true, other_config: {} },
    getObjectByUuid: id => (id === 'h1' ? { name_label: 'host 1', enabled: false } : undefined),
  })
  app.getOptionalPlugin = async () => undefined
  app.getAllSchedules = async () => []
  const pools = new Pools(app)
  const store = makeStore(record)
  pools._rpuRecoveryStore = store
  return { app, pools, store }
}

const makeRecord = patch => ({
  ...createRpuRecoveryRecord({ poolId: 'pool-1', options: {} }),
  runId: 'run-1',
  status: 'interrupted',
  ...patch,
})
const makeDirtyRecord = () =>
  makeRecord({
    changedByRun: { ha: true },
    hostOrder: ['h1'],
    hosts: { h1: { enabledBeforeUpdate: true, steps: { evacuate: { status: 'failed' } } } },
  })
const dirtyItems = [
  { type: 'ha', id: 'pool-1' },
  { type: 'host', id: 'h1', name: 'host 1' },
]

describe('Pools.finalizeRollingUpdate', function () {
  it('is refused while a rolling pool update or reboot runs on the pool', async function () {
    const { pools, store } = createPools({ record: makeRecord() })
    const release = acquireRpuGuard('pool-1', 'test')
    try {
      await assert.rejects(pools.finalizeRollingUpdate(pool, { force: true }), forbiddenOperation.is)
    } finally {
      release()
    }
    assert.equal(store.values.has('pool-1'), true)
  })

  it('has nothing to finalize when the pool has no record', async function () {
    const { app, pools } = createPools()
    await assert.rejects(pools.finalizeRollingUpdate(pool, { force: true }), error =>
      noSuchObject.is(error, { id: 'pool-1', type: 'rollingUpdateRecovery' })
    )
    assert.deepEqual(app.calls, [])
  })

  it('is refused while the record belongs to a live run', async function () {
    const { app, pools, store } = createPools({ record: makeRecord({ status: 'running' }) })
    await assert.rejects(pools.finalizeRollingUpdate(pool, { force: true }), error =>
      incorrectState.is(error, { actual: 'running', property: 'status' })
    )
    assert.equal(store.values.has('pool-1'), true)
    assert.deepEqual(app.calls, [])
  })

  it('is refused with the unrestored items, before any task, and keeps the record', async function () {
    const { app, pools, store } = createPools({ record: makeDirtyRecord() })
    const error = await pools.finalizeRollingUpdate(pool).then(
      () => assert.fail('should reject'),
      error => error
    )
    assert.equal(incorrectState.is(error, { property: 'unrestoredItems' }), true)
    assert.deepEqual(error.data, { actual: dirtyItems, expected: [], object: 'pool-1', property: 'unrestoredItems' })
    assert.equal(store.values.has('pool-1'), true)
    assert.deepEqual(app.calls, [])
  })

  it('deletes the record when the run left nothing unrestored', async function () {
    const { app, pools, store } = createPools({ record: makeRecord() })
    await pools.finalizeRollingUpdate(pool)
    assert.equal(store.values.has('pool-1'), false)
    assert.equal(app.calls.length, 1)
    const [[, { traceFile, ...properties }]] = app.calls
    assert.equal(typeof traceFile, 'string')
    assert.deepEqual(properties, {
      name: 'Finalize rolling pool update',
      objectId: 'pool-1',
      poolId: 'pool-1',
      poolName: 'pool 1',
      type: 'pool.rolling_update_finalize',
      runId: 'run-1',
      force: false,
      unrestoredItems: [],
    })
  })

  it('with force, deletes the record and writes the abandoned items to the task', async function () {
    const { app, pools, store } = createPools({ record: makeDirtyRecord() })
    await pools.finalizeRollingUpdate(pool, { force: true })
    assert.equal(store.values.has('pool-1'), false)
    const [[, { force, unrestoredItems }]] = app.calls
    assert.equal(force, true)
    assert.deepEqual(unrestoredItems, dirtyItems)
  })

  it('cannot tell what an unreadable record left behind: refused, deleted with force', async function () {
    const { app, pools, store } = createPools({ record: 'garbage' })
    const error = await pools.finalizeRollingUpdate(pool).then(
      () => assert.fail('should reject'),
      error => error
    )
    assert.equal(incorrectState.is(error, { property: 'unrestoredItems' }), true)
    assert.equal(error.data.actual, null)
    assert.equal(store.values.has('pool-1'), true)

    await pools.finalizeRollingUpdate(pool, { force: true })
    assert.equal(store.values.has('pool-1'), false)
    const [[, { runId, unrestoredItems }]] = app.calls
    assert.equal(runId, undefined)
    assert.equal(unrestoredItems, null)
  })
})
