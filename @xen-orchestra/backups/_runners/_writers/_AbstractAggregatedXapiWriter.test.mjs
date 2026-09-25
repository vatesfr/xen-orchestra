import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { AbstractAggregatedXapiWriter } from './_AbstractAggregatedXapiWriter.mjs'
import { DATETIME, JOB_ID, REPLICATED_TO_SR_UUID, SCHEDULE_ID, VM_UUID } from '../../_otherConfig.mjs'

// This exercises setOldReplicaList()/deleteOldReplicas() through the REAL
// listReplicatedVms() (same fixture style as ./_listReplicatedVms.test.mjs), rather
// than mocking the module. This is deliberate: `node:test`'s module mocking needs
// --experimental-test-module-mocks, which this repo's `test` script (and therefore
// the pre-commit hook) does not pass, so a mocked version of this test would never
// pass CI. Going through the real filtering logic also means this test genuinely
// proves the fix — not just that a particular value gets forwarded to a spy.

const SOURCE_VM_UUID = 'vm-1'
const SR_UUID = 'sr-1'
const SCHEDULE_A = 'schedule-a'
const SCHEDULE_B = 'schedule-b'

const replicaTarget = { uuid: 'replica-target-uuid' } // stand-in for $snapshot_of on new-style replicas

/**
 * Builds a fake "new-style" replication snapshot: a snapshot of the replicated
 * target VM (not of the source VM), tagged with the schedule/job that produced it.
 */
const makeReplicaSnapshot = ({ id, datetime, scheduleId, srUuid = SR_UUID, vmUuid = SOURCE_VM_UUID }) => ({
  $id: id,
  $type: 'VM',
  blocked_operations: {},
  is_a_snapshot: true,
  is_a_template: false,
  name_label: id,
  $snapshot_of: replicaTarget,
  other_config: {
    [DATETIME]: datetime,
    [JOB_ID]: 'job-1',
    [SCHEDULE_ID]: scheduleId,
    [VM_UUID]: vmUuid,
    [REPLICATED_TO_SR_UUID]: srUuid,
  },
})

const makeXapi = vms => ({ objects: { indexes: { type: { VM: Object.fromEntries(vms.map(vm => [vm.$id, vm])) } } } })

/** Attaches $xapi/$ref (as deleteOldReplicas expects) and a VM_destroy spy to each vm. */
function wireForDestroy(vms, destroyCalls) {
  const xapi = makeXapi(vms)
  for (const vm of vms) {
    vm.$xapi = { objects: xapi.objects, VM_destroy: ref => destroyCalls.push(ref) }
    vm.$ref = vm.$id
  }
  return xapi
}

function makeSr(xapi, uuid = SR_UUID) {
  return {
    uuid,
    name_label: `sr-${uuid}`,
    physical_utilisation: 0,
    physical_size: 100,
    $xapi: xapi,
  }
}

function makeWriter({ srs, vmUuid = SOURCE_VM_UUID, scheduleId, copyRetention }) {
  return new AbstractAggregatedXapiWriter({
    srs,
    ReplicationWriter: class {},
    vmUuid,
    schedule: { id: scheduleId }, // <-- the real shape passed by the caller
    settings: { copyRetention },
    job: { settings: {} },
  })
}

