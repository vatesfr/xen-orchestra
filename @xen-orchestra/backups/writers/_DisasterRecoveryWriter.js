const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { asyncMapSettled } = require('@xen-orchestra/async-map')
const { formatDateTime } = require('@xen-orchestra/xapi')

const { formatFilenameDate } = require('../_filenameDate')
const { getOldEntries } = require('../_getOldEntries')
const { Task } = require('../Task')

const { AbstractFullWriter } = require('./_AbstractFullWriter')
const { AbstractReplicationWriter } = require('./_AbstractReplicationWriter')
const { listReplicatedVms } = require('./_listReplicatedVms')

exports.DisasterRecoveryWriter = class DisasterRecoveryWriter extends AbstractReplicationWriter(AbstractFullWriter) {
  constructor(backup, sr, settings) {
    super({ backup, settings, sr })

    this._backup = backup
    this._settings = settings
    this._sr = sr

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: {
          id: sr.uuid,
          type: 'SR',

          // necessary?
          isFull: true,
        },
      },
      this.run
    )
  }

  async run({ timestamp, sizeContainer, stream }) {
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
    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }

    let targetVmRef
    await Task.run({ name: 'transfer' }, async () => {
      targetVmRef = await xapi.VM_import(stream, sr.$ref, vm =>
        Promise.all([
          vm.add_tags('Disaster Recovery'),
          vm.ha_restart_priority !== '' && Promise.all([vm.set_ha_restart_priority(''), vm.add_tags('HA disabled')]),
          vm.set_name_label(`${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`),
        ])
      )
      return { size: sizeContainer.size }
    })

    const targetVm = await xapi.getRecord('VM', targetVmRef)

    await Promise.all([
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
