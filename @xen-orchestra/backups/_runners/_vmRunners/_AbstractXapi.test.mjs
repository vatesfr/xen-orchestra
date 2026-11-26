import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatDateTime } from '@xen-orchestra/xapi'
import { Task } from '@vates/task'

import { AbstractXapi } from './_AbstractXapi.mjs'
import { DATETIME, EXPORTED_SUCCESSFULLY, JOB_ID, SCHEDULE_ID } from '../../_otherConfig.mjs'

// Build an AbstractXapi instance without running its heavy constructor, then
// assign only the fields the method under test reads.
const makeRunner = props => Object.assign(Object.create(AbstractXapi.prototype), props)

describe('_snapshot() synchronized-snapshot reuse guard', () => {
  it('reuses the batch snapshot, found by metadata, without snapshotting again', async () => {
    let mustDoSnapshotCalls = 0
    const timestamp = 1717200000000
    // the snapshot taken by the batch phase, identified by its other_config
    const batchSnapshot = {
      $ref: 'batch-snapshot-ref',
      other_config: {
        [JOB_ID]: 'job-1',
        [SCHEDULE_ID]: 'schedule-1',
        [DATETIME]: formatDateTime(timestamp),
      },
    }
    const runner = makeRunner({
      _synchronizedSnapshotTimestamp: timestamp,
      _jobId: 'job-1',
      scheduleId: 'schedule-1',
      _vm: { uuid: 'vm-uuid', $snapshots: [batchSnapshot] },
      _xapi: { barrier: async () => {} },
      // if the metadata lookup fails, _snapshot() falls through to here
      _mustDoSnapshot: async () => {
        mustDoSnapshotCalls++
        return false
      },
    })

    await runner._snapshot()

    assert.equal(mustDoSnapshotCalls, 0, '_mustDoSnapshot() should not be called when the batch snapshot is found')
    assert.equal(runner._exportedVm, batchSnapshot, '_exportedVm should be the batch snapshot found by metadata')
    assert.equal(runner.timestamp, timestamp, 'timestamp should be the synchronized snapshot timestamp')
  })

  it('takes a fresh snapshot when the batch snapshot can no longer be found', async () => {
    let mustDoSnapshotCalls = 0
    const vm = { uuid: 'vm-uuid', $snapshots: [] } // the pre-taken snapshot is gone
    const runner = makeRunner({
      _synchronizedSnapshotTimestamp: 1717200000000,
      _jobId: 'job-1',
      scheduleId: 'schedule-1',
      _vm: vm,
      _xapi: { barrier: async () => {} },
      _settings: {},
      _mustDoSnapshot: async () => {
        mustDoSnapshotCalls++
        return false
      },
    })

    await runner._snapshot()

    assert.equal(
      mustDoSnapshotCalls,
      1,
      'a missing batch snapshot should not be reused: _snapshot() should fall through and take a fresh snapshot'
    )
    assert.equal(
      runner._exportedVm,
      vm,
      '_exportedVm should fall back to the freshly-snapshotted VM, not stay on a stale/missing batch snapshot'
    )
  })

  it('without a pre-taken snapshot and no snapshot needed, exports the live VM', async () => {
    let mustDoSnapshotCalls = 0
    const vm = { uuid: 'vm-uuid' }
    const runner = makeRunner({
      _exportedVm: undefined,
      _vm: vm,
      _xapi: {},
      _settings: {},
      _mustDoSnapshot: async () => {
        mustDoSnapshotCalls++
        return false
      },
    })

    await runner._snapshot()

    assert.equal(mustDoSnapshotCalls, 1, '_mustDoSnapshot() should be called once when no snapshot was pre-taken')
    assert.equal(runner._exportedVm, vm, '_exportedVm should be set to the live VM when no snapshot is needed')
    assert.equal(typeof runner.timestamp, 'number', 'timestamp should be set when exporting the live VM')
  })
})

