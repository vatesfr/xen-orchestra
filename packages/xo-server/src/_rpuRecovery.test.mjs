import assert from 'assert/strict'
import test from 'node:test'
import { Readable } from 'node:stream'
import { incorrectState } from 'xo-common/api-errors.js'

import {
  buildRpuRecoveryView,
  createRpuRecoveryRecord,
  filterError,
  listUnrestoredItems,
  noopRpuRecorder,
  readRpuRecoveryView,
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

const OPTIONS = {
  acceptCurrentStateAsBaseline: false,
  rebootVm: true,
  bypassBackupCheck: false,
  shutdownPinnedVms: true,
}

describe('createRpuRecoveryRecord()', () => {
  it('creates a preparing v1 record', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })

    assert.equal(record.schemaVersion, RPU_RECOVERY_SCHEMA_VERSION)
    assert.equal(typeof record.runId, 'string')
    assert.equal(record.poolId, 'pool1')
    assert.equal(record.status, 'preparing')
    assert.deepEqual(record.options, OPTIONS)
    assert.deepEqual(record.hosts, {})
    assert.deepEqual(record.haltedPinnedVms, {})
    assert.equal(record.lastError, null)
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

  it('never throws: an unserializable error is reduced to its string form', () => {
    const error = new Error('boom')
    error.details = {
      toJSON() {
        throw new Error('nope')
      },
    }

    assert.deepEqual(filterError(error), { message: 'Error: boom' })
  })

  it('wraps non-object values so the result is always an object', () => {
    assert.deepEqual(filterError('boom'), { message: 'boom' })
    assert.deepEqual(filterError(42), { message: '42' })
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
    assert.equal(view.taskId, 'task1')
    assert.equal(view.variant, 'xcp')
    assert.deepEqual(view.hostOrder, ['h1', 'h2'])
    assert.deepEqual(view.haltedPinnedVms, { vm2: 'h1' })
    assert.equal(view.lastError, null)

    // raw intent is never exposed
    assert.equal(view.options, undefined)
    assert.equal(view.vmHomeById, undefined)
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

describe('readRpuRecoveryView()', () => {
  it('returns undefined when the pool has no record', async () => {
    assert.equal(await readRpuRecoveryView(makeFakeStore(), 'pool1'), undefined)
  })

  it('projects a stored record onto its view', async () => {
    const store = makeFakeStore()
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    await store.put('pool1', record)

    const view = await readRpuRecoveryView(store, 'pool1')

    assert.equal(view.runId, record.runId)
    assert.equal(view.status, 'preparing')
    assert.equal(view.options, undefined)
  })

  it('reports a value it cannot decode as blocked', async () => {
    const store = makeFakeStore()
    store.get = async () => {
      throw new SyntaxError('Unexpected token')
    }

    assert.equal((await readRpuRecoveryView(store, 'pool1')).status, 'blocked')
  })
})

describe('listUnrestoredItems()', () => {
  function makeRecord(patch) {
    return { ...createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS }), status: 'interrupted', ...patch }
  }
  // a pool at rest: every setting enabled, every host enabled
  function makeLive({ pool, hosts = {}, vms = {}, schedules = {}, loadBalancerLoaded = true } = {}) {
    return {
      pool: { ha_enabled: true, wlb_enabled: true, other_config: { auto_poweron: 'true' }, ...pool },
      loadBalancerLoaded,
      getHost: id => hosts[id],
      getVm: id => vms[id],
      getSchedule: id => schedules[id],
    }
  }
  const host = (name, enabled) => ({ name_label: name, enabled })
  const vm = (name, power_state, hostId) => ({ name_label: name, power_state, $resident_on: hostId && { $id: hostId } })

  it('lists nothing when the run changed nothing', () => {
    assert.deepEqual(listUnrestoredItems(makeRecord(), makeLive()), [])
  })

  it('lists the settings the run changed and the pool still shows changed', () => {
    const record = makeRecord({
      changedByRun: { ha: true, autoPowerOn: true, wlb: true, loadBalancer: true, schedules: ['s1', 's2', 's3'] },
    })
    const live = makeLive({
      pool: { ha_enabled: false, wlb_enabled: false, other_config: { auto_poweron: 'false' } },
      loadBalancerLoaded: false,
      // s2 was enabled again by hand, s3 was deleted: nothing left to restore
      schedules: { s1: { enabled: false, name: 'nightly' }, s2: { enabled: true, name: 'weekly' } },
    })
    assert.deepEqual(listUnrestoredItems(record, live), [
      { type: 'ha', id: 'pool1' },
      { type: 'autoPowerOn', id: 'pool1' },
      { type: 'wlb', id: 'pool1' },
      { type: 'loadBalancer', id: 'load-balancer' },
      { type: 'schedule', id: 's1', name: 'nightly' },
    ])
  })

  it('does not list a changed setting the pool shows restored', () => {
    const record = makeRecord({ changedByRun: { ha: true, autoPowerOn: true, wlb: true, loadBalancer: true } })
    assert.deepEqual(listUnrestoredItems(record, makeLive()), [])
  })

  it('lists the hosts the run disabled and left disabled', () => {
    const observed = { status: 'observed-succeeded' }
    const record = makeRecord({
      hostOrder: ['h1', 'h2', 'h3', 'h4', 'h5'],
      hosts: {
        // disabled by the run, never enabled again
        h1: { enabledBeforeUpdate: true, steps: { evacuate: { status: 'failed' } } },
        // already disabled by the operator before the run
        h2: { enabledBeforeUpdate: false, steps: { evacuate: observed } },
        // the run never reached it
        h3: { enabledBeforeUpdate: true, steps: {} },
        // enabled again by the run, disabled afterwards by someone else
        h4: { enabledBeforeUpdate: true, steps: { evacuate: observed, reboot: observed, enable: observed } },
        // skipped by the run: never started
        h5: { steps: { evacuate: { status: 'not-needed' }, enable: { status: 'not-needed' } } },
      },
    })
    const live = makeLive({
      hosts: {
        h1: host('host 1', false),
        h2: host('host 2', false),
        h3: host('host 3', false),
        h4: host('host 4', false),
        h5: host('host 5', false),
      },
    })
    assert.deepEqual(listUnrestoredItems(record, live), [{ type: 'host', id: 'h1', name: 'host 1' }])
  })

  it('does not list a host the run disabled once it is enabled again, nor a host that is gone', () => {
    const record = makeRecord({
      hostOrder: ['h1', 'h2'],
      hosts: {
        h1: { enabledBeforeUpdate: true, steps: { evacuate: { status: 'running' } } },
        h2: { enabledBeforeUpdate: true, steps: { evacuate: { status: 'running' } } },
      },
    })
    assert.deepEqual(listUnrestoredItems(record, makeLive({ hosts: { h1: host('host 1', true) } })), [])
  })

  it('lists the running VMs away from the host they were running on', () => {
    const record = makeRecord({ vmHomeById: { vm1: 'h1', vm2: 'h1', vm3: 'h2', vm4: 'h2' } })
    // vm2 is back home, vm3 is halted, vm4 is gone
    const vms = { vm1: vm('vm 1', 'Running', 'h2'), vm2: vm('vm 2', 'Running', 'h1'), vm3: vm('vm 3', 'Halted') }
    assert.deepEqual(listUnrestoredItems(record, makeLive({ vms })), [{ type: 'vm', id: 'vm1', name: 'vm 1' }])
  })

  it('does not list the displaced VMs when the pool opted out of the migrate back', () => {
    const record = makeRecord({ vmHomeById: { vm1: 'h1' } })
    const live = makeLive({
      pool: { other_config: { 'xo:rpuMigrateVmsBack': 'false' } },
      vms: { vm1: vm('vm 1', 'Running', 'h2') },
    })
    assert.deepEqual(listUnrestoredItems(record, live), [])
  })

  it('lists the pinned VMs the run shut down and left halted', () => {
    const record = makeRecord({ haltedPinnedVms: { vm1: 'h1', vm2: 'h1', vm3: 'h1' } })
    // vm2 was started again by hand, vm3 is gone
    const vms = { vm1: vm('vm 1', 'Halted'), vm2: vm('vm 2', 'Running', 'h1') }
    assert.deepEqual(listUnrestoredItems(record, makeLive({ vms })), [
      { type: 'haltedPinnedVm', id: 'vm1', name: 'vm 1' },
    ])
  })

  it('is unknown for a record it cannot read', () => {
    assert.equal(listUnrestoredItems(undefined, makeLive()), null)
    assert.equal(listUnrestoredItems(null, makeLive()), null)
    assert.equal(listUnrestoredItems({ schemaVersion: 42, poolId: 'pool1' }, makeLive()), null)
  })
})

describe('startRpuRecoveryRun()', () => {
  it('persists the record before returning', async () => {
    const store = makeFakeStore()

    const recorder = await startRpuRecoveryRun({ store, poolId: 'pool1', options: OPTIONS })

    const stored = store.data.get('pool1')
    assert.equal(stored.schemaVersion, RPU_RECOVERY_SCHEMA_VERSION)
    assert.equal(stored.status, 'preparing')
    assert.equal(stored.runId, recorder.runId)
  })

  it('refuses a new run while a record exists, whatever its status', async () => {
    for (const status of ['running', 'interrupted', 'failed']) {
      const store = makeFakeStore()
      const previous = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
      previous.status = status
      await store.put('pool1', previous)

      await assert.rejects(startRpuRecoveryRun({ store, poolId: 'pool1', options: OPTIONS }), error => {
        assert.ok(incorrectState.is(error, { property: 'rollingUpdateRecovery' }), status)
        assert.equal(error.data.actual, status)
        assert.equal(error.data.object, 'pool1')
        return true
      })
      // the previous record is the evidence of what happened: left untouched
      assert.equal(store.data.get('pool1').runId, previous.runId)
    }
  })

  it('refuses a new run over a record it cannot read', async () => {
    const store = makeFakeStore()
    await store.put('pool1', 'corrupt')
    store.get = async () => {
      throw new SyntaxError('Unexpected token')
    }

    await assert.rejects(startRpuRecoveryRun({ store, poolId: 'pool1', options: OPTIONS }), error => {
      assert.ok(incorrectState.is(error, { property: 'rollingUpdateRecovery' }))
      assert.equal(error.data.actual, 'blocked')
      return true
    })
    assert.equal(store.data.get('pool1'), 'corrupt')
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
    recorder.setPlan({ hostOrder: ['h1'], vmHomeById: { vm1: 'h1' } })
    recorder.hostStarting('h1', '123', true)
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
    assert.equal(record.hosts.h1.enabledBeforeUpdate, true)
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

  it('settingChangedByRun is strict: the setting is on disk before the run changes it', async () => {
    const { store, recorder, stored } = await makeRecorder()

    await recorder.settingChangedByRun('ha')
    await recorder.settingChangedByRun('schedules', ['schedule-1', 'schedule-2'])
    assert.deepEqual(stored().changedByRun, { ha: true, schedules: ['schedule-1', 'schedule-2'] })

    store.put = async () => {
      throw new Error('disk full')
    }
    await assert.rejects(recorder.settingChangedByRun('wlb'), /disk full/)
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

  it('fail persists the failure details, even before the first host was handled', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.markRunning()
    await recorder.fail(new Error('pinned VMs'))

    assert.equal(stored().status, 'failed')
    assert.equal(stored().lastError.message, 'pinned VMs')
  })

  it('dropIfNothingToRecover drops the record when no host was handled', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    recorder.setVariant('xcp')
    recorder.setPatchInventory({ h1: true })
    recorder.setPlan({ hostOrder: ['h1'], vmHomeById: {} })
    await recorder.fail(new Error('pinned VMs'))
    await recorder.dropIfNothingToRecover()

    assert.equal(store.data.has('pool1'), false)
  })

  it('dropIfNothingToRecover keeps the record once a host was handled, even a skipped host', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.hostSkipped('h1')
    await recorder.fail(new Error('boom'))
    await recorder.dropIfNothingToRecover()

    assert.equal(stored().status, 'failed')
  })

  it('dropIfNothingToRecover never throws: the record stays failed when it cannot be dropped', async () => {
    const { store, recorder } = await makeRecorder()
    store.del = async () => {
      throw new Error('disk error')
    }

    await recorder.fail(new Error('boom'))
    await recorder.dropIfNothingToRecover()

    assert.equal(store.data.get('pool1').status, 'failed')
  })

  it('delete removes the record after a successful run', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    await recorder.delete()

    assert.equal(store.data.has('pool1'), false)
  })

  it('delete is strict: rejects when the store fails', async () => {
    const { store, recorder } = await makeRecorder()
    store.del = async () => {
      throw new Error('disk error')
    }

    await assert.rejects(recorder.delete(), /disk error/)
    // the record left behind is terminal: not flipped to interrupted at boot
    const record = store.data.get('pool1')
    assert.equal(record.status, 'succeeded')
    assert.equal(typeof record.finishedAt, 'string')
    await reconcileRpuRecoveryAtBoot(store)
    assert.equal(store.data.get('pool1').status, 'succeeded')
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
      ['interrupted', 'interrupted'],
      ['succeeded', 'succeeded'],
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
    for (const poolId of ['failed', 'interrupted', 'succeeded']) {
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

  it('a failing store is logged, not thrown', async () => {
    const store = makeFakeStore()
    store.createKeyStream = () =>
      Readable.from(
        (async function* () {
          throw new Error('corrupt')
        })()
      )

    await reconcileRpuRecoveryAtBoot(store)
  })
})

describe('noopRpuRecorder', () => {
  it('accepts every recorder call without effect', async () => {
    noopRpuRecorder.markRunning()
    noopRpuRecorder.stepRunning('h1', 'evacuate')
    noopRpuRecorder.hostFailed('h1', new Error('boom'))
    await noopRpuRecorder.recordHaltedPinnedVm('vm1', 'h1')
    await noopRpuRecorder.settingChangedByRun('ha')
    await noopRpuRecorder.fail(new Error('boom'))
    await noopRpuRecorder.dropIfNothingToRecover()
    await noopRpuRecorder.delete()
  })
})
