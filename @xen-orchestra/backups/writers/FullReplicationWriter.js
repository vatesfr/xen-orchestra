'use strict'

const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { asyncMap, asyncMapSettled } = require('@xen-orchestra/async-map')
const { formatDateTime } = require('@xen-orchestra/xapi')

const { formatFilenameDate } = require('../_filenameDate.js')
const { getOldEntries } = require('../_getOldEntries.js')
const { Task } = require('../Task.js')

const { AbstractFullWriter } = require('./_AbstractFullWriter.js')
const { MixinReplicationWriter } = require('./_MixinReplicationWriter.js')
const { listReplicatedVms } = require('./_listReplicatedVms.js')

exports.FullReplicationWriter = class FullReplicationWriter extends MixinReplicationWriter(AbstractFullWriter) {
  constructor(props) {
    super(props)

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: {
          id: props.sr.uuid,
          name_label: this._sr.name_label,
          type: 'SR',

          // necessary?
          isFull: true,
        },
      },
      this.run
    )
  }

  async _run({ timestamp, sizeContainer, stream }) {
    const sr = this._sr
    const settings = this._settings
    const { job, scheduleId, vm } = this._backup

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
    await Task.run({ name: 'transfer' }, async () => {
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