describe('AbstractAggregatedXapiWriter#setOldReplicaList / deleteOldReplicas', () => {
  it('finds and prunes replicas for its own schedule down to copyRetention', async () => {
    const replicas = [
      makeReplicaSnapshot({ id: 'a-1', datetime: '20260101T000000Z', scheduleId: SCHEDULE_A }),
      makeReplicaSnapshot({ id: 'a-2', datetime: '20260102T000000Z', scheduleId: SCHEDULE_A }),
      makeReplicaSnapshot({ id: 'a-3', datetime: '20260103T000000Z', scheduleId: SCHEDULE_A }),
      makeReplicaSnapshot({ id: 'a-4', datetime: '20260104T000000Z', scheduleId: SCHEDULE_A }),
    ]
    const destroyCalls = []
    const xapi = wireForDestroy(replicas, destroyCalls)
    const writer = makeWriter({ srs: [makeSr(xapi)], scheduleId: SCHEDULE_A, copyRetention: 2 })

    writer.setOldReplicaList()
    await writer.deleteOldReplicas()

    // copyRetention 2 keeps the running copy + 1 old one => 4 - 1 = 3 old ones pruned.
    // (If setOldReplicaList still reads props.scheduleId instead of props.schedule.id,
    // scheduleId is undefined, listReplicatedVms matches nothing, and destroyCalls
    // stays empty — this assertion catches exactly that regression.)
    assert.equal(
      destroyCalls.length,
      replicas.length - (2 - 1),
      `expected ${replicas.length - 1} replicas pruned for retention 2, got ${destroyCalls.length}. ` +
        'An empty destroyCalls list means listReplicatedVms was called with an undefined schedule id ' +
        'and matched nothing (the scheduleId-vs-schedule.id bug).'
    )
  })

  it('does not touch another schedule’s replicas on the same VM/SR when pruning its own', async () => {
    const scheduleAReplicas = [
      makeReplicaSnapshot({ id: 'a-1', datetime: '20260101T000000Z', scheduleId: SCHEDULE_A }),
      makeReplicaSnapshot({ id: 'a-2', datetime: '20260102T000000Z', scheduleId: SCHEDULE_A }),
      makeReplicaSnapshot({ id: 'a-3', datetime: '20260103T000000Z', scheduleId: SCHEDULE_A }),
    ]
    const scheduleBReplicas = [
      makeReplicaSnapshot({ id: 'b-1', datetime: '20260101T000000Z', scheduleId: SCHEDULE_B }),
      makeReplicaSnapshot({ id: 'b-2', datetime: '20260102T000000Z', scheduleId: SCHEDULE_B }),
      makeReplicaSnapshot({ id: 'b-3', datetime: '20260103T000000Z', scheduleId: SCHEDULE_B }),
      makeReplicaSnapshot({ id: 'b-4', datetime: '20260104T000000Z', scheduleId: SCHEDULE_B }),
      makeReplicaSnapshot({ id: 'b-5', datetime: '20260105T000000Z', scheduleId: SCHEDULE_B }),
    ]

    // Both schedules' replicas coexist in the same xapi, same SR, same source VM —
    // exactly the real-world "multiple schedules on one job" case the bug breaks.
    const allReplicas = [...scheduleAReplicas, ...scheduleBReplicas]
    const destroyCalls = []
    const xapi = wireForDestroy(allReplicas, destroyCalls)

    // Prune schedule A only (retention 1: keep the running copy, drop the rest).
    const writerA = makeWriter({ srs: [makeSr(xapi)], scheduleId: SCHEDULE_A, copyRetention: 1 })
    writerA.setOldReplicaList()
    await writerA.deleteOldReplicas()

    const destroyedIds = destroyCalls.slice().sort()
    assert.deepEqual(
      destroyedIds,
      ['a-1', 'a-2', 'a-3'],
      'pruning schedule A should only ever destroy schedule A replicas, never schedule B’s — ' +
        `got ${JSON.stringify(destroyedIds)}`
    )

    // Now prune schedule B (retention 2: keep the running copy + 1 old one => drop 4 of 5).
    const writerB = makeWriter({ srs: [makeSr(xapi)], scheduleId: SCHEDULE_B, copyRetention: 2 })
    writerB.setOldReplicaList()
    await writerB.deleteOldReplicas()

    const destroyedAfterB = destroyCalls.slice(3).sort() // calls added since writerA's pass
    assert.equal(destroyedAfterB.length, scheduleBReplicas.length - (2 - 1))
    assert.ok(
      destroyedAfterB.every(id => id.startsWith('b-')),
      `pruning schedule B should only destroy schedule B replicas — got ${JSON.stringify(destroyedAfterB)}`
    )
  })

  it('calls listReplicatedVms scoped to each storage repository in turn', async () => {
    const srAReplicas = [
      makeReplicaSnapshot({ id: 'sr-a-1', datetime: '20260101T000000Z', scheduleId: SCHEDULE_A, srUuid: 'sr-a' }),
      makeReplicaSnapshot({ id: 'sr-a-2', datetime: '20260102T000000Z', scheduleId: SCHEDULE_A, srUuid: 'sr-a' }),
    ]
    const srBReplicas = [
      makeReplicaSnapshot({ id: 'sr-b-1', datetime: '20260101T000000Z', scheduleId: SCHEDULE_A, srUuid: 'sr-b' }),
      makeReplicaSnapshot({ id: 'sr-b-2', datetime: '20260102T000000Z', scheduleId: SCHEDULE_A, srUuid: 'sr-b' }),
      makeReplicaSnapshot({ id: 'sr-b-3', datetime: '20260103T000000Z', scheduleId: SCHEDULE_A, srUuid: 'sr-b' }),
    ]

    const destroyCalls = []
    // Both SRs happen to share the same underlying xapi object index in this fixture
    // (as they would if source and destination are on the same pool); what matters is
    // that each SR's uuid scopes its own replicas.
    const xapi = wireForDestroy([...srAReplicas, ...srBReplicas], destroyCalls)

    const writer = makeWriter({
      srs: [makeSr(xapi, 'sr-a'), makeSr(xapi, 'sr-b')],
      scheduleId: SCHEDULE_A,
      copyRetention: 1, // keep only the running copy on each SR
    })

    writer.setOldReplicaList()
    await writer.deleteOldReplicas()

    assert.deepEqual(
      destroyCalls.slice().sort(),
      ['sr-a-1', 'sr-a-2', 'sr-b-1', 'sr-b-2', 'sr-b-3'],
      'retention 1 should prune every replica on every configured SR down to none kept aside'
    )
  })
})
