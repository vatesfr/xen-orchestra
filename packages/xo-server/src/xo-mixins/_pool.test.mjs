import assert from 'node:assert/strict'
import { AsyncLocalStorage } from 'node:async_hooks'
import { after, describe, it } from 'node:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
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
    on() {},
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
    async put(key, value) {
      values.set(key, value)
    },
    createKeyStream: () => Readable.from([...values.keys()]),
  }
}

// `live`: the pool as XAPI reports it, HA and host 1 left disabled by default:
// what a dirty record lists. `restore` stands for the cleanup pass of the app
function createPools({
  backupRunning,
  record,
  live = { haEnabled: false, hostEnabled: false },
  restore = () => {},
} = {}) {
  const app = createApp({ backupRunning })
  app.tasks = {
    create(properties) {
      app.calls.push(['tasks.create', properties])
      return new Task({ properties })
    },
  }
  app.getXapi = () => ({
    pool: { ha_enabled: live.haEnabled, wlb_enabled: true, other_config: {} },
    getObjectByUuid: id => (id === 'h1' ? { name_label: 'host 1', enabled: live.hostEnabled } : undefined),
  })
  app.getOptionalPlugin = async () => undefined
  app.isRpuLoadBalancerReEnablePending = () => false
  app.getAllSchedules = async () => []
  app.restoreRpuLeftovers = async (pool, { items, recorder }) => {
    app.calls.push(['restoreRpuLeftovers', pool.id, items])
    await restore(live, recorder)
  }
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

  it('restores what the run left unrestored, then deletes the record', async function () {
    const { app, pools, store } = createPools({
      record: makeDirtyRecord(),
      restore(live, recorder) {
        live.haEnabled = true
        live.hostEnabled = true
        recorder.settingRestored('ha')
      },
    })
    await pools.finalizeRollingUpdate(pool)
    assert.equal(store.values.has('pool-1'), false)
    assert.deepEqual(
      app.calls.map(([name]) => name),
      ['backupGuard', 'tasks.create', 'restoreRpuLeftovers']
    )
    assert.deepEqual(app.calls[0], ['backupGuard', 'pool-1', { operation: 'finalizeRollingUpdate' }])
    assert.deepEqual(app.calls[2], ['restoreRpuLeftovers', 'pool-1', dirtyItems])
  })

  it('is refused by the backup guard before anything is restored, not with force', async function () {
    const { app, pools, store } = createPools({ backupRunning: true, record: makeDirtyRecord() })
    await assert.rejects(pools.finalizeRollingUpdate(pool), forbiddenOperation.is)
    assert.deepEqual(
      app.calls.map(([name]) => name),
      ['backupGuard']
    )
    assert.equal(store.values.has('pool-1'), true)

    await pools.finalizeRollingUpdate(pool, { force: true })
    assert.equal(store.values.has('pool-1'), false)
  })

  it('is refused with what the cleanup could not restore, and keeps the record without what it restored', async function () {
    const { app, pools, store } = createPools({
      record: makeDirtyRecord(),
      restore(live) {
        live.hostEnabled = true
      },
    })
    const error = await pools.finalizeRollingUpdate(pool).then(
      () => assert.fail('should reject'),
      error => error
    )
    assert.equal(incorrectState.is(error, { property: 'unrestoredItems' }), true)
    assert.deepEqual(error.data, {
      actual: [{ type: 'ha', id: 'pool-1' }],
      expected: [],
      object: 'pool-1',
      property: 'unrestoredItems',
    })
    assert.deepEqual(store.values.get('pool-1').changedByRun, { ha: true })
    assert.equal(store.values.get('pool-1').status, 'interrupted')
    assert.equal(app.calls.filter(([name]) => name === 'restoreRpuLeftovers').length, 1)
  })

  it('does not run the cleanup when the run left nothing unrestored', async function () {
    const { app, pools } = createPools({ record: makeRecord() })
    await pools.finalizeRollingUpdate(pool)
    assert.deepEqual(
      app.calls.map(([name]) => name),
      ['tasks.create']
    )
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

  it('does not count a load balancer xo-server is about to load again as unrestored', async function () {
    const { app, pools, store } = createPools({ record: makeRecord({ changedByRun: { loadBalancer: true } }) })
    await assert.rejects(pools.finalizeRollingUpdate(pool), error =>
      incorrectState.is(error, { actual: [{ type: 'loadBalancer', id: 'load-balancer' }], property: 'unrestoredItems' })
    )

    app.isRpuLoadBalancerReEnablePending = () => true
    await pools.finalizeRollingUpdate(pool)
    assert.equal(store.values.has('pool-1'), false)
  })

  it('is refused for a VM the cleanup could not bring back to its home host, closed once it is back', async function () {
    const { app, pools, store } = createPools({ record: makeRecord({ vmHomeById: { vm1: 'h1' } }) })
    let residentOn = 'h2'
    app.getXapi = () => ({
      pool: { other_config: {} },
      getObjectByUuid: id =>
        id === 'vm1'
          ? { name_label: 'vm 1', power_state: 'Running', $resident_on: { $id: residentOn } }
          : id === 'h1'
            ? { name_label: 'host 1', enabled: true }
            : undefined,
    })
    await assert.rejects(pools.finalizeRollingUpdate(pool), error =>
      incorrectState.is(error, { actual: [{ type: 'vm', id: 'vm1', name: 'vm 1' }], property: 'unrestoredItems' })
    )
    assert.equal(store.values.has('pool-1'), true)

    app.restoreRpuLeftovers = async () => {
      residentOn = 'h1'
    }
    await pools.finalizeRollingUpdate(pool)
    assert.equal(store.values.has('pool-1'), false)
  })

  it('with force, deletes the record and writes the abandoned items to the task', async function () {
    const { app, pools, store } = createPools({ record: makeDirtyRecord() })
    await pools.finalizeRollingUpdate(pool, { force: true })
    assert.equal(store.values.has('pool-1'), false)
    const [[, { force, unrestoredItems }]] = app.calls
    assert.equal(force, true)
    assert.deepEqual(unrestoredItems, dirtyItems)
    // nothing is restored
    assert.equal(app.calls.length, 1)
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

describe('Pools.resumeRpuRecoveryRun', function () {
  it('resumes the run with the settings left changed by the previous attempt, not the hosts', async function () {
    const { pools, store } = createPools({ record: makeDirtyRecord() })

    const { recorder, resume } = await pools.resumeRpuRecoveryRun(pool, [])

    assert.equal(store.values.get('pool-1').status, 'resuming')
    assert.equal(recorder.runId, 'run-1')
    assert.equal(recorder.attempt, 2)
    assert.deepEqual(resume.changedByRun, { ha: true })
    assert.equal(resume.hostsStarted, true)
    assert.deepEqual(resume.hostOrder, ['h1'])
  })

  it('awaits acceptance after a schedule an operator enabled again, resumes once the change is accepted', async function () {
    const { pools, store } = createPools({ record: makeRecord({ changedByRun: { schedules: ['s1'] } }) })
    const schedules = [{ id: 's1', name: 'nightly', enabled: true }]
    const changes = [{ type: 'schedule', id: 's1', name: 'nightly', expected: 'disabled', observed: 'enabled' }]

    await assert.rejects(pools.resumeRpuRecoveryRun(pool, schedules), error =>
      incorrectState.is(error, { actual: changes, property: 'operatorChanges' })
    )
    assert.equal(store.values.get('pool-1').status, 'awaiting-acceptance')

    const { resume, acceptedOperatorChanges } = await pools.resumeRpuRecoveryRun(pool, schedules, {
      acceptOperatorChanges: true,
    })
    assert.deepEqual(acceptedOperatorChanges, changes)
    assert.deepEqual(resume.changedByRun, { schedules: [] })
    assert.equal(store.values.get('pool-1').status, 'resuming')
  })

  it('has nothing to resume when the pool has no record', async function () {
    const { pools } = createPools()
    await assert.rejects(pools.resumeRpuRecoveryRun(pool, []), error =>
      noSuchObject.is(error, { id: 'pool-1', type: 'rollingUpdateRecovery' })
    )
  })
})

// the api-errors factories throw the error they build
function thrownBy(fn) {
  try {
    fn()
  } catch (error) {
    return error
  }
}

// a Pools whose `start` hook and `server:connected` listener the test runs by hand
function createAutoResumePools({ records = {}, resumeError, storeError } = {}) {
  const app = createApp()
  const store = makeStore()
  for (const [poolId, record] of Object.entries(records)) {
    store.values.set(poolId, record)
  }
  const startListeners = []
  const listeners = {}
  app.hooks = {
    on(hook, listener) {
      if (hook === 'start') {
        startListeners.push(listener)
      }
    },
  }
  app.on = (event, listener) => {
    listeners[event] = listener
  }
  app.getStore = async () => {
    if (storeError !== undefined) {
      throw storeError
    }
    return store
  }
  app.getObject = (id, type) => {
    assert.equal(type, 'pool')
    return { id, name_label: id }
  }
  // same behavior as the Api mixin
  const apiContext = new AsyncLocalStorage()
  const resumeApiContexts = []
  app.runWithoutApiContext = fn => apiContext.run(undefined, fn)
  app.resumeRollingPoolUpdate = async (pool, opts) => {
    app.calls.push(['resumeRollingPoolUpdate', pool.id, opts])
    resumeApiContexts.push(apiContext.getStore())
    if (resumeError !== undefined) {
      throw resumeError
    }
  }
  const pools = new Pools(app)
  return {
    app,
    pools,
    store,
    // the start listeners also include the trace reconciliation, harmless here.
    // Like runHook, a failing listener does not fail the start
    start: () => Promise.all(startListeners.map(listener => listener().catch(() => {}))),
    connect: poolId => listeners['server:connected']({ xapi: { pool: { $id: poolId } } }),
    // connection made by an API call, like `server.enable`
    connectFromApiCall: (poolId, user) =>
      apiContext.run({ user }, () => listeners['server:connected']({ xapi: { pool: { $id: poolId } } })),
    resumeApiContexts,
  }
}

describe('Pools automatic resume after a restart', function () {
  it('resumes the run the restart interrupted once its pool is connected, only once', async function () {
    const { app, connect, start } = createAutoResumePools({ records: { 'pool-1': makeRecord({ status: 'running' }) } })
    await start()

    await Promise.all([connect('pool-1'), connect('pool-1')])
    await connect('pool-1')

    assert.deepEqual(app.calls, [['resumeRollingPoolUpdate', 'pool-1', { automatic: true }]])
  })

  it('resumes outside of the API call which reconnected the pool', async function () {
    const { connectFromApiCall, resumeApiContexts, start } = createAutoResumePools({
      records: { 'pool-1': makeRecord({ status: 'running' }) },
    })
    await start()

    await connectFromApiCall('pool-1', { id: 'user-1' })

    assert.deepEqual(resumeApiContexts, [undefined])
  })

  it('waits for the records to be loaded when the pool connects first', async function () {
    const { app, connect, start } = createAutoResumePools({ records: { 'pool-1': makeRecord({ status: 'running' }) } })

    const connected = connect('pool-1')
    await start()
    await connected

    assert.deepEqual(app.calls, [['resumeRollingPoolUpdate', 'pool-1', { automatic: true }]])
  })

  it('leaves to the operator a run this restart did not interrupt, or one an automatic resume already continued', async function () {
    const { app, connect, start } = createAutoResumePools({
      records: {
        'pool-1': makeRecord({ status: 'failed' }),
        'pool-2': makeRecord({ status: 'interrupted' }),
        'pool-3': makeRecord({ status: 'running', resumedAutomatically: true }),
      },
    })
    await start()

    for (const poolId of ['pool-1', 'pool-2', 'pool-3', 'pool-4']) {
      await connect(poolId)
    }

    assert.deepEqual(app.calls, [])
  })

  it('does not hold the connections when the records cannot be loaded', async function () {
    const { app, connect, start } = createAutoResumePools({ storeError: new Error('LevelDB open failed') })

    const connected = connect('pool-1')
    await start()
    await connected

    assert.deepEqual(app.calls, [])
  })

  it('leaves the run interrupted when the resume is refused, for the operator to resume it', async function () {
    const { app, connect, start, store } = createAutoResumePools({
      records: { 'pool-1': makeRecord({ status: 'running' }) },
      resumeError: thrownBy(() => forbiddenOperation('resumeRollingPoolUpdate', 'a backup is running')),
    })
    await start()

    await connect('pool-1')

    assert.equal(store.values.get('pool-1').status, 'interrupted')
    assert.equal(app.calls.length, 1)
  })
})
