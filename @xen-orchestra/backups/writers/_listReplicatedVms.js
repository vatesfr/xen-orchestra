'use strict'

const getReplicatedVmDatetime = vm => {
  const { 'xo:backup:datetime': datetime = vm.name_label.slice(-17, -1) } = vm.other_config
  return datetime
}

const compareReplicatedVmDatetime = (a, b) => (getReplicatedVmDatetime(a) < getReplicatedVmDatetime(b) ? -1 : 1)

exports.listReplicatedVms = function listReplicatedVms(xapi, scheduleOrJobId, srUuid, vmUuid) {
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
      (oc['xo:backup:job'] === scheduleOrJobId || oc['xo:backup:schedule'] === scheduleOrJobId) &&
      oc['xo:backup:sr'] === srUuid &&
      (oc['xo:backup:vm'] === vmUuid ||
        // 2018-03-28, JFT: to catch VMs replicated before this fix
        oc['xo:backup:vm'] === undefined)
    ) {
      vms[object.$id] = object
    }
  }

  return Object.values(vms).sort(compareReplicatedVmDatetime)
}
