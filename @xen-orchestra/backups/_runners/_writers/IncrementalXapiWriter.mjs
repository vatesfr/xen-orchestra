import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { formatDateTime } from '@xen-orchestra/xapi'
import { Task } from '@vates/task'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'
import { importIncrementalVm, TAG_BACKUP_SR, TAG_BASE_DELTA, TAG_COPY_SRC } from '../../_incrementalVm.mjs'

import { AbstractIncrementalWriter } from './_AbstractIncrementalWriter.mjs'
import { MixinXapiWriter } from './_MixinXapiWriter.mjs'
import { listReplicatedVms } from './_listReplicatedVms.mjs'
import find from 'lodash/find.js'

export class IncrementalXapiWriter extends MixinXapiWriter(AbstractIncrementalWriter) {
  async checkBaseVdis(baseUuidToSrcVdi, baseVm) {
    const sr = this._sr
    const replicatedVm = listReplicatedVms(sr.$xapi, this._job.id, sr.uuid, this._vmUuid).find(
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
      properties: {
        name: 'export',
        id: this._sr.uuid,
        isFull,
        name_label: this._sr.name_label,
        type: 'SR',
      },
    })
    this.transfer = task.wrapInside(this.transfer)
    if (this._healthCheckSr !== undefined) {
      this.cleanup = task.wrapInside(this.cleanup)
      this.healthCheck = task.wrap(this.healthCheck)
    } else {
      this.cleanup = task.wrap(this.cleanup)
    }

    return task.run(() => this._prepare())
  }

  async _prepare() {
    const settings = this._settings
    const { uuid: srUuid, $xapi: xapi } = this._sr
    const vmUuid = this._vmUuid
    const scheduleId = this._scheduleId

    // delete previous interrupted copies
    ignoreErrors.call(asyncMapSettled(listReplicatedVms(xapi, scheduleId, undefined, vmUuid), vm => vm.$destroy))

    this._oldEntries = getOldEntries(settings.copyRetention - 1, listReplicatedVms(xapi, scheduleId, srUuid, vmUuid))

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

  #decorateVmMetadata(backup) {
    const { _warmMigration } = this._settings
    const sr = this._sr
    const xapi = sr.$xapi
    const vm = backup.vm
    vm.other_config[TAG_COPY_SRC] = vm.uuid
    const remoteBaseVmUuid = vm.other_config[TAG_BASE_DELTA]
    let baseVm
    if (remoteBaseVmUuid) {
      baseVm = find(
        xapi.objects.all,
        obj => (obj = obj.other_config) && obj[TAG_COPY_SRC] === remoteBaseVmUuid && obj[TAG_BACKUP_SR] === sr.$id
      )

      if (!baseVm) {
        throw new Error(`could not find the base VM (copy of ${remoteBaseVmUuid})`)
      }
    }
    const baseVdis = {}
    baseVm?.$VBDs.forEach(vbd => {
      const vdi = vbd.$VDI
      if (vdi !== undefined) {
        baseVdis[vbd.VDI] = vbd.$VDI
      }
    })

    vm.other_config[TAG_COPY_SRC] = vm.uuid
    if (!_warmMigration) {
      vm.tags.push('Continuous Replication')
    }

    Object.values(backup.vdis).forEach(vdi => {
      vdi.other_config[TAG_COPY_SRC] = vdi.uuid
      vdi.SR = sr.$ref
      // vdi.other_config[TAG_BASE_DELTA] is never defined on a suspend vdi
      if (vdi.other_config[TAG_BASE_DELTA]) {
        const remoteBaseVdiUuid = vdi.other_config[TAG_BASE_DELTA]
        const baseVdi = find(baseVdis, vdi => vdi.other_config[TAG_COPY_SRC] === remoteBaseVdiUuid)
        if (!baseVdi) {
          throw new Error(`missing base VDI (copy of ${remoteBaseVdiUuid})`)
        }
        vdi.baseVdi = baseVdi
      }
    })

    return backup
  }

  async _transfer({ timestamp, deltaExport, sizeContainers, vm }) {
    const { _warmMigration } = this._settings
    const sr = this._sr
    const job = this._job
    const scheduleId = this._scheduleId

    const { uuid: srUuid, $xapi: xapi } = sr

    let targetVmRef
    await Task.run({ properties: { name: 'transfer' } }, async () => {
      targetVmRef = await importIncrementalVm(this.#decorateVmMetadata(deltaExport), sr)
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
        [TAG_BACKUP_SR]: srUuid,

        // these entries need to be added in case of offline backup
        'xo:backup:datetime': formatDateTime(timestamp),
        'xo:backup:job': job.id,
        'xo:backup:schedule': scheduleId,
        [TAG_BASE_DELTA]: vm.uuid,
      }),
    ])
  }
}