describe('_removeUnusedSnapshots() protects the pre-taken synchronized snapshot', () => {
  const OLD_DATETIME = '20240101T00:00:00Z'
  const SYNC_TIMESTAMP = 1717200000000
  const SYNC_DATETIME = formatDateTime(SYNC_TIMESTAMP)

  // Full-mode job with snapshotRetention 0, so retention wants to remove every
  // snapshot. `vdi-fresh` is the snapshot taken up-front by the synchronized
  // batch phase (identified by SYNC_TIMESTAMP); until it is exported it must be
  // hidden from retention.
  const makeRemoveRunner = ({ exported }) => {
    const destroyed = []

    const snapshotVm = ($ref, name_label) => ({
      $ref,
      name_label,
      is_control_domain: false,
      $snapshot_of: 'live-vm-ref',
      other_config: {},
    })
    const freshSnapshotVm = snapshotVm('vm-fresh', 'fresh')
    const oldSnapshotVm = snapshotVm('vm-old', 'old')

    const vdi = ($ref, datetime, snapshotVmRecord, isExported = false) => ({
      $ref,
      other_config: {
        [DATETIME]: datetime,
        [SCHEDULE_ID]: 'schedule-1',
        ...(isExported ? { [EXPORTED_SUCCESSFULLY]: 'true' } : {}),
      },
      $VBDs: [{ $VM: snapshotVmRecord }],
    })
    // the old snapshot was exported by a previous run
    const oldVdi = vdi('vdi-old', OLD_DATETIME, oldSnapshotVm, true)
    const freshVdi = vdi('vdi-fresh', SYNC_DATETIME, freshSnapshotVm, exported)

    const registry = { 'vdi-old': oldVdi, 'vdi-fresh': freshVdi }

    const runner = makeRunner({
      _synchronizedSnapshotTimestamp: SYNC_TIMESTAMP,
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [oldVdi, freshVdi],
      _disklessJobSnapshotVms: [],
      job: { mode: 'full', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
        },
        VDI_destroy: async ref => {
          destroyed.push(ref)
        },
      },
    })

    return { runner, destroyed }
  }

  it('does not destroy the pre-taken snapshot before it has been transferred', async () => {
    const { runner, destroyed } = makeRemoveRunner({ exported: false })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['vm-old'], 'only the older snapshot should be removed')
  })

  it('destroys the snapshot once it has been transferred (retention 0, no leak)', async () => {
    const { runner, destroyed } = makeRemoveRunner({ exported: true })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed.sort(), ['vm-fresh', 'vm-old'], 'both snapshots should be removed after transfer')
  })
})

describe('_removeUnusedSnapshots() in the synchronized batch pre-snapshot state', () => {
  it('delta mode: keeps the base snapshot when the fresh one has not been taken yet', async () => {
    const destroyed = []

    const BASE_DATETIME = '2024-06-01T00:00:00Z'
    const baseSnapshotVm = {
      $ref: 'vm-base',
      name_label: 'base',
      is_control_domain: false,
      $snapshot_of: 'live-vm-ref',
    }
    const baseVdi = {
      $ref: 'vdi-base',
      other_config: { [DATETIME]: BASE_DATETIME, [SCHEDULE_ID]: 'schedule-1', [EXPORTED_SUCCESSFULLY]: 'true' },
      $VBDs: [{ $VM: baseSnapshotVm }],
    }
    const registry = { 'vdi-base': baseVdi }

    const runner = makeRunner({
      // batch pre-snapshot state: the synchronized snapshot has not been taken yet
      _exportedVm: undefined,
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [baseVdi],
      _disklessJobSnapshotVms: [],
      job: { mode: 'delta', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
        },
        VDI_destroy: async ref => {
          destroyed.push(ref)
        },
      },
    })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, [], 'the base snapshot must be kept as the delta base for the upcoming transfer')
  })
})

