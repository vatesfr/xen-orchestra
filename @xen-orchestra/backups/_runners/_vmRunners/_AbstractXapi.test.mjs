import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatDateTime } from '@xen-orchestra/xapi'

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
      // exported successfully by the previous run
      other_config: { [EXPORTED_SUCCESSFULLY]: 'true' },
    }
    const baseVdi = {
      $ref: 'vdi-base',
      other_config: { [DATETIME]: BASE_DATETIME, [SCHEDULE_ID]: 'schedule-1' },
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
