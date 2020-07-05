import asyncMap from '@xen-orchestra/async-map'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { formatDateTime } from '@xen-orchestra/xapi'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'

import { importDeltaVm } from './_deltaVm'
import { listReplicatedVms } from './_listReplicatedVms'
import { Task } from './_Task'

export class ContinuousReplicationWriter {
  constructor(backup, sr, settings) {
    this._backup = backup
    this._settings = settings
    this._sr = sr

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: ({ deltaExport }) => ({
          id: sr.uuid,
          isFull: Object.values(deltaExport.vdis).some(
            vdi => vdi.other_config['xo:base_delta'] === undefined
          ),
          type: 'SR',
        }),
      },
      this.run
    )
  }

  async run({ timestamp, deltaExport, sizeContainers }) {
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

    let targetVmRef
    await Task.run({ name: 'transfer' }, async () => {
      targetVmRef = await importDeltaVm(deltaExport, sr)
      return {
        size: Object.values(sizeContainers).reduce(
          (sum, { size }) => sum + size,
          0
        ),
      }
    })

    const targetVm = await xapi.getRecord('VM', targetVmRef)

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