describe('_removeUnusedSnapshots() after a failed transfer', () => {
  const BASE_DATETIME = '20260902T090100Z'
  const FAILED_DATETIME = '20260902T092200Z'

  const makeFailedRunRunner = ({ freshExported = false } = {}) => {
    const destroyed = []

    const snapshotVm = $ref => ({
      $ref,
      name_label: $ref,
      is_control_domain: false,
      $snapshot_of: 'live-vm-ref',
      other_config: {},
    })
    const baseSnapshotVm = snapshotVm('vm-base')
    const freshSnapshotVm = snapshotVm('vm-failed')

    const vdi = ($ref, datetime, snapshotVmRecord, isExported) => ({
      $ref,
      other_config: {
        [DATETIME]: datetime,
        [SCHEDULE_ID]: 'schedule-1',
        ...(isExported ? { [EXPORTED_SUCCESSFULLY]: 'true' } : {}),
      },
      $VBDs: [{ $VM: snapshotVmRecord }],
    })
    // the base of the last successful run and the snapshot of the run that just failed
    const baseVdi = vdi('vdi-base', BASE_DATETIME, baseSnapshotVm, true)
    const freshVdi = vdi('vdi-failed', FAILED_DATETIME, freshSnapshotVm, freshExported)

    const registry = { 'vdi-base': baseVdi, 'vdi-failed': freshVdi }

    const runner = makeRunner({
      // no synchronized snapshot: this is a plain incremental replication job
      _synchronizedSnapshotTimestamp: undefined,
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [baseVdi, freshVdi],
      _disklessJobSnapshotVms: [],
      job: { mode: 'delta', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
        },
        VDI_destroy: async ref => {
          destroyed.push(ref)
        },
      },
    })

    return { runner, destroyed }
  }

  it('keeps the last successfully exported snapshot as the delta base', async () => {
    const { runner, destroyed } = makeFailedRunRunner()

    await runner._removeUnusedSnapshots()

    assert.equal(
      destroyed.includes('vm-base'),
      false,
      'the last exported snapshot is the only usable delta base: destroying it forces a full on the next run'
    )
  })

  it('reclaims the snapshot of the failed run (never exported, retention 0)', async () => {
    const { runner, destroyed } = makeFailedRunRunner()

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['vm-failed'], 'only the never-exported snapshot should be removed')
  })

  it('keeps the most recent snapshot once the transfer succeeded', async () => {
    const { runner, destroyed } = makeFailedRunRunner({ freshExported: true })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['vm-base'], 'the newly exported snapshot should replace the previous base')
  })

  it('keeps the newest exported snapshot even when several runs failed in a row', async () => {
    const { runner, destroyed } = makeFailedRunRunner()
    // a second consecutive failure adds another never-exported snapshot
    const secondFailedVm = {
      $ref: 'vm-failed-2',
      name_label: 'vm-failed-2',
      is_control_domain: false,
      $snapshot_of: 'live-vm-ref',
      other_config: {},
    }
    const secondFailedVdi = {
      $ref: 'vdi-failed-2',
      other_config: { [DATETIME]: '20260902T092600Z', [SCHEDULE_ID]: 'schedule-1' },
      $VBDs: [{ $VM: secondFailedVm }],
    }
    runner._jobSnapshotVdis.push(secondFailedVdi)
    const getObject = runner._xapi.getObject
    runner._xapi.getObject = ref => (ref === 'vdi-failed-2' ? secondFailedVdi : getObject(ref))

    await runner._removeUnusedSnapshots()

    assert.deepEqual(
      destroyed.sort(),
      ['vm-failed', 'vm-failed-2'],
      'both failed snapshots should be reclaimed and the exported base kept'
    )
  })
})

describe('_removeUnusedSnapshots() reclaims orphan / CBT snapshot VDIs (no attached VM)', () => {
  // Guards the `else` branch: snapshot VDIs that are not attached to any user VM
  // (e.g. CBT metadata, orphans) must be reclaimed via VDI_destroy, not VM_destroy.
  it('destroys snapshot VDIs directly when they are not attached to any VM', async () => {
    const vmDestroyed = []
    const vdiDestroyed = []

    const orphanVdi = {
      $ref: 'vdi-orphan',
      other_config: { [DATETIME]: '2024-01-01T00:00:00Z', [SCHEDULE_ID]: 'schedule-1' },
      $VBDs: [], // not attached to any VM
    }
    const registry = { 'vdi-orphan': orphanVdi }

    const runner = makeRunner({
      _exportedVm: undefined,
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [orphanVdi],
      _disklessJobSnapshotVms: [],
      job: { mode: 'full', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          vmDestroyed.push(ref)
        },
        VDI_destroy: async ref => {
          vdiDestroyed.push(ref)
        },
      },
    })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(vdiDestroyed, ['vdi-orphan'], 'the orphan VDI should be reclaimed via VDI_destroy')
    assert.deepEqual(vmDestroyed, [], 'no VM should be destroyed for an orphan VDI')
  })
})

