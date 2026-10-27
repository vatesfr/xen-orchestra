import assert from 'assert/strict'
import test from 'node:test'
import { Readable } from 'node:stream'
import { incorrectState, noSuchObject } from 'xo-common/api-errors.js'

import {
  buildRpuRecoveryView,
  createRpuRecoveryRecord,
  filterError,
  listOperatorChanges,
  listUnrestoredItems,
  noopRpuRecorder,
  planRpuResume,
  readRpuRecoveryView,
  reconcileRpuRecoveryAtBoot,
  restoreRpuSetting,
  resumeRpuRecoveryRun,
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
    record.vmConflicts = [{ vmId: 'vm3', vmName: 'vm 3', hostId: 'h2', reason: 'deleted' }]
    record.operatorChanges = [{ type: 'wlb', id: 'pool1', expected: 'disabled', observed: 'enabled' }]
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
    assert.deepEqual(view.vmConflicts, [{ vmId: 'vm3', vmName: 'vm 3', hostId: 'h2', reason: 'deleted' }])
    assert.deepEqual(view.operatorChanges, [{ type: 'wlb', id: 'pool1', expected: 'disabled', observed: 'enabled' }])
    assert.equal(view.lastError, null)
    // a record written before the VM conflicts existed
    assert.deepEqual(
      buildRpuRecoveryView(createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })).vmConflicts,
      []
    )
    assert.deepEqual(
      buildRpuRecoveryView(createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })).operatorChanges,
      []
    )

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

  it('reports a host left in progress by a run that is over as interrupted', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    record.hostOrder = ['stepRunning', 'half', 'failed', 'pending']
    record.hosts.stepRunning = { steps: { evacuate: { status: 'running' } } }
    record.hosts.half = { steps: { evacuate: { status: 'observed-succeeded' } } }
    record.hosts.failed = { steps: { evacuate: { status: 'failed' } } }

    for (const status of ['interrupted', 'failed']) {
      record.status = status
      const { hosts } = buildRpuRecoveryView(record)
      assert.equal(hosts.stepRunning.status, 'interrupted')
      assert.equal(hosts.half.status, 'interrupted')
      assert.equal(hosts.failed.status, 'failed')
      assert.equal(hosts.pending.status, 'pending')
      // the step keeps what the run last wrote
      assert.equal(hosts.stepRunning.steps.evacuate.status, 'running')
    }
  })

  it('tells whether the run can be resumed', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    record.hostOrder = ['h1']
    record.hosts.h1 = { steps: { evacuate: { status: 'running' } } }
    // live run
    assert.equal(buildRpuRecoveryView(record).resumable, false)

    for (const status of ['failed', 'interrupted', 'blocked']) {
      record.status = status
      assert.equal(buildRpuRecoveryView(record).resumable, true)
    }

    record.status = 'succeeded'
    assert.equal(buildRpuRecoveryView(record).resumable, false)

    // a host stopped after its evacuation
    record.status = 'interrupted'
    record.hosts.h1 = { steps: { evacuate: { status: 'observed-succeeded' }, update: { status: 'running' } } }
    assert.equal(buildRpuRecoveryView(record).resumable, true)
  })

  it('exposes the attempt, 1 for a record written before resumes existed', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    assert.equal(buildRpuRecoveryView(record).attempt, 1)

    record.attempt = 3
    assert.equal(buildRpuRecoveryView(record).attempt, 3)
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

describe('listOperatorChanges()', () => {
  function makeRecord(changedByRun) {
    return { ...createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS }), status: 'interrupted', changedByRun }
  }
  // a pool as the run left it: every setting it touched still disabled
  function makeLive({ pool, hosts = {}, schedules = {}, srs = {}, vms = {} } = {}) {
    return {
      pool: { ha_enabled: false, wlb_enabled: false, other_config: { auto_poweron: 'false' }, ...pool },
      getHost: id => hosts[id],
      getSchedule: id => schedules[id],
      getSr: id => srs[id],
      getVm: id => vms[id],
    }
  }
  const HA = { srs: ['sr1'], configuration: { timeout: '60' } }

  it('lists nothing when the pool is as the run left it', () => {
    const record = makeRecord({ ha: HA, autoPowerOn: true, wlb: true, schedules: ['s1'] })
    const live = makeLive({ schedules: { s1: { enabled: false, name: 'nightly' } }, srs: { sr1: {} } })
    assert.deepEqual(listOperatorChanges(record, live), [])
  })

  it('lists the settings enabled again since the run disabled them', () => {
    const record = makeRecord({ ha: HA, autoPowerOn: true, wlb: true, schedules: ['s1', 's2', 's3'] })
    const live = makeLive({
      pool: { ha_enabled: true, wlb_enabled: true, other_config: { auto_poweron: 'true' } },
      // s3 was deleted
      schedules: { s1: { enabled: true, name: 'nightly' }, s2: { enabled: false, name: 'weekly' } },
    })
    assert.deepEqual(listOperatorChanges(record, live), [
      { type: 'ha', id: 'pool1', expected: 'disabled', observed: 'enabled' },
      { type: 'autoPowerOn', id: 'pool1', expected: 'disabled', observed: 'enabled' },
      { type: 'wlb', id: 'pool1', expected: 'disabled', observed: 'enabled' },
      { type: 'schedule', id: 's1', name: 'nightly', expected: 'disabled', observed: 'enabled' },
      { type: 'schedule', id: 's3', expected: 'disabled', observed: 'missing' },
    ])
  })

  it('lists the hosts and VMs of the run which no longer exist', () => {
    const record = {
      ...makeRecord({}),
      hostOrder: ['h1', 'h2'],
      hosts: { h1: { steps: {} }, h2: { steps: {} } },
      vmHomeById: { vm1: 'h1', vm2: 'h2' },
      haltedPinnedVms: { vm3: 'h1' },
    }
    const live = makeLive({ hosts: { h1: {} }, vms: { vm1: {} } })
    assert.deepEqual(listOperatorChanges(record, live), [
      { type: 'host', id: 'h2', expected: 'present', observed: 'missing' },
      { type: 'vm', id: 'vm2', expected: 'present', observed: 'missing' },
      { type: 'vm', id: 'vm3', expected: 'present', observed: 'missing' },
    ])
  })

  it('does not list again the VMs the run already reported as deleted', () => {
    const record = {
      ...makeRecord({}),
      vmHomeById: { vm1: 'h1' },
      vmConflicts: [{ vmId: 'vm1', hostId: 'h1', reason: 'deleted' }],
    }
    assert.deepEqual(listOperatorChanges(record, makeLive({ hosts: { h1: {} } })), [])
  })

  it('lists the HA heartbeat SRs which no longer exist', () => {
    const record = makeRecord({ ha: { srs: ['sr1', 'sr2'], configuration: {} } })
    assert.deepEqual(listOperatorChanges(record, makeLive({ srs: { sr1: {} } })), [
      { type: 'haHeartbeatSr', id: 'sr2', expected: 'present', observed: 'missing' },
    ])
  })

  it('never exposes the HA configuration', () => {
    const record = makeRecord({ ha: { srs: ['sr1'], configuration: { secret: 'hunter2' } } })
    const changes = listOperatorChanges(record, makeLive({ pool: { ha_enabled: true }, srs: { sr1: {} } }))
    assert.equal(JSON.stringify(changes).includes('hunter2'), false)
  })

  it('returns null for an unreadable record', () => {
    assert.equal(listOperatorChanges({ schemaVersion: 42 }, makeLive()), null)
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

  it('settingChangedByRun refused leaves no trace of a setting the run did not change', async () => {
    const { store, recorder, stored } = await makeRecorder()
    await recorder.settingChangedByRun('schedules', ['schedule-1'])

    const { put } = store
    store.put = async () => {
      throw new Error('disk full')
    }
    await assert.rejects(recorder.settingChangedByRun('schedules', ['schedule-2']), /disk full/)
    await assert.rejects(recorder.settingChangedByRun('wlb'), /disk full/)
    store.put = put
    await recorder.fail(new Error('disk full'))

    assert.deepEqual(stored().changedByRun, { schedules: ['schedule-1'] })
  })

  it('settingChangedByRun keeps the schedules disabled by a previous attempt', async () => {
    const { recorder, stored } = await makeRecorder()

    await recorder.settingChangedByRun('schedules', ['schedule-1', 'schedule-2'])
    await recorder.settingChangedByRun('schedules', ['schedule-2', 'schedule-3'])

    assert.deepEqual(stored().changedByRun.schedules, ['schedule-1', 'schedule-2', 'schedule-3'])
  })

  it('hostStarting keeps the state of the host before the first attempt', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.hostStarting('h1', '123', true)
    // resumed: the host was disabled by the interrupted attempt
    recorder.hostStarting('h1', '456', false)
    await recorder.fail(new Error('later'))

    assert.equal(stored().hosts.h1.agentStartedAtBeforeUpdate, '123')
    assert.equal(stored().hosts.h1.enabledBeforeUpdate, true)
  })

  it('settingRestored forgets a setting, or one schedule, once back to its value from before the run', async () => {
    const { recorder, stored } = await makeRecorder()
    await recorder.settingChangedByRun('ha', { srs: ['sr1'], configuration: {} })
    await recorder.settingChangedByRun('wlb')
    await recorder.settingChangedByRun('schedules', ['schedule-1', 'schedule-2'])

    recorder.settingRestored('ha')
    recorder.settingRestored('schedules', 'schedule-1')
    await recorder.fail(new Error('later'))
    assert.deepEqual(stored().changedByRun, { wlb: true, schedules: ['schedule-2'] })

    recorder.settingRestored('schedules', 'schedule-2')
    await recorder.fail(new Error('later'))
    assert.deepEqual(stored().changedByRun, { wlb: true })
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

  it('a record kept succeeded forgets the error of a previous attempt', async () => {
    const { recorder, stored } = await makeRecorder()

    await recorder.fail(new Error('could not migrate VMs back to their host: vm 7'))
    recorder.setVmConflicts([{ vmId: 'vm7', vmName: 'vm 7', hostId: 'h1', reason: 'stopped' }])
    await recorder.complete()

    assert.equal(stored().status, 'succeeded')
    assert.equal(stored().lastError, null)
  })

  it('setVmConflicts replaces the VMs the previous migrate back could not bring home', async () => {
    const { recorder, stored } = await makeRecorder()
    const conflicts = [{ vmId: 'vm2', vmName: 'vm 2', hostId: 'h1', reason: 'stopped' }]

    recorder.setVmConflicts([{ vmId: 'vm1', hostId: 'h2', reason: 'migration-failed', message: 'OPERATION_BLOCKED' }])
    recorder.setVmConflicts(conflicts)
    await recorder.complete()

    assert.deepEqual(stored().vmConflicts, conflicts)
    assert.deepEqual(recorder.getVmConflicts(), conflicts)
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

  it('dropIfNothingToRecover keeps the record of a resume, which knows what the previous attempts changed', async () => {
    const { store, recorder: firstAttempt } = await makeRecorder()
    await firstAttempt.fail(new Error('interrupted'))
    const { recorder } = await resumeRpuRecoveryRun({ store, poolId: 'pool1' })

    await recorder.fail(new Error('boom'))
    await recorder.dropIfNothingToRecover()

    assert.equal(store.data.get('pool1').status, 'failed')
  })

  it('dropIfNothingToRecover keeps the record while a setting the run changed is not restored', async () => {
    const { recorder, stored } = await makeRecorder()

    await recorder.settingChangedByRun('wlb')
    await recorder.fail(new Error('pinned VMs'))
    await recorder.dropIfNothingToRecover()

    assert.deepEqual(stored().changedByRun, { wlb: true })
  })

  it('setPatchInventory keeps the inventory of the first attempt', async () => {
    const { recorder, stored } = await makeRecorder()

    recorder.setPatchInventory({ h1: true, h2: true })
    // resumed: h1 was updated by the previous attempt
    recorder.setPatchInventory({ h1: false, h2: true })
    await recorder.fail(new Error('later'))

    assert.deepEqual(stored().hasMissingPatchesByHost, { h1: true, h2: true })
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

  it('complete removes the record after a successful run which restored everything it changed', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    await recorder.settingChangedByRun('wlb')
    recorder.settingRestored('wlb')
    await recorder.complete()

    assert.equal(store.data.has('pool1'), false)
  })

  it('complete keeps the record failed, with what is left to restore, when a setting could not be restored', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    await recorder.settingChangedByRun('ha', { srs: ['sr1'], configuration: {} })
    await recorder.settingChangedByRun('wlb')
    recorder.settingRestored('wlb')
    await recorder.complete()

    const record = store.data.get('pool1')
    assert.equal(record.status, 'failed')
    assert.deepEqual(record.changedByRun, { ha: { srs: ['sr1'], configuration: {} } })
    assert.match(record.lastError.message, /not restored: ha/)
    assert.equal(typeof record.finishedAt, 'string')
    // a resume restores it again
    await resumeRpuRecoveryRun({ store, poolId: 'pool1' })
    const resumed = store.data.get('pool1')
    assert.equal(resumed.status, 'resuming')
    assert.deepEqual(resumed.changedByRun, { ha: { srs: ['sr1'], configuration: {} } })
  })

  it('complete keeps the record failed when some VMs could not be migrated back, so that a resume retries them', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    recorder.setVmConflicts([
      { vmId: 'vm-1', vmName: 'vm 1', hostId: 'h2', reason: 'migration-failed', message: 'OPERATION_BLOCKED' },
      { vmId: 'vm-2', vmName: 'vm 2', hostId: 'h1', reason: 'stopped' },
    ])
    await recorder.complete()

    const record = store.data.get('pool1')
    assert.equal(record.status, 'failed')
    // named after the VMs, not after their host
    assert.match(record.lastError.message, /vm 1/)
    assert.doesNotMatch(record.lastError.message, /vm 2/)
  })

  it('complete keeps the record succeeded when VMs were stopped or deleted during the run, so that Finalize closes it', async () => {
    const { store, recorder } = await makeRecorder()

    recorder.markRunning()
    recorder.setVmConflicts([
      { vmId: 'vm-2', vmName: 'vm 2', hostId: 'h1', reason: 'stopped' },
      { vmId: 'vm-3', hostId: 'h1', reason: 'deleted' },
    ])
    await recorder.complete()

    assert.equal(store.data.get('pool1').status, 'succeeded')
  })

  it('complete is strict: rejects when the record cannot be deleted', async () => {
    const { store, recorder } = await makeRecorder()
    store.del = async () => {
      throw new Error('disk error')
    }

    await assert.rejects(recorder.complete(), /disk error/)
    // the record left behind is terminal: not flipped to interrupted at boot
    const record = store.data.get('pool1')
    assert.equal(record.status, 'succeeded')
    assert.equal(typeof record.finishedAt, 'string')
    await reconcileRpuRecoveryAtBoot(store)
    assert.equal(store.data.get('pool1').status, 'succeeded')
  })
})

const allSteps = status =>
  Object.fromEntries(['evacuate', 'update', 'reboot', 'enable', 'restoreVms'].map(name => [name, { status }]))

describe('planRpuResume()', () => {
  function makeRecord(hosts) {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    record.hostOrder = Object.keys(hosts)
    record.hosts = Object.fromEntries(Object.entries(hosts).map(([hostId, steps]) => [hostId, { steps }]))
    return record
  }

  it('sorts the hosts: done, unfinished, left alone', () => {
    const record = makeRecord({
      done: { ...allSteps('observed-succeeded'), restoreVms: { status: 'pending' } },
      evacuateFailed: { evacuate: { status: 'failed' } },
      evacuated: { evacuate: { status: 'observed-succeeded' } },
      updateRunning: { evacuate: { status: 'observed-succeeded' }, update: { status: 'running' } },
      rebootFailed: { ...allSteps('observed-succeeded'), reboot: { status: 'failed' } },
      rebooting: { ...allSteps('observed-succeeded'), reboot: { status: 'running' }, enable: { status: 'pending' } },
      ignored: allSteps('not-needed'),
    })
    record.hosts.updateRunning.agentStartedAtBeforeUpdate = '1700000000.5'
    record.hosts.updateRunning.enabledBeforeUpdate = true
    // not handled yet
    record.hostOrder.push('pending')

    const plan = planRpuResume(record)

    assert.deepEqual([...plan.doneHostIds], ['done'])
    assert.deepEqual(Object.keys(plan.unfinishedHosts), [
      'evacuateFailed',
      'evacuated',
      'updateRunning',
      'rebootFailed',
      'rebooting',
    ])
    assert.deepEqual(plan.unfinishedHosts.updateRunning, {
      agentStartedAtBeforeUpdate: '1700000000.5',
      enabledBeforeUpdate: true,
      rebooting: false,
    })
    assert.equal(plan.unfinishedHosts.rebootFailed.rebooting, false)
    assert.equal(plan.unfinishedHosts.rebooting.rebooting, true)
    assert.deepEqual([...plan.patchedHostIds], ['done', 'updateRunning', 'rebootFailed', 'rebooting'])
    assert.equal(plan.hostsStarted, true)
  })

  it('has nothing done without a host order, nor started hosts without host', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })

    const plan = planRpuResume(record)

    assert.equal(plan.doneHostIds.size, 0)
    assert.equal(plan.hostsStarted, false)
    assert.deepEqual(plan.changedByRun, {})
  })

  it('passes on the settings the previous attempts changed, with their value from before the run', () => {
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    record.changedByRun = { ha: { srs: ['sr1'], configuration: {} }, schedules: ['schedule-1'] }

    assert.deepEqual(planRpuResume(record).changedByRun, record.changedByRun)
  })
})

