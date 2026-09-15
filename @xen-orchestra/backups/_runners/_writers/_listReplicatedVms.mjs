import { DATETIME, JOB_ID, REPLICATED_TO_SR_UUID, SCHEDULE_ID, VM_UUID } from '../../_otherConfig.mjs'

const getReplicatedVmDatetime = vm => {
  const { [DATETIME]: datetime = vm.name_label.slice(-17, -1) } = vm.other_config
  return datetime
}

export const compareReplicatedVmDatetime = (a, b) => (getReplicatedVmDatetime(a) < getReplicatedVmDatetime(b) ? -1 : 1)

/**
 *
 * @param {Xapi} xapi
 * @param {string} scheduleOrJobId
 * @param {string} srUuid
 * @param {string} vmUuid
 * @returns {Array<XoVm>}
 */
export function listReplicatedVms(xapi, scheduleOrJobId, srUuid, vmUuid) {
  const all = xapi.objects.indexes.type.VM
  const vms = {}
  for (const key in all) {
    const object = all[key]
    const oc = object.other_config
    // a snapshot on the target, not on the source VM
    const isReplicationSnapshot =
      object.is_a_snapshot && object.$snapshot_of !== undefined && object.$snapshot_of.uuid !== vmUuid
    // a replicated full VM
    const isOldStyleReplica = !object.is_a_snapshot && 'start' in object.blocked_operations
    if (
      object.$type === 'VM' &&
      !object.is_a_template &&
      (oc[JOB_ID] === scheduleOrJobId || oc[SCHEDULE_ID] === scheduleOrJobId) &&
      oc[REPLICATED_TO_SR_UUID] === srUuid &&
      oc[VM_UUID] === vmUuid &&
      // Old-style replication: one VM per transfer (non-snapshot, start blocked)
      // New-style replication: snapshots of the target VM represent each transfer
      //
      // A snapshot of the VM designated by VM_UUID is the backup snapshot taken by the
      // job on the source VM, never a replication entry: a replication snapshot is a
      // snapshot of a replica. Without this, a job replicating to an SR of the source
      // pool destroys its own rolling snapshots.
      (isOldStyleReplica || isReplicationSnapshot)
    ) {
      vms[object.$id] = object
    }
  }

  return Object.values(vms).sort(compareReplicatedVmDatetime)
}