describe('_removeUnusedSnapshots() diskless VM snapshots', () => {
  const OLD_DATETIME = '20240101T00:00:00Z'
  const SYNC_TIMESTAMP = 1717200000000
  const SYNC_DATETIME = formatDateTime(SYNC_TIMESTAMP)

  // A diskless VM's backup snapshots are tracked as VM snapshots (no VDIs to
  // anchor them). `dl-fresh` is the snapshot the synchronized batch pre-took,
  // identified by SYNC_TIMESTAMP.
  const makeDisklessRunner = ({ exported, mode = 'full' }) => {
    const destroyed = []

    const oldSnap = { $ref: 'dl-old', other_config: { [DATETIME]: OLD_DATETIME, [SCHEDULE_ID]: 'schedule-1' } }
    const freshSnap = { $ref: 'dl-fresh', other_config: { [DATETIME]: SYNC_DATETIME, [SCHEDULE_ID]: 'schedule-1' } }
    if (exported) freshSnap.other_config[EXPORTED_SUCCESSFULLY] = 'true'
    const registry = { 'dl-old': oldSnap, 'dl-fresh': freshSnap }

    const runner = makeRunner({
      _synchronizedSnapshotTimestamp: SYNC_TIMESTAMP,
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [],
      _disklessJobSnapshotVms: [oldSnap, freshSnap],
      job: { mode, settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
        },
        VDI_destroy: async ref => {
          destroyed.push(ref)
        },
      },
    })

    return { runner, destroyed }
  }

  it('does not destroy the pre-taken diskless snapshot before it has been transferred', async () => {
    const { runner, destroyed } = makeDisklessRunner({ exported: false })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['dl-old'], 'only the older diskless snapshot should be removed')
  })

  it('destroys the diskless snapshot once it has been transferred (retention 0, no leak)', async () => {
    const { runner, destroyed } = makeDisklessRunner({ exported: true })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(
      destroyed.sort(),
      ['dl-fresh', 'dl-old'],
      'both diskless snapshots should be removed after transfer'
    )
  })

  it('keeps the most recent diskless snapshot in delta mode (base for next delta)', async () => {
    // Even after transfer (exported), delta mode must retain the latest
    // snapshot so the next run can compute its delta against it.
    const { runner, destroyed } = makeDisklessRunner({ exported: true, mode: 'delta' })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['dl-old'], 'the most recent diskless snapshot should be kept in delta mode')
  })
})

describe('_removeUnusedSnapshots() forgets the exported snapshot when it reclaims it', () => {
  // `_exportedVm` is read after retention has run (by `_removeSnapshotData()`), so it must
  // not survive the destruction of the VM it points at.
  const BASE_DATETIME = '20260902T090100Z'
  const SYNC_TIMESTAMP = 1717200000000

  const makeRunner_ = ({ freshDatetime, freshExported = false, synchronized = false, exportedVmRef }) => {
    const destroyed = []

    const snapshotVm = $ref => ({
      $ref,
      name_label: $ref,
      is_control_domain: false,
      $snapshot_of: 'live-vm-ref',
      other_config: {},
    })
    const baseSnapshotVm = snapshotVm('vm-base')
    const freshSnapshotVm = snapshotVm('vm-fresh')

    const vdi = ($ref, datetime, snapshotVmRecord, isExported) => ({
      $ref,
      other_config: {
        [DATETIME]: datetime,
        [SCHEDULE_ID]: 'schedule-1',
        ...(isExported ? { [EXPORTED_SUCCESSFULLY]: 'true' } : {}),
      },
      $VBDs: [{ $VM: snapshotVmRecord }],
    })
    const baseVdi = vdi('vdi-base', BASE_DATETIME, baseSnapshotVm, true)
    const freshVdi = vdi('vdi-fresh', freshDatetime, freshSnapshotVm, freshExported)

    const registry = { 'vdi-base': baseVdi, 'vdi-fresh': freshVdi }
    const vms = { 'vm-base': baseSnapshotVm, 'vm-fresh': freshSnapshotVm }

    const runner = makeRunner({
      _synchronizedSnapshotTimestamp: synchronized ? SYNC_TIMESTAMP : undefined,
      _exportedVm: vms[exportedVmRef],
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [baseVdi, freshVdi],
      _disklessJobSnapshotVms: [],
      job: { mode: 'delta', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
        },
        VDI_destroy: async ref => {
          destroyed.push(ref)
        },
      },
    })

    return { runner, destroyed }
  }

  it('clears _exportedVm when the snapshot of the failed run is reclaimed', async () => {
    const { runner, destroyed } = makeRunner_({ freshDatetime: '20260902T092200Z', exportedVmRef: 'vm-fresh' })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['vm-fresh'], 'the never-exported snapshot should be reclaimed')
    assert.equal(runner._exportedVm, undefined, '_exportedVm must not outlive the VM it points at')
  })

  it('keeps _exportedVm when the snapshot survives retention (synchronized snapshot)', async () => {
    // the in-flight synchronized snapshot is hidden from retention, so it is still
    // there afterwards and its data must still be purgeable
    const { runner, destroyed } = makeRunner_({
      freshDatetime: formatDateTime(SYNC_TIMESTAMP),
      synchronized: true,
      exportedVmRef: 'vm-fresh',
    })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, [], 'the in-flight synchronized snapshot must be kept')
    assert.notEqual(runner._exportedVm, undefined, '_exportedVm should be kept while the snapshot exists')
  })

  it('keeps _exportedVm when another snapshot is reclaimed', async () => {
    // nominal run: the fresh snapshot has been exported, the previous base ages out
    const { runner, destroyed } = makeRunner_({
      freshDatetime: '20260902T092200Z',
      freshExported: true,
      exportedVmRef: 'vm-fresh',
    })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['vm-base'], 'only the previous base should be reclaimed')
    assert.notEqual(runner._exportedVm, undefined, 'the exported snapshot is untouched')
  })

  it('clears _exportedVm when a reclaimed diskless snapshot is the exported one', async () => {
    const destroyed = []
    const oldSnap = { $ref: 'dl-old', other_config: { [DATETIME]: '20240101T000000Z', [SCHEDULE_ID]: 'schedule-1' } }
    const registry = { 'dl-old': oldSnap }

    const runner = makeRunner({
      _exportedVm: oldSnap,
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: [],
      _disklessJobSnapshotVms: [oldSnap],
      job: { mode: 'full', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
        },
        VDI_destroy: async () => {},
      },
    })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['dl-old'], 'the diskless snapshot should be reclaimed')
    assert.equal(runner._exportedVm, undefined, '_exportedVm must not outlive the VM it points at')
  })
})

