import assert from 'assert/strict'
import test from 'node:test'
import { Readable } from 'node:stream'

import {
  buildRpuRecoveryView,
  createRpuRecoveryRecord,
  filterError,
  noopRpuRecorder,
  reconcileRpuRecoveryAtBoot,
  RPU_RECOVERY_SCHEMA_VERSION,
  startRpuRecoveryRun,
  unreadableRpuRecoveryView,
} from './_rpuRecovery.mjs'

const { describe, it } = test

function makeFakeStore() {
  const data = new Map()
  return {
    data,
    async put(key, value) {
      // simulate the JSON round trip of the real store
      data.set(key, JSON.parse(JSON.stringify(value)))
    },
    async get(key) {
      if (!data.has(key)) {
        const error = new Error('not found')
        error.notFound = true
        throw error
      }
      return data.get(key)
    },
    async del(key) {
      data.delete(key)
    },
    createKeyStream() {
      return Readable.from([...data.keys()])
    },
  }
}

const OPTIONS = { rebootVm: true, bypassBackupCheck: false, shutdownPinnedVms: true }

describe('createRpuRecoveryRecord()', () => {
  it('creates a preparing v1 record with declared empty future fields', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })

    assert.equal(record.schemaVersion, RPU_RECOVERY_SCHEMA_VERSION)
    assert.equal(typeof record.runId, 'string')
    assert.equal(record.poolId, 'pool1')
    assert.equal(record.status, 'preparing')
    assert.equal(record.attempt, 1)
    assert.deepEqual(record.options, OPTIONS)
    assert.deepEqual(record.hosts, {})
    assert.deepEqual(record.haltedPinnedVms, {})
    assert.equal(record.lastError, null)
    assert.deepEqual(record.conflicts, [])
    assert.deepEqual(record.planChanges, [])
    assert.deepEqual(record.original, {})
    assert.deepEqual(record.changedByRun, [])
  })
})

describe('filterError()', () => {
  it('serializes errors and scrubs secret-looking keys', () => {
    const error = new Error('boom')
    error.call = { params: { password: 'hunter2', host: 'xcp1' } }

    const filtered = filterError(error)

    assert.equal(filtered.message, 'boom')
    assert.equal(filtered.call.params.password, '[REDACTED]')
    assert.equal(filtered.call.params.host, 'xcp1')
  })

  it('returns null for nullish errors', () => {
    assert.equal(filterError(undefined), null)
    assert.equal(filterError(null), null)
  })
})

describe('buildRpuRecoveryView()', () => {
  it('reports an unknown schema version as blocked without touching the record', () => {
    const view = buildRpuRecoveryView({ schemaVersion: 42, runId: 'r1', poolId: 'pool1', status: 'running' })

    assert.equal(view.status, 'blocked')
    assert.equal(view.poolId, 'pool1')
    assert.equal(view.runId, 'r1')
    assert.match(view.blockedReason, /42/)
  })

  it('reports a non-object record as blocked', () => {
    assert.equal(buildRpuRecoveryView(null).status, 'blocked')
    assert.equal(buildRpuRecoveryView('corrupt').status, 'blocked')
  })

  it('exposes the public fields and hides the raw intent', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    record.taskId = 'task1'
    record.variant = 'xcp'
    record.hostOrder = ['h1', 'h2']
    record.vmHomeById = { vm1: 'h1' }
    record.hasMissingPatchesByHost = { h1: true, h2: false }
    record.haltedPinnedVms = { vm2: 'h1' }
    record.hosts.h1 = {
      agentStartedAtBeforeUpdate: '123',
      steps: { evacuate: { status: 'observed-succeeded' }, reboot: { status: 'running', startedAt: 'T' } },
    }

    const view = buildRpuRecoveryView(record)

    assert.equal(view.runId, record.runId)
    assert.equal(view.status, 'preparing')
    assert.equal(view.attempt, 1)
    assert.equal(view.taskId, 'task1')
    assert.equal(view.variant, 'xcp')
    assert.deepEqual(view.hostOrder, ['h1', 'h2'])
    assert.deepEqual(view.haltedPinnedVms, { vm2: 'h1' })
    assert.deepEqual(view.conflicts, [])
    assert.deepEqual(view.planChanges, [])
    assert.equal(view.lastError, null)

    // raw intent is never exposed
    assert.equal(view.options, undefined)
    assert.equal(view.vmHomeById, undefined)
    assert.equal(view.original, undefined)
    assert.equal(view.changedByRun, undefined)
    assert.equal(view.hasMissingPatchesByHost, undefined)
    assert.equal(view.hosts.h1.agentStartedAtBeforeUpdate, undefined)

    // per-host view: every step present, missing ones pending
    assert.equal(view.hosts.h1.status, 'running')
    assert.equal(view.hosts.h1.steps.evacuate.status, 'observed-succeeded')
    assert.equal(view.hosts.h1.steps.reboot.status, 'running')
    assert.equal(view.hosts.h1.steps.update.status, 'pending')
    // h2 not started yet but listed through hostOrder
    assert.equal(view.hosts.h2.status, 'pending')
  })

  it('derives per-host statuses', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    record.hostOrder = ['failed', 'skipped', 'done', 'half']
    const all = (status, names = ['evacuate', 'update', 'reboot', 'enable', 'restoreVms']) =>
      Object.fromEntries(names.map(name => [name, { status }]))
    record.hosts.failed = { steps: { ...all('observed-succeeded'), reboot: { status: 'failed' } } }
    record.hosts.skipped = { steps: all('not-needed') }
    record.hosts.done = { steps: { ...all('observed-succeeded'), update: { status: 'not-needed' } } }
    record.hosts.half = { steps: { evacuate: { status: 'observed-succeeded' } } }

    const view = buildRpuRecoveryView(record)

    assert.equal(view.hosts.failed.status, 'failed')
    assert.equal(view.hosts.skipped.status, 'not-needed')
    assert.equal(view.hosts.done.status, 'succeeded')
    assert.equal(view.hosts.half.status, 'running')
  })
})

