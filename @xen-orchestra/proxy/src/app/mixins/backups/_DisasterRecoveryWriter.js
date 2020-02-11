import asyncMap from '@xen-orchestra/async-map'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { formatDateTime } from '@xen-orchestra/xapi'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'

const getReplicatedVmDatetime = vm => {
  const {
    'xo:backup:datetime': datetime = vm.name_label.slice(-17, -1),
  } = vm.other_config
  return datetime
}

const compareReplicatedVmDatetime = (a, b) =>
  getReplicatedVmDatetime(a) < getReplicatedVmDatetime(b) ? -1 : 1

const listReplicatedVms = (xapi, scheduleOrJobId, srUuid, vmUuid) => {
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
      (oc['xo:backup:job'] === scheduleOrJobId ||
        oc['xo:backup:schedule'] === scheduleOrJobId) &&
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

export class DisasterRecoveryWriter {
  constructor(backup, sr, settings) {
    this._backup = backup
    this._settings = settings
    this._sr = sr
  }

  async run({ timestamp, stream }) {
    const sr = this._sr
    const settings = this._settings
    const { job, scheduleId, vm } = this._backup

    const { uuid: srUuid, $xapi: xapi } = sr

    // delete previous interrupted copies
    ignoreErrors.call(
      asyncMap(listReplicatedVms(xapi, scheduleId, undefined, vm.uuid), vm =>
        xapi.VM_destroy(vm.$ref)
      )
    )

    const oldVms = getOldEntries(
      settings.copyRetention - 1,
      listReplicatedVms(xapi, scheduleId, srUuid, vm.uuid)
    )

    const deleteOldBackups = () =>
      asyncMap(oldVms, vm => xapi.VM_destroy(vm.$ref))
    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }
    const targetVm = await xapi.getRecord(
      'VM',
      await xapi.VM_import(stream, sr.$ref)
    )

    await Promise.all([
      targetVm.add_tags('Disaster Recovery'),
      targetVm.ha_restart_priority !== '' &&
        Promise.all([
          targetVm.set_ha_restart_priority(''),
          targetVm.add_tags('HA disabled'),
        ]),
      targetVm.set_name_label(
        `${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`
      ),
      targetVm.update_blocked_operations(
        'start',
        'Start operation for this vm is blocked, clone it if you want to use it.'
      ),
      targetVm.update_other_config({
        'xo:backup:sr': srUuid,

        // these entries need to be added in case of offline backup
        'xo:backup:datetime': formatDateTime(timestamp),
        'xo:backup:job': job.id,
        'xo:backup:schedule': scheduleId,
        'xo:backup:vm': vm.uuid,
      }),
    ])

    if (!deleteFirst) {
      await deleteOldBackups()
    }
  }
}