describe('run() purges the snapshot data only while the snapshot exists', () => {
  // `_removeSnapshotData()` runs from the `finally` of run(), right after
  // `_removeUnusedSnapshots()`. Whether it acts is decided by `_exportedVm` alone: the
  // snapshot of a failed run is reclaimed (nothing to purge), but a synchronized snapshot
  // is hidden from retention and survives, so its data must still be reclaimed.
  const makeRunRunner = ({ copyFails = false, isSnapshot = true, snapshotReclaimed = copyFails } = {}) => {
    const calls = { markExportSuccessfull: 0, vmDestroyed: [], dataDestroyed: [] }

    const runner = makeRunner({
      _healthCheckSr: undefined,
      // the only configuration in which _removeSnapshotData() acts
      _settings: { offlineBackup: false, snapshotRetention: 0, preferNbd: true, cbtDestroySnapshotData: true },
      _vm: {
        uuid: 'live-uuid',
        power_state: 'Halted',
        blocked_operations: {},
        update_blocked_operations: async () => {},
        $call: async () => {},
      },
      _writers: new Set([{ beforeBackup: async () => {}, afterBackup: async () => {} }]),
      _xapi: {
        VM_getDisks: async () => ['vdi-ref'],
        // used by markExportSuccessfull()
        setFieldEntry: async () => {
          calls.markExportSuccessfull++
        },
        call: async (method, ref) => {
          calls.vmDestroyed.push(`${method}:${ref}`)
        },
        VDI_dataDestroy: async ref => {
          calls.dataDestroyed.push(ref)
        },
      },
      _cleanMetadata: async () => {},
      _fetchJobSnapshots: async () => {},
      _selectBaseVm: async () => {},
      _removeUnusedSnapshots: async function () {
        if (snapshotReclaimed) {
          this._forgetExportedVm(this._exportedVm?.$ref)
        }
      },
      _snapshot: async function () {
        this._exportedVm = {
          $ref: 'snapshot-ref',
          is_a_snapshot: isSnapshot,
          // a snapshot of the live VM; undefined for an offline backup, where the live VM is exported
          $snapshot_of: isSnapshot ? 'live-vm-ref' : undefined,
        }
      },
      _copy: async () => {
        if (copyFails) {
          throw new Error('transfer failed: target unreachable')
        }
      },
    })

    return { runner, calls }
  }

  it('does not purge anything when the failed run snapshot has been reclaimed', async () => {
    const { runner, calls } = makeRunRunner({ copyFails: true })

    await assert.rejects(runner.run(), /transfer failed/)

    assert.deepEqual(calls.vmDestroyed, [], 'the snapshot is already destroyed: nothing to purge')
    assert.deepEqual(calls.dataDestroyed, [], 'no VDI to data_destroy either')
  })

  it('purges the snapshot data of a failed run whose snapshot survived retention', async () => {
    // synchronized snapshot: hidden from retention, so it is still holding its data
    const { runner, calls } = makeRunRunner({ copyFails: true, snapshotReclaimed: false })

    await assert.rejects(runner.run(), /transfer failed/)

    assert.deepEqual(calls.vmDestroyed, ['VM.destroy:snapshot-ref'], 'the surviving snapshot should be destroyed')
    assert.deepEqual(calls.dataDestroyed, ['vdi-ref'], 'its data should be reclaimed, as before this fix')
  })

  it('purges the snapshot data when the transfer succeeded', async () => {
    const { runner, calls } = makeRunRunner()

    await runner.run()

    assert.equal(calls.markExportSuccessfull, 2, 'the exported snapshot and its VDIs should be marked')
    assert.deepEqual(calls.vmDestroyed, ['VM.destroy:snapshot-ref'], 'the exported snapshot should be purged')
    assert.deepEqual(calls.dataDestroyed, ['vdi-ref'], 'its data should be reclaimed')
  })

  it('does not purge anything when the live VM was exported (offline backup)', async () => {
    const { runner, calls } = makeRunRunner({ isSnapshot: false })

    await runner.run()

    assert.equal(calls.markExportSuccessfull, 0, 'the live VM is not marked as exported')
    assert.deepEqual(calls.vmDestroyed, [], 'the live VM must never be destroyed')
  })
})