describe('unreadableRpuRecoveryView()', () => {
  it('is blocked with a reason', () => {
    const view = unreadableRpuRecoveryView('pool1')
    assert.equal(view.status, 'blocked')
    assert.equal(view.poolId, 'pool1')
    assert.equal(typeof view.blockedReason, 'string')
  })
})

describe('startRpuRecoveryRun()', () => {
  it('persists the record before returning and overwrites any previous record', async () => {
    const store = makeFakeStore()
    await store.put('pool1', { schemaVersion: 42, status: 'blocked' })

    const recorder = await startRpuRecoveryRun({ store, poolId: 'pool1', options: OPTIONS })

    const stored = store.data.get('pool1')
    assert.equal(stored.schemaVersion, RPU_RECOVERY_SCHEMA_VERSION)
    assert.equal(stored.status, 'preparing')
    assert.equal(stored.runId, recorder.runId)
  })

  it('rejects when the record cannot be written', async () => {
    const store = makeFakeStore()
    store.put = async () => {
      throw new Error('disk full')
    }

    await assert.rejects(startRpuRecoveryRun({ store, poolId: 'pool1', options: OPTIONS }), /disk full/)
  })
})

describe('createRpuRecoveryRecorder()', () => {
  async function makeRecorder() {
    const store = makeFakeStore()
    const recorder = await startRpuRecoveryRun({ store, poolId: 'pool1', options: OPTIONS })
    return { store, recorder, stored: () => store.data.get('pool1') }
  }

  it('tracks the run progression', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.markRunning()
    recorder.setTaskId('task1')
    recorder.setVariant('xcp')
    recorder.setPatchInventory({ h1: true })
    recorder.setVmHome({ vm1: 'h1' })
    recorder.setHostOrder(['h1'])
    recorder.hostStarting('h1', '123')
    recorder.stepRunning('h1', 'evacuate')
    recorder.stepObserved('h1', 'evacuate')
    recorder.stepNotNeeded('h1', 'update')
    await recorder.recordHaltedPinnedVm('vm2', 'h1')

    const record = stored()
    assert.equal(record.status, 'running')
    assert.equal(record.taskId, 'task1')
    assert.equal(record.variant, 'xcp')
    assert.deepEqual(record.hasMissingPatchesByHost, { h1: true })
    assert.deepEqual(record.vmHomeById, { vm1: 'h1' })
    assert.deepEqual(record.hostOrder, ['h1'])
    assert.equal(record.hosts.h1.agentStartedAtBeforeUpdate, '123')
    assert.equal(record.hosts.h1.steps.evacuate.status, 'observed-succeeded')
    assert.equal(record.hosts.h1.steps.update.status, 'not-needed')
    assert.deepEqual(record.haltedPinnedVms, { vm2: 'h1' })

    recorder.forgetHaltedPinnedVm('vm2')
    await recorder.fail(new Error('later'))
    assert.deepEqual(stored().haltedPinnedVms, {})
  })

  it('recordHaltedPinnedVm is strict: rejects on write failure', async () => {
    const { store, recorder } = await makeRecorder()
    store.put = async () => {
      throw new Error('disk full')
    }

    await assert.rejects(recorder.recordHaltedPinnedVm('vm1', 'h1'), /disk full/)
  })

  it('tracking writes are best effort: a write failure does not throw', async () => {
    const { store, recorder } = await makeRecorder()
    store.put = async () => {
      throw new Error('disk full')
    }

    // must not reject nor throw
    recorder.markRunning()
    recorder.stepRunning('h1', 'evacuate')
    await recorder.fail(new Error('boom'))
  })

  it('keeps a failed step failed', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.stepRunning('h1', 'restoreVms')
    recorder.stepFailed('h1', 'restoreVms', new Error('first'))
    recorder.stepObserved('h1', 'restoreVms')
    recorder.stepFailed('h1', 'restoreVms', new Error('second'))
    await recorder.fail(new Error('final'))

    const step = stored().hosts.h1.steps.restoreVms
    assert.equal(step.status, 'failed')
    // last error is the most recent one, host and run wide
    assert.equal(stored().hosts.h1.lastError.message, 'second')
  })

  it('hostSkipped marks every step not-needed', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.hostSkipped('h1')
    await recorder.recordHaltedPinnedVm('vm1', 'h1')

    const steps = stored().hosts.h1.steps
    for (const name of ['evacuate', 'update', 'reboot', 'enable', 'restoreVms']) {
      assert.equal(steps[name].status, 'not-needed')
    }
  })

  it('hostFailed marks the running step failed and records the filtered error', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.stepRunning('h1', 'reboot')
    const error = new Error('agent never came back')
    error.password = 'hunter2'
    recorder.hostFailed('h1', error)
    await recorder.fail(error)

    const record = stored()
    assert.equal(record.hosts.h1.steps.reboot.status, 'failed')
    assert.equal(record.hosts.h1.lastError.message, 'agent never came back')
    assert.equal(record.hosts.h1.lastError.password, '[REDACTED]')
    assert.equal(record.lastError.message, 'agent never came back')
    assert.equal(record.status, 'failed')
    assert.equal(typeof record.finishedAt, 'string')
  })

  it('delete removes the record after a successful run', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    await recorder.delete()

    assert.equal(store.data.has('pool1'), false)
  })

  it('delete does not throw when the store fails', async () => {
    const { store, recorder } = await makeRecorder()
    store.del = async () => {
      throw new Error('disk error')
    }

    await recorder.delete()
  })
})

