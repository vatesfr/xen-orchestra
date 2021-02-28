const asyncMapSettled = require('@xen-orchestra/async-map')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const { formatDateTime } = require('@xen-orchestra/xapi')

const { asyncMap } = require('./asyncMap')
const { formatFilenameDate } = require('./_filenameDate')
const { getOldEntries } = require('./_getOldEntries')
const { importDeltaVm, TAG_COPY_SRC } = require('./_deltaVm')
const { listReplicatedVms } = require('./_listReplicatedVms')
const { Task } = require('./Task')

exports.ContinuousReplicationWriter = class ContinuousReplicationWriter {
  constructor(backup, sr, settings) {
    this._backup = backup
    this._settings = settings
    this._sr = sr

    this.run = Task.wrapFn(
      {
        name: 'export',
        data: ({ deltaExport }) => ({
          id: sr.uuid,
          isFull: Object.values(deltaExport.vdis).some(vdi => vdi.other_config['xo:base_delta'] === undefined),
          type: 'SR',
        }),
      },
      this.run
    )
  }

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

  async run({ timestamp, deltaExport, sizeContainers }) {
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
      targetVmRef = await importDeltaVm(
        {
          __proto__: deltaExport,
          vm: {
            ...deltaExport.vm,
            tags: [...deltaExport.vm.tags, 'Continuous Replication'],
          },
        },
        sr
      )
      return {
        size: Object.values(sizeContainers).reduce((sum, { size }) => sum + size, 0),
      }
    })

    const targetVm = await xapi.getRecord('VM', targetVmRef)

    await Promise.all([
      targetVm.ha_restart_priority !== '' &&
        Promise.all([targetVm.set_ha_restart_priority(''), targetVm.add_tags('HA disabled')]),
      targetVm.set_name_label(`${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`),
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