describe('after an abort', () => {
  it('_snapshot() passes the abort signal to the snapshot', async () => {
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    let received
    const runner = makeRunner({
      _settings: { bypassVdiChainsCheck: true },
      _vm: {
        $ref: 'vm-ref',
        uuid: 'vm-uuid',
        $snapshot: async opts => {
          received = opts
          // the backup is aborted while the snapshot is being taken
          vmTask.abort()
          throw new Error('stop after the snapshot call')
        },
      },
      _xapi: {},
      _mustDoSnapshot: async () => true,
    })

    await vmTask.run(() => assert.rejects(runner._snapshot(), /stop after the snapshot call/)).catch(() => {})

    assert.ok(received.signal instanceof AbortSignal, 'the snapshot gets a signal')
    assert.equal(received.signal.aborted, true, 'the snapshot gets the abort signal of the backup')
  })

  it('run() still applies the retention and restores the blocked operations, but skips the health check', async () => {
    const calls = []
    const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
    const runner = makeRunner({
      _settings: { offlineBackup: false, snapshotRetention: 0 },
      _vm: {
        uuid: 'live-uuid',
        power_state: 'Halted',
        blocked_operations: {},
        update_blocked_operations: async ops => {
          calls.push(Object.values(ops).every(_ => _ === null) ? 'unblock' : 'block')
        },
        $call: async () => {},
      },
      _writers: new Set([{ beforeBackup: async () => {}, afterBackup: async () => calls.push('afterBackup') }]),
      _xapi: {},
      _cleanMetadata: async () => {},
      _fetchJobSnapshots: async () => {},
      _selectBaseVm: async () => {},
      _removeUnusedSnapshots: async () => calls.push('removeUnusedSnapshots'),
      _removeSnapshotData: async () => calls.push('removeSnapshotData'),
      _healthCheck: async () => calls.push('healthCheck'),
      _snapshot: async function () {
        this._exportedVm = { $ref: 'snapshot-ref', is_a_snapshot: true }
      },
      // a transfer, aborted while it runs
      _copy: () =>
        new Promise((resolve, reject) => {
          const signal = Task.abortSignal
          signal.addEventListener('abort', () => reject(signal.reason), { once: true })
          setImmediate(() => {
            calls.push('abort')
            vmTask.abort()
          })
        }),
    })

    await vmTask.run(() => assert.rejects(runner.run(), { name: 'AbortError' })).catch(() => {})

    assert.deepEqual(calls, [
      'block',
      'removeUnusedSnapshots',
      'abort',
      'removeUnusedSnapshots',
      'removeSnapshotData',
      'unblock',
      'afterBackup',
    ])
  })

  for (const offline of ['offlineBackup', 'offlineSnapshot']) {
    it(`run() does not shut down the VM for an ${offline} aborted before the shutdown`, async () => {
      const calls = []
      const vmTask = new Task({ skipSubtasksAfterAbort: true, onProgress() {} })
      const runner = makeRunner({
        _settings: { [offline]: true, snapshotRetention: 0 },
        _vm: {
          uuid: 'live-uuid',
          power_state: 'Running',
          blocked_operations: {},
          update_blocked_operations: async ops => {
            calls.push(Object.values(ops).every(_ => _ === null) ? 'unblock' : 'block')
          },
          $call: async () => {},
          $callAsync: async method => calls.push(method),
        },
        _writers: new Set([
          {
            // the clean-vm of `beforeBackup()` swallows its own abort error and resolves
            beforeBackup: async () => {
              vmTask.abort()
            },
            afterBackup: async () => calls.push('afterBackup'),
          },
        ]),
        _xapi: {},
        _cleanMetadata: async () => {},
        _fetchJobSnapshots: async () => {},
        _selectBaseVm: async () => {},
        _removeUnusedSnapshots: async () => {},
        _removeSnapshotData: async () => {},
        _healthCheck: async () => calls.push('healthCheck'),
        _snapshot: async () => calls.push('snapshot'),
        _copy: async () => calls.push('copy'),
      })

      await vmTask.run(() => assert.rejects(runner.run(), { name: 'AbortError' })).catch(() => {})

      assert.deepEqual(calls, ['block', 'unblock', 'afterBackup'])
    })
  }
})

