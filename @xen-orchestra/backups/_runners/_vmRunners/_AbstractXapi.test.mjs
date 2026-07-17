import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { AbstractXapi } from './_AbstractXapi.mjs'
import { DATETIME, SCHEDULE_ID } from '../../_otherConfig.mjs'

// Build an AbstractXapi instance without running its heavy constructor, then
// assign only the fields the method under test reads.
const makeRunner = props => Object.assign(Object.create(AbstractXapi.prototype), props)

describe('_snapshot() synchronized-snapshot reuse guard', () => {
  it('reuses a pre-taken snapshot: does not snapshot again when _exportedVm is already set', async () => {
    let mustDoSnapshotCalls = 0
    const preTaken = { $ref: 'pre-taken-snapshot' }
    const runner = makeRunner({
      _exportedVm: preTaken,
      _vm: { uuid: 'vm-uuid' },
      _xapi: {},
      _settings: {},
      // if the guard is missing, _snapshot() falls through to here
      _mustDoSnapshot: async () => {
        mustDoSnapshotCalls++
        return false
      },
    })

    await runner._snapshot()

    assert.equal(mustDoSnapshotCalls, 0, '_mustDoSnapshot() must not be called when the snapshot was pre-taken')
    assert.equal(runner._exportedVm, preTaken, 'the pre-taken snapshot must be left untouched')
  })

  it('without a pre-taken snapshot and no snapshot needed, exports the live VM (existing behaviour)', async () => {
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

    assert.equal(mustDoSnapshotCalls, 1)
    assert.equal(runner._exportedVm, vm, 'the live VM must be exported directly')
    assert.equal(typeof runner.timestamp, 'number')
  })
})

describe('_removeUnusedSnapshots() protects the pre-taken synchronized snapshot', () => {
  const OLD_DATETIME = '2024-01-01T00:00:00Z'
  const FRESH_DATETIME = '2024-06-01T00:00:00Z'

  // Two backup snapshots in a full-mode job with snapshotRetention 0, so
  // retention wants to remove *both*. One of them (`vm-fresh`) is the snapshot
  // just taken by the synchronized batch and referenced by `_exportedVm`.
  const makeRemoveRunner = ({ snapshotConsumed }) => {
    const destroyed = []

    const snapshotVm = ($ref, name_label) => ({
      $ref,
      name_label,
      is_control_domain: false,
      $snapshot_of: 'live-vm-ref',
    })
    const exportedSnapshotVm = snapshotVm('vm-fresh', 'fresh')
    const oldSnapshotVm = snapshotVm('vm-old', 'old')

    const vdi = ($ref, datetime, snapshotVmRecord) => ({
      $ref,
      other_config: { [DATETIME]: datetime, [SCHEDULE_ID]: 'schedule-1' },
      $VBDs: [{ $VM: snapshotVmRecord }],
    })
    const oldVdi = vdi('vdi-old', OLD_DATETIME, oldSnapshotVm)
    const freshVdi = vdi('vdi-fresh', FRESH_DATETIME, exportedSnapshotVm)

    const registry = { 'vdi-old': oldVdi, 'vdi-fresh': freshVdi }

    const runner = makeRunner({
      _snapshotConsumed: snapshotConsumed,
      _exportedVm: exportedSnapshotVm,
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
    const { runner, destroyed } = makeRemoveRunner({ snapshotConsumed: false })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['vm-old'], 'only the older snapshot is removed; the fresh one is protected')
  })

  it('destroys the snapshot once it has been transferred (retention 0, no leak)', async () => {
    const { runner, destroyed } = makeRemoveRunner({ snapshotConsumed: true })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed.sort(), ['vm-fresh', 'vm-old'], 'both snapshots are removed after transfer')
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
      _snapshotConsumed: false,
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

    assert.deepEqual(vdiDestroyed, ['vdi-orphan'], 'the orphan VDI must be reclaimed via VDI_destroy')
    assert.deepEqual(vmDestroyed, [], 'no VM should be destroyed for an orphan VDI')
  })
})

describe('_removeUnusedSnapshots() diskless VM snapshots', () => {
  const OLD_DATETIME = '2024-01-01T00:00:00Z'
  const FRESH_DATETIME = '2024-06-01T00:00:00Z'

  // A diskless VM's backup snapshots are tracked as VM snapshots (no VDIs to
  // anchor them). `dl-fresh` is the snapshot the synchronized batch pre-took.
  const makeDisklessRunner = ({ snapshotConsumed, mode = 'full' }) => {
    const destroyed = []

    const oldSnap = { $ref: 'dl-old', other_config: { [DATETIME]: OLD_DATETIME, [SCHEDULE_ID]: 'schedule-1' } }
    const freshSnap = { $ref: 'dl-fresh', other_config: { [DATETIME]: FRESH_DATETIME, [SCHEDULE_ID]: 'schedule-1' } }
    const registry = { 'dl-old': oldSnap, 'dl-fresh': freshSnap }

    const runner = makeRunner({
      _snapshotConsumed: snapshotConsumed,
      _exportedVm: freshSnap,
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
    const { runner, destroyed } = makeDisklessRunner({ snapshotConsumed: false })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['dl-old'], 'only the older diskless snapshot is removed; the fresh one is protected')
  })

  it('destroys the diskless snapshot once it has been transferred (retention 0, no leak)', async () => {
    const { runner, destroyed } = makeDisklessRunner({ snapshotConsumed: true })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed.sort(), ['dl-fresh', 'dl-old'], 'both diskless snapshots are removed after transfer')
  })

  it('keeps the most recent diskless snapshot in delta mode (base for next delta)', async () => {
    // Even after transfer (snapshotConsumed), delta mode must retain the latest
    // snapshot so the next run can compute its delta against it.
    const { runner, destroyed } = makeDisklessRunner({ snapshotConsumed: true, mode: 'delta' })

    await runner._removeUnusedSnapshots()

    assert.deepEqual(destroyed, ['dl-old'], 'the most recent diskless snapshot must be kept in delta mode')
  })
})
