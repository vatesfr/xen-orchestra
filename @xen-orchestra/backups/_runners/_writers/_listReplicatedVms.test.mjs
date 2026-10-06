import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { listReplicatedVms } from './_listReplicatedVms.mjs'
import { DATETIME, JOB_ID, REPLICATED_TO_SR_UUID, SCHEDULE_ID, VM_UUID } from '../../_otherConfig.mjs'

const SCHEDULE_UUID = 'schedule-1'
const SR_UUID = 'sr-1'
const VM_UUID_ = 'vm-1'

// the live VM being backed up, and the replica the job creates on the target SR
const sourceVm = { $id: 'source', uuid: VM_UUID_ }
const replicaVm = { $id: 'replica', uuid: 'replica-uuid' }

const makeVm = ({ $id, datetime, isSnapshot = false, snapshotOf, srUuid, startBlocked = false }) => ({
  $id,
  $type: 'VM',
  blocked_operations: startBlocked ? { start: 'blocked' } : {},
  is_a_snapshot: isSnapshot,
  is_a_template: false,
  name_label: $id,
  $snapshot_of: snapshotOf,
  other_config: {
    [DATETIME]: datetime,
    [JOB_ID]: 'job-1',
    [SCHEDULE_ID]: SCHEDULE_UUID,
    [VM_UUID]: VM_UUID_,
    ...(srUuid !== undefined && { [REPLICATED_TO_SR_UUID]: srUuid }),
  },
})

// the job's own rolling snapshot: a snapshot of the source VM, no target SR
const backupSnapshot = makeVm({
  $id: 'backup-snapshot',
  datetime: '20260906T060030Z',
  isSnapshot: true,
  snapshotOf: sourceVm,
})

// old-style replication: one non-snapshot VM per transfer, start blocked
const oldStyleReplica = makeVm({
  $id: 'old-style-replica',
  datetime: '20260827T060047Z',
  srUuid: SR_UUID,
  startBlocked: true,
})

// new-style replication: each transfer is a snapshot of the replicated target VM
const replicationSnapshot = makeVm({
  $id: 'replication-snapshot',
  datetime: '20260906T060030Z',
  isSnapshot: true,
  snapshotOf: replicaVm,
  srUuid: SR_UUID,
})

// a new-style transfer interrupted before its target SR was stamped
const interruptedReplicationSnapshot = makeVm({
  $id: 'interrupted-replication-snapshot',
  datetime: '20260905T060030Z',
  isSnapshot: true,
  snapshotOf: replicaVm,
})

const makeXapi = vms => ({ objects: { indexes: { type: { VM: Object.fromEntries(vms.map(vm => [vm.$id, vm])) } } } })

const ids = entries => entries.map(_ => _.$id).sort()

describe('listReplicatedVms()', () => {
  it('never returns the backup snapshot of the source VM', () => {
    const xapi = makeXapi([backupSnapshot, oldStyleReplica, replicationSnapshot, interruptedReplicationSnapshot])

    // the "delete previous interrupted copies" call of the Xapi writers
    assert.deepEqual(ids(listReplicatedVms(xapi, SCHEDULE_UUID, undefined, VM_UUID_)), [
      'interrupted-replication-snapshot',
    ])
    assert.deepEqual(ids(listReplicatedVms(xapi, SCHEDULE_UUID, SR_UUID, VM_UUID_)), [
      'old-style-replica',
      'replication-snapshot',
    ])
  })

  it('returns the replication entries of the requested SR', () => {
    const xapi = makeXapi([oldStyleReplica, replicationSnapshot])

    assert.deepEqual(ids(listReplicatedVms(xapi, SCHEDULE_UUID, SR_UUID, VM_UUID_)), [
      'old-style-replica',
      'replication-snapshot',
    ])
    assert.deepEqual(listReplicatedVms(xapi, SCHEDULE_UUID, 'other-sr', VM_UUID_), [])
  })

  it('ignores an old-style replica whose start is not blocked', () => {
    const xapi = makeXapi([makeVm({ $id: 'not-a-replica', datetime: '20260906T060030Z', srUuid: SR_UUID })])

    assert.deepEqual(listReplicatedVms(xapi, SCHEDULE_UUID, SR_UUID, VM_UUID_), [])
  })
})
