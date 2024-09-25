import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'
import { Task } from '@vates/task'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'

import { AbstractFullWriter } from './_AbstractFullWriter.mjs'
import { MixinXapiWriter } from './_MixinXapiWriter.mjs'
import { listReplicatedVms } from './_listReplicatedVms.mjs'
import { setVmOtherConfig } from '../../_otherConfig.mjs'

export class FullXapiWriter extends MixinXapiWriter(AbstractFullWriter) {
  constructor(props) {
    super(props)

    this.run = Task.wrap(
      {
        properties: {
          id: props.sr.uuid,
          name: 'export',
          name_label: this._sr.name_label,
          type: 'SR',

          // necessary?
          isFull: true,
        },
      },
      this.run
    )
  }

  async _run({ timestamp, sizeContainer, stream, vm }) {
    const sr = this._sr
    const settings = this._settings
    const job = this._job
    const scheduleId = this._scheduleId

    const { uuid: srUuid, $xapi: xapi } = sr

    // delete previous interrupted copies
    ignoreErrors.call(
      asyncMapSettled(listReplicatedVms(xapi, scheduleId, undefined, vm.uuid), vm => xapi.VM_destroy(vm.$ref))
    )

    const oldVms = getOldEntries(settings.copyRetention - 1, listReplicatedVms(xapi, scheduleId, srUuid, vm.uuid))

    const deleteOldBackups = () => asyncMapSettled(oldVms, vm => xapi.VM_destroy(vm.$ref))
    const { deleteFirst, _warmMigration } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }

    let targetVmRef
    await Task.run({ properties: { name: 'transfer' } }, async () => {
      targetVmRef = await xapi.VM_import(stream, sr.$ref, vm =>
        Promise.all([
          !_warmMigration && vm.add_tags('Disaster Recovery'),
          // warm migration does not disable HA , since the goal is to start the new VM in production
          !_warmMigration &&
            vm.ha_restart_priority !== '' &&
            Promise.all([vm.set_ha_restart_priority(''), vm.add_tags('HA disabled')]),
          vm.set_name_label(`${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`),
        ])
      )
      return { size: sizeContainer.size }
    })

    this._targetVmRef = targetVmRef
    const targetVm = await xapi.getRecord('VM', targetVmRef)

    await Promise.all([
      asyncMap(['start', 'start_on'], op =>
        targetVm.update_blocked_operations(
          op,
          'Start operation for this vm is blocked, clone it if you want to use it.'
        )
      ),
      setVmOtherConfig(xapi, targetVmRef, {
        timestamp,
        jobId: job.id,
        scheduleId,
        srUuid,
        vmUuid: vm.uuid,
      }),
    ])

    if (!deleteFirst) {
      await deleteOldBackups()
    }
  }
}