describe('with the cleanup skipped', () => {
  // runs `fn(task)` inside a task, as the VM runners are run inside their VM task
  const runInTask = fn => {
    const task = new Task({ onProgress() {} })
    return task.run(() => fn(task))
  }

  // `count` old exported snapshots of the job, which a retention of 0 removes
  const makeRetentionRunner = ({ count, onDestroy }) => {
    const destroyed = []
    const registry = {}
    const vdis = []
    for (let i = 0; i < count; i++) {
      const vm = { $ref: `vm-${i}`, name_label: `old-${i}`, is_control_domain: false, $snapshot_of: 'live-vm-ref' }
      const vdi = {
        $ref: `vdi-${i}`,
        other_config: {
          [DATETIME]: `2024010${i + 1}T00:00:00Z`,
          [SCHEDULE_ID]: 'schedule-1',
          [EXPORTED_SUCCESSFULLY]: 'true',
        },
        $VBDs: [{ $VM: vm }],
      }
      vdis.push(vdi)
      registry[vdi.$ref] = vdi
    }
    const runner = makeRunner({
      _vm: { uuid: 'live-uuid', $snapshots: [] },
      _baseSettings: { snapshotRetention: 0 },
      _jobSnapshotVdis: vdis,
      _disklessJobSnapshotVms: [],
      job: { mode: 'full', settings: {} },
      _xapi: {
        barrier: async () => {},
        getObject: ref => registry[ref],
        VM_destroy: async ref => {
          destroyed.push(ref)
          onDestroy?.(ref)
        },
        VDI_destroy: async ref => {
          destroyed.push(ref)
        },
      },
    })
    return { runner, destroyed }
  }

  it('_removeUnusedSnapshots() destroys nothing when the cleanup is already aborted', async () => {
    const { runner, destroyed } = makeRetentionRunner({ count: 3 })

    await runInTask(async task => {
      task.abortCleanup()
      await runner._removeUnusedSnapshots()
    })

    assert.deepEqual(destroyed, [])
  })

  it('_removeUnusedSnapshots() destroys no further snapshot once the cleanup is aborted, the next run does', async () => {
    let task
    const { runner, destroyed } = makeRetentionRunner({ count: 3, onDestroy: () => task.abortCleanup() })

    await runInTask(async t => {
      task = t
      await runner._removeUnusedSnapshots()
    })

    assert.equal(destroyed.length, 1, 'the destroy in progress is not cancelled, the others are not started')

    // the next run applies the retention to what is left
    runner._xapi.VM_destroy = async ref => destroyed.push(ref)
    runner._jobSnapshotVdis = runner._jobSnapshotVdis.filter(vdi => !destroyed.includes(vdi.$VBDs[0].$VM.$ref))
    await runInTask(() => runner._removeUnusedSnapshots())
    assert.equal(destroyed.length, 3)
  })

  it('_removeUnusedSnapshots() still removes everything when only the backup is aborted (level 1)', async () => {
    const { runner, destroyed } = makeRetentionRunner({ count: 3 })

    await runInTask(async task => {
      task.abort()
      await runner._removeUnusedSnapshots()
    })

    assert.equal(destroyed.length, 3)
  })

  const makeSnapshotDataRunner = ({ onVmDestroy } = {}) => {
    const calls = { vmDestroyed: [], dataDestroyed: [] }
    const runner = makeRunner({
      _exportedVm: { $ref: 'snapshot-ref', $snapshot_of: 'live-vm-ref' },
      _settings: { snapshotRetention: 0, preferNbd: true, cbtDestroySnapshotData: true },
      _xapi: {
        VM_getDisks: async () => ['vdi-1', 'vdi-2'],
        call: async (method, ref) => {
          calls.vmDestroyed.push(`${method}:${ref}`)
          onVmDestroy?.()
        },
        VDI_dataDestroy: async ref => {
          calls.dataDestroyed.push(ref)
        },
      },
    })
    return { calls, runner }
  }

  it('_removeSnapshotData() is skipped when the cleanup is already aborted', async () => {
    const { calls, runner } = makeSnapshotDataRunner()

    await runInTask(async task => {
      task.abortCleanup()
      await runner._removeSnapshotData()
    })

    assert.deepEqual(calls, { vmDestroyed: [], dataDestroyed: [] })
  })

  it('_removeSnapshotData() completes once started, even if the cleanup is then skipped', async () => {
    let task
    const { calls, runner } = makeSnapshotDataRunner({ onVmDestroy: () => task.abortCleanup() })

    await runInTask(async t => {
      task = t
      await runner._removeSnapshotData()
    })

    assert.deepEqual(calls.vmDestroyed, ['VM.destroy:snapshot-ref'])
    assert.deepEqual(
      calls.dataDestroyed,
      ['vdi-1', 'vdi-2'],
      'no VDI is left with its data, which the next run would miss'
    )
  })

  // the steps kept at level 2: the VM must be usable and unblocked, and the writers must release their locks
  const makeKeptStepsRunner = ({ calls, vmTask, offline }) =>
    makeRunner({
      _settings: { offlineBackup: offline, snapshotRetention: 0 },
      _vm: {
        uuid: 'live-uuid',
        power_state: 'Running',
        blocked_operations: {},
        update_blocked_operations: async ops => {
          calls.push(Object.values(ops).every(_ => _ === null) ? 'unblock' : 'block')
        },
        $call: async () => {},
        $callAsync: async method => {
          calls.push(method)
        },
      },
      _writers: new Set([{ beforeBackup: async () => {}, afterBackup: async () => calls.push('afterBackup') }]),
      _xapi: {},
      _cleanMetadata: async () => {},
      _fetchJobSnapshots: async () => {},
      _selectBaseVm: async () => {},
      _removeUnusedSnapshots: async () => {
        // the user skips the cleanup while the snapshots are removed
        calls.push('removeUnusedSnapshots')
        vmTask.abortCleanup()
      },
      _removeSnapshotData: async () => calls.push('removeSnapshotData'),
      _healthCheck: async () => calls.push('healthCheck'),
      _snapshot: async function () {
        this._exportedVm = { $ref: 'snapshot-ref', is_a_snapshot: true }
      },
      _copy: async () => {
        vmTask.abort()
        throw Task.abortSignal.reason
      },
    })

  it('run() still restores the blocked operations and calls afterBackup() when the cleanup is skipped', async () => {
    const calls = []
    const vmTask = new Task({ onProgress() {} })
    const runner = makeKeptStepsRunner({ calls, vmTask, offline: false })

    await vmTask.run(() => assert.rejects(runner.run(), { name: 'AbortError' })).catch(() => {})

    assert.ok(calls.includes('unblock'), 'the VM can be migrated again')
    assert.ok(calls.includes('afterBackup'), 'the writers release their locks')
    assert.ok(!calls.includes('healthCheck'))
  })

  it('run() still starts again a VM shut down for an offline backup when the cleanup is skipped', async () => {
    const calls = []
    const vmTask = new Task({ onProgress() {} })
    const runner = makeKeptStepsRunner({ calls, vmTask, offline: true })

    await vmTask.run(() => assert.rejects(runner.run(), { name: 'AbortError' })).catch(() => {})

    assert.deepEqual(
      calls.filter(_ => _ === 'clean_shutdown' || _ === 'start'),
      ['clean_shutdown', 'start']
    )
  })
})
