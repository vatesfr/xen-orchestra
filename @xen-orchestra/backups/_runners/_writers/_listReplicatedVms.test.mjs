import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { formatDateTime } from '@xen-orchestra/xapi'

import { compareReplicatedVmDatetime, filterRetentionEntries, listReplicatedVms } from './_listReplicatedVms.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'
import { DATETIME, JOB_ID, REPLICATED_TO_SR_UUID, SCHEDULE_ID, VM_UUID } from '../../_otherConfig.mjs'

const JOB = 'job-1'
const SCHEDULE = 'schedule-1'
const SR = 'sr-1'
const VM = 'vm-1'

// A replication target VM: non-snapshot, start blocked, tagged by the last successful run.
const makeTargetVm = (ref, timestamp) => ({
  $type: 'VM',
  $id: ref,
  $ref: ref,
  name_label: `[XO Backup job] ${VM}`,
  is_a_template: false,
  is_a_snapshot: false,
  blocked_operations: { start: 'blocked' },
  other_config: {
    [JOB_ID]: JOB,
    [SCHEDULE_ID]: SCHEDULE,
    [VM_UUID]: VM,
    [REPLICATED_TO_SR_UUID]: SR,
    [DATETIME]: formatDateTime(timestamp),
  },
})

// A restore point: a snapshot of the target VM, one per successful transfer.
const makeTargetSnapshot = (ref, targetRef, timestamp) => ({
  ...makeTargetVm(ref, timestamp),
  $id: ref,
  $ref: ref,
  is_a_snapshot: true,
  snapshot_of: targetRef,
})

const makeXapi = objects => ({
  objects: { indexes: { type: { VM: Object.fromEntries(objects.map(_ => [_.$ref, _])) } } },
})

describe('filterRetentionEntries()', () => {
  it('spares a target VM as long as it holds snapshots', () => {
    const target = makeTargetVm('target-a', 1)
    const snapshot = makeTargetSnapshot('snapshot-a1', 'target-a', 1)

    const kept = filterRetentionEntries([target, snapshot])

    assert.deepEqual(
      kept.map(_ => _.$ref),
      ['snapshot-a1'],
      'destroying the target VM would destroy the restore points it holds'
    )
  })

  it('exposes a target VM that no longer holds any snapshot', () => {
    // this is the abandoned target of a run that could not chain onto it: once retention
    // has reaped its last snapshot, nothing else references it and it must be collectable
    const abandoned = makeTargetVm('target-a', 1)
    const current = makeTargetVm('target-b', 2)
    const snapshot = makeTargetSnapshot('snapshot-b1', 'target-b', 2)

    const kept = filterRetentionEntries([abandoned, current, snapshot])

    assert.deepEqual(kept.map(_ => _.$ref).sort(), ['snapshot-b1', 'target-a'])
  })

  it('keeps old-style entries, which are non-snapshot VMs without snapshots', () => {
    const entries = [makeTargetVm('old-1', 1), makeTargetVm('old-2', 2)]

    assert.deepEqual(
      filterRetentionEntries(entries).map(_ => _.$ref),
      ['old-1', 'old-2']
    )
  })
})

describe('regression: replicated VMs pile up beyond the retention', () => {
  // reproduces the state left by a run that could not reuse the previous target VM:
  // target-a was abandoned, target-b is the new one, and retention is 1
  const abandoned = makeTargetVm('target-a', 1)
  const current = makeTargetVm('target-b', 2)
  const currentSnapshot = makeTargetSnapshot('snapshot-b1', 'target-b', 2)

  it('still finds an abandoned target VM after its other_config has been reset', () => {
    // resetVmOtherConfig() used to strip JOB_ID/SCHEDULE_ID/VM_UUID/DATETIME from the
    // target VM, making it invisible here and therefore impossible to ever collect
    const xapi = makeXapi([abandoned, current, currentSnapshot])

    assert.deepEqual(
      listReplicatedVms(xapi, SCHEDULE, SR, VM).map(_ => _.$ref),
      ['target-a', 'target-b', 'snapshot-b1']
    )
  })

  it('collects the abandoned target VM, and only it, with a retention of 1', () => {
    const xapi = makeXapi([abandoned, current, currentSnapshot])

    const retentionEntries = filterRetentionEntries(listReplicatedVms(xapi, SCHEDULE, SR, VM))
    retentionEntries.sort(compareReplicatedVmDatetime)
    const oldEntries = getOldEntries(/* copyRetention - 1 */ 0, retentionEntries)

    assert.deepEqual(
      oldEntries.map(_ => _.$ref),
      ['target-a', 'snapshot-b1'],
      'the abandoned target VM must be collected; the current target VM must never be'
    )
  })
})