describe('reconcileRpuRecoveryAtBoot()', () => {
  it('flips live statuses to interrupted and leaves settled ones untouched', async () => {
    const store = makeFakeStore()
    for (const [poolId, status] of [
      ['preparing', 'preparing'],
      ['running', 'running'],
      ['resuming', 'resuming'],
      ['cleaning', 'cleaning'],
      ['failed', 'failed'],
      ['blocked', 'blocked'],
      ['interrupted', 'interrupted'],
    ]) {
      const record = createRpuRecoveryRecord({ poolId, options: OPTIONS })
      record.status = status
      await store.put(poolId, record)
    }
    await store.put('unknown-version', { schemaVersion: 42, status: 'running' })

    await reconcileRpuRecoveryAtBoot(store)

    for (const poolId of ['preparing', 'running', 'resuming', 'cleaning']) {
      const record = store.data.get(poolId)
      assert.equal(record.status, 'interrupted', poolId)
      assert.equal(typeof record.interruptedAt, 'string')
    }
    for (const poolId of ['failed', 'blocked', 'interrupted']) {
      assert.equal(store.data.get(poolId).status, poolId)
    }
    // unknown version left untouched: blocked at read time, the value is evidence
    assert.deepEqual(store.data.get('unknown-version'), { schemaVersion: 42, status: 'running' })
  })

  it('an unreadable record does not stop the reconciliation of the others', async () => {
    const store = makeFakeStore()
    const live = createRpuRecoveryRecord({ poolId: 'pool2', options: OPTIONS })
    live.status = 'running'
    await store.put('pool1', 'whatever')
    await store.put('pool2', live)
    const innerGet = store.get.bind(store)
    store.get = async key => {
      if (key === 'pool1') {
        throw new SyntaxError('Unexpected token')
      }
      return innerGet(key)
    }

    await reconcileRpuRecoveryAtBoot(store)

    assert.equal(store.data.get('pool2').status, 'interrupted')
  })
})

describe('noopRpuRecorder', () => {
  it('accepts every recorder call without effect', async () => {
    noopRpuRecorder.markRunning()
    noopRpuRecorder.stepRunning('h1', 'evacuate')
    noopRpuRecorder.hostFailed('h1', new Error('boom'))
    await noopRpuRecorder.recordHaltedPinnedVm('vm1', 'h1')
    await noopRpuRecorder.fail(new Error('boom'))
    await noopRpuRecorder.delete()
  })
})
