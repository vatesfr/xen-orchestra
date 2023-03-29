'use strict'

const { asyncMap, asyncMapSettled } = require('@xen-orchestra/async-map')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { formatDateTime } = require('@xen-orchestra/xapi')

const { formatFilenameDate } = require('../_filenameDate.js')
const { getOldEntries } = require('../_getOldEntries.js')
const { importDeltaVm, TAG_COPY_SRC } = require('../_deltaVm.js')
const { Task } = require('../Task.js')

const { AbstractDeltaWriter } = require('./_AbstractDeltaWriter.js')
const { MixinReplicationWriter } = require('./_MixinReplicationWriter.js')
const { listReplicatedVms } = require('./_listReplicatedVms.js')

exports.DeltaReplicationWriter = class DeltaReplicationWriter extends MixinReplicationWriter(AbstractDeltaWriter) {
  async checkBaseVdis(baseUuidToSrcVdi, baseVm) {
    const sr = this._sr
    const replicatedVm = listReplicatedVms(sr.$xapi, this._backup.job.id, sr.uuid, this._backup.vm.uuid).find(
      vm => vm.other_config[TAG_COPY_SRC] === baseVm.uuid
    )
    if (replicatedVm === undefined) {
      return baseUuidToSrcVdi.clear()
    }

    const xapi = replicatedVm.$xapi
    const replicatedVdis = new Set(
      await asyncMap(await replicatedVm.$getDisks(), async vdiRef => {
        const otherConfig = await xapi.getField('VDI', vdiRef, 'other_config')
        return otherConfig[TAG_COPY_SRC]
      })
    )

    for (const uuid of baseUuidToSrcVdi.keys()) {
      if (!replicatedVdis.has(uuid)) {
        baseUuidToSrcVdi.delete(uuid)
      }
    }
  }

  prepare({ isFull }) {
    // create the task related to this export and ensure all methods are called in this context
    const task = new Task({
      name: 'export',
      data: {
        id: this._sr.uuid,
        isFull,
        name_label: this._sr.name_label,
        type: 'SR',
      },
    })
    this.transfer = task.wrapFn(this.transfer)
    this.cleanup = task.wrapFn(this.cleanup, true)

    return task.run(() => this._prepare())
  }

  async _prepare() {
    const settings = this._settings
    const { uuid: srUuid, $xapi: xapi } = this._sr
    const { scheduleId, vm } = this._backup

    // delete previous interrupted copies
    ignoreErrors.call(asyncMapSettled(listReplicatedVms(xapi, scheduleId, undefined, vm.uuid), vm => vm.$destroy))

    this._oldEntries = getOldEntries(settings.copyRetention - 1, listReplicatedVms(xapi, scheduleId, srUuid, vm.uuid))

    if (settings.deleteFirst) {
      await this._deleteOldEntries()
    }
  }

  async cleanup() {
    if (!this._settings.deleteFirst) {
      await this._deleteOldEntries()
    }
  }

  async _deleteOldEntries() {
    return asyncMapSettled(this._oldEntries, vm => vm.$destroy())
  }

  async _transfer({ timestamp, deltaExport, sizeContainers }) {
    const { _warmMigration } = this._settings
    const sr = this._sr
    const { job, scheduleId, vm } = this._backup

    const { uuid: srUuid, $xapi: xapi } = sr

    let targetVmRef
    await Task.run({ name: 'transfer' }, async () => {
      targetVmRef = await importDeltaVm(
        {
          __proto__: deltaExport,
          vm: {
            ...deltaExport.vm,
            tags: _warmMigration ? deltaExport.vm.tags : [...deltaExport.vm.tags, 'Continuous Replication'],
          },
        },
        sr
      )
      return {
        size: Object.values(sizeContainers).reduce((sum, { size }) => sum + size, 0),
      }
    })
    this._targetVmRef = targetVmRef
    const targetVm = await xapi.getRecord('VM', targetVmRef)

    await Promise.all([
      // warm migration does not disable HA , since the goal is to start the new VM in production
      !_warmMigration &&
        targetVm.ha_restart_priority !== '' &&
        Promise.all([targetVm.set_ha_restart_priority(''), targetVm.add_tags('HA disabled')]),
      targetVm.set_name_label(`${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`),
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
  }
}