describe('resumeRpuRecoveryRun()', () => {
  async function storeWith(patch) {
    const store = makeFakeStore()
    const record = createRpuRecoveryRecord({ poolId: 'pool1', options: OPTIONS })
    Object.assign(record, { status: 'failed', finishedAt: 'T' }, patch)
    await store.put('pool1', record)
    return { store, record }
  }

  it('fails when the pool has no record', async () => {
    await assert.rejects(resumeRpuRecoveryRun({ store: makeFakeStore(), poolId: 'pool1' }), error =>
      noSuchObject.is(error, { id: 'pool1', type: 'rollingUpdateRecovery' })
    )
  })

  it('refuses a record which is not failed nor interrupted', async () => {
    for (const status of ['preparing', 'running', 'resuming', 'cleaning', 'succeeded']) {
      const { store } = await storeWith({ status })
      await assert.rejects(resumeRpuRecoveryRun({ store, poolId: 'pool1' }), error =>
        incorrectState.is(error, { actual: status, property: 'status' })
      )
    }
  })

  it('refuses a blocked record', async () => {
    const { store } = await storeWith({ schemaVersion: 42 })
    await assert.rejects(resumeRpuRecoveryRun({ store, poolId: 'pool1' }), error =>
      incorrectState.is(error, { actual: 'blocked', property: 'status' })
    )

    store.get = async () => {
      throw new SyntaxError('Unexpected token')
    }
    await assert.rejects(resumeRpuRecoveryRun({ store, poolId: 'pool1' }), error =>
      incorrectState.is(error, { actual: 'blocked', property: 'status' })
    )
  })

  it('continues the same run: resuming on disk, attempt increased, failed steps of the previous attempt re-armed', async () => {
    const { store, record } = await storeWith({
      status: 'interrupted',
      hostOrder: ['h1', 'h2', 'h3'],
      hosts: {
        h1: { steps: { ...allSteps('observed-succeeded'), restoreVms: { status: 'failed' } } },
        h2: { steps: { evacuate: { status: 'failed' } } },
        h3: { steps: { evacuate: { status: 'observed-succeeded' }, update: { status: 'failed' } } },
      },
    })

    const resumed = await resumeRpuRecoveryRun({ store, poolId: 'pool1' })

    const stored = store.data.get('pool1')
    assert.equal(stored.runId, record.runId)
    assert.equal(stored.status, 'resuming')
    assert.equal(stored.attempt, 2)
    assert.equal(stored.finishedAt, undefined)
    assert.equal(stored.hosts.h1.steps.restoreVms.status, 'pending')
    assert.equal(stored.hosts.h1.steps.reboot.status, 'observed-succeeded')
    assert.equal(stored.hosts.h2.steps.evacuate.status, 'pending')
    assert.equal(stored.hosts.h3.steps.update.status, 'pending')
    assert.equal(resumed.recorder.runId, record.runId)
    assert.equal(resumed.recorder.attempt, 2)
    assert.deepEqual([...resumed.plan.doneHostIds], ['h1'])
    // planned before the reset
    assert.deepEqual([...resumed.plan.patchedHostIds], ['h1', 'h3'])

    // a failure of the resume is recorded and the run can be resumed again
    resumed.recorder.stepRunning('h2', 'evacuate')
    resumed.recorder.hostFailed('h2', new Error('not enough memory'))
    await resumed.recorder.fail(new Error('not enough memory'))
    assert.equal(store.data.get('pool1').hosts.h2.steps.evacuate.status, 'failed')

    const again = await resumeRpuRecoveryRun({ store, poolId: 'pool1' })
    assert.equal(store.data.get('pool1').attempt, 3)
    // h3 still patched although its update step was reset by the previous resume
    assert.deepEqual([...again.plan.patchedHostIds], ['h1', 'h3'])
  })

  it('rejects when the resuming status cannot be written', async () => {
    const { store } = await storeWith()
    store.put = async () => {
      throw new Error('disk full')
    }

    await assert.rejects(resumeRpuRecoveryRun({ store, poolId: 'pool1' }), /disk full/)
  })

  describe('with settings changed by an operator since the run', () => {
    const HA = { srs: ['sr1'], configuration: {} }
    const changedByRun = { ha: HA, autoPowerOn: true, schedules: ['s1', 's2'] }
    // HA and s1 enabled again by hand, s2 still disabled
    const live = {
      pool: { ha_enabled: true, wlb_enabled: false, other_config: { auto_poweron: 'false' } },
      getSchedule: id => ({ s1: { enabled: true, name: 'nightly' }, s2: { enabled: false, name: 'weekly' } })[id],
      getSr: () => ({}),
    }
    const CHANGES = [
      { type: 'ha', id: 'pool1', expected: 'disabled', observed: 'enabled' },
      { type: 'schedule', id: 's1', name: 'nightly', expected: 'disabled', observed: 'enabled' },
    ]

    it('blocks the record and lists the changes', async () => {
      const { store } = await storeWith({ changedByRun })

      await assert.rejects(resumeRpuRecoveryRun({ store, poolId: 'pool1', live }), error =>
        incorrectState.is(error, { actual: CHANGES, object: 'pool1', property: 'operatorChanges' })
      )
      const stored = store.data.get('pool1')
      assert.equal(stored.status, 'blocked')
      assert.deepEqual(stored.operatorChanges, CHANGES)
      // nothing started: same attempt, the failed steps are kept
      assert.equal(stored.attempt, undefined)
      assert.deepEqual(stored.changedByRun, changedByRun)
    })

    it('still refuses when the blocked status cannot be written', async () => {
      const { store } = await storeWith({ changedByRun })
      store.put = async () => {
        throw new Error('disk full')
      }

      await assert.rejects(resumeRpuRecoveryRun({ store, poolId: 'pool1', live }), error =>
        incorrectState.is(error, { property: 'operatorChanges' })
      )
    })

    it('adopts the changes once acknowledged', async () => {
      const { store } = await storeWith({ changedByRun, status: 'blocked', operatorChanges: CHANGES })

      const { plan, acceptedOperatorChanges } = await resumeRpuRecoveryRun({
        store,
        poolId: 'pool1',
        live,
        acceptOperatorChanges: true,
      })

      assert.deepEqual(acceptedOperatorChanges, CHANGES)
      const expected = { autoPowerOn: true, schedules: ['s2'] }
      assert.deepEqual(plan.changedByRun, expected)
      const stored = store.data.get('pool1')
      assert.equal(stored.status, 'resuming')
      assert.deepEqual(stored.changedByRun, expected)
      assert.equal(stored.operatorChanges, undefined)
    })

    it('forgets the hosts, VMs and schedules gone since the run once acknowledged', async () => {
      const { store } = await storeWith({
        changedByRun: { schedules: ['s1', 's2'] },
        hostOrder: ['h1', 'h2'],
        hosts: { h1: { steps: {} }, h2: { steps: {} } },
        hasMissingPatchesByHost: { h1: true, h2: true },
        // vm2 still exists, but its home host is gone
        vmHomeById: { vm1: 'h1', vm2: 'h2', vm3: 'h1' },
        haltedPinnedVms: { vm4: 'h2', vm5: 'h1' },
      })
      const gone = {
        ...live,
        getHost: id => ({ h1: {} })[id],
        getSchedule: id => ({ s2: { enabled: false, name: 'weekly' } })[id],
        getVm: id => ({ vm1: {}, vm2: {}, vm4: {}, vm5: {} })[id],
      }

      const { acceptedOperatorChanges } = await resumeRpuRecoveryRun({
        store,
        poolId: 'pool1',
        live: gone,
        acceptOperatorChanges: true,
      })

      assert.deepEqual(acceptedOperatorChanges, [
        { type: 'schedule', id: 's1', expected: 'disabled', observed: 'missing' },
        { type: 'host', id: 'h2', expected: 'present', observed: 'missing' },
        { type: 'vm', id: 'vm3', expected: 'present', observed: 'missing' },
      ])
      const stored = store.data.get('pool1')
      assert.deepEqual(stored.changedByRun, { schedules: ['s2'] })
      assert.deepEqual(stored.hostOrder, ['h1'])
      assert.deepEqual(Object.keys(stored.hosts), ['h1'])
      assert.deepEqual(stored.hasMissingPatchesByHost, { h1: true })
      assert.deepEqual(stored.vmHomeById, { vm1: 'h1' })
      assert.deepEqual(stored.haltedPinnedVms, { vm5: 'h1' })
    })

    it('gives up the HA restoration when a heartbeat SR is gone', async () => {
      const { store } = await storeWith({ changedByRun: { ha: HA } })
      const noSr = { ...live, pool: { ...live.pool, ha_enabled: false }, getSr: () => undefined }

      const { plan } = await resumeRpuRecoveryRun({ store, poolId: 'pool1', live: noSr, acceptOperatorChanges: true })

      assert.deepEqual(plan.changedByRun, {})
    })

    it('resumes a blocked record once the operator reverted the changes', async () => {
      const { store } = await storeWith({
        changedByRun: { autoPowerOn: true },
        status: 'blocked',
        operatorChanges: CHANGES,
      })

      const { acceptedOperatorChanges } = await resumeRpuRecoveryRun({ store, poolId: 'pool1', live })

      assert.deepEqual(acceptedOperatorChanges, [])
      const stored = store.data.get('pool1')
      assert.equal(stored.status, 'resuming')
      assert.equal(stored.operatorChanges, undefined)
    })
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
    noopRpuRecorder.settingRestored('ha')
    await noopRpuRecorder.complete()
    noopRpuRecorder.setVmConflicts([{ vmId: 'vm1', hostId: 'h1', reason: 'stopped' }])
    assert.deepEqual(noopRpuRecorder.getVmConflicts(), [])
  })
})

describe('restoreRpuSetting()', () => {
  it('records the setting as restored only once the restore succeeded, and never throws', async () => {
    const restored = []
    const recorder = { ...noopRpuRecorder, settingRestored: (name, id) => restored.push([name, id]) }

    await restoreRpuSetting(recorder, 'schedules', async () => {}, 'schedule-1')
    await restoreRpuSetting(recorder, 'wlb', async () => {
      throw new Error('WLB unreachable')
    })

    assert.deepEqual(restored, [['schedules', 'schedule-1']])
  })
})
