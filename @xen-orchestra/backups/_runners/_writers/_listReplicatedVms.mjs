import { DATETIME, JOB_ID, REPLICATED_TO_SR_UUID, SCHEDULE_ID, VM_UUID } from '../../_otherConfig.mjs'

const getReplicatedVmDatetime = vm => {
  const { [DATETIME]: datetime = vm.name_label.slice(-17, -1) } = vm.other_config
  return datetime
}

const compareReplicatedVmDatetime = (a, b) => (getReplicatedVmDatetime(a) < getReplicatedVmDatetime(b) ? -1 : 1)

export function listReplicatedVms(xapi, scheduleOrJobId, srUuid, vmUuid) {
  const { all } = xapi.objects
  const vms = {}
  for (const key in all) {
    const object = all[key]
    const oc = object.other_config
    if (
      object.$type === 'VM' &&
      !object.is_a_snapshot &&
      !object.is_a_template &&
      'start' in object.blocked_operations &&
      (oc[JOB_ID] === scheduleOrJobId || oc[SCHEDULE_ID] === scheduleOrJobId) &&
      oc[REPLICATED_TO_SR_UUID] === srUuid &&
      (oc[VM_UUID] === vmUuid ||
        // 2018-03-28, JFT: to catch VMs replicated before this fix
        oc[VM_UUID] === undefined)
    ) {
      vms[object.$id] = object
    }
  }

  return Object.values(vms).sort(compareReplicatedVmDatetime)
}
