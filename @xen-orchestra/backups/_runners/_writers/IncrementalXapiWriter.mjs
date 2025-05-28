import { asyncMap, asyncMapSettled } from '@xen-orchestra/async-map'
import ignoreErrors from 'promise-toolbox/ignoreErrors'

import { formatFilenameDate } from '../../_filenameDate.mjs'
import { getOldEntries } from '../../_getOldEntries.mjs'
import { importIncrementalVm } from '../../_incrementalVm.mjs'
import { Task } from '../../Task.mjs'

import { AbstractIncrementalWriter } from './_AbstractIncrementalWriter.mjs'
import { MixinXapiWriter } from './_MixinXapiWriter.mjs'
import { listReplicatedVms } from './_listReplicatedVms.mjs'
import { COPY_OF, setVmOtherConfig, BASE_DELTA_VDI } from '../../_otherConfig.mjs'

export class IncrementalXapiWriter extends MixinXapiWriter(AbstractIncrementalWriter) {
  async checkBaseVdis(baseUuidToSrcVdi) {
    const sr = this._sr
    if (baseUuidToSrcVdi.size === 0) {
      // searching for the vdis is expensive
      // don't do it if there is nothing to find
      return
    }

    // @todo use an index if possible
    // @todo : this seems similar to decorateVmMetadata
    const replicatedVdis = sr.$VDIs
      .filter(vdi => {
        // REPLICATED_TO_SR_UUID is not used here since we are already filtering from sr.$VDIs
        return baseUuidToSrcVdi.has(vdi?.other_config[COPY_OF])
      })
      .map(({ other_config }) => other_config?.[COPY_OF])
      .filter(_ => !!_)

    for (const uuid of baseUuidToSrcVdi.keys()) {
      if (!replicatedVdis.includes(uuid)) {
        baseUuidToSrcVdi.delete(uuid)
      }
    }
  }
  updateUuidAndChain() {
    // nothing to do, the chaining is not modified in this case
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
    const hasHealthCheckSr = this._healthCheckSr !== undefined
    this.transfer = task.wrapFn(this.transfer)
    this.cleanup = task.wrapFn(this.cleanup, !hasHealthCheckSr)
    this.healthCheck = task.wrapFn(this.healthCheck, hasHealthCheckSr)

    return task.run(() => this._prepare(isFull))
  }

  async _prepare(isFull) {
    const settings = this._settings
    const { uuid: srUuid, $xapi: xapi } = this._sr
    const vmUuid = this._vmUuid
    const scheduleId = this._scheduleId

    // delete previous interrupted copies
    ignoreErrors.call(asyncMapSettled(listReplicatedVms(xapi, scheduleId, undefined, vmUuid), vm => vm.$destroy))

    this._oldEntries = getOldEntries(settings.copyRetention - 1, listReplicatedVms(xapi, scheduleId, srUuid, vmUuid))

    if (settings.deleteFirst) {
      // we want to keep the baseVM when copying a delta
      // even if we want to keep only one after
      let mostRecentEntry
      if (this._oldEntries.length > 1 && settings.copyRetention === 1 && !isFull) {
        mostRecentEntry = this._oldEntries.pop()
      }
      await this._deleteOldEntries()
      this._oldEntries = mostRecentEntry !== undefined ? [mostRecentEntry] : []
    }
  }

  async cleanup() {
    await this._deleteOldEntries()
  }

  async _deleteOldEntries() {
    return asyncMapSettled(this._oldEntries, vm => vm.$destroy())
  }

  #decorateVmMetadata(backup) {
    const { _warmMigration } = this._settings
    const sr = this._sr
    const vm = backup.vm

    vm.other_config[COPY_OF] = vm.uuid
    if (!_warmMigration) {
      vm.tags.push('Continuous Replication')
    }
    // extracting the uuid of each delta vdi on the source
    // get all in one pass, since there is a lot of objects
    const sourceVdiUuids = Object.values(backup.vdis)
      .map(({ other_config }) => other_config[BASE_DELTA_VDI])
      // full vdi don't have a base
      .filter(_ => !!_)
    // @todo use index ?

    const replicatedVdis = sr.$VDIs.filter(vdi => {
      // REPLICATED_TO_SR_UUID is not used here since we are already filtering from sr.$VDIs
      return sourceVdiUuids.includes(vdi?.other_config[COPY_OF])
    })

    Object.values(backup.vdis).forEach(vdi => {
      vdi.other_config[COPY_OF] = vdi.uuid
      if (sourceVdiUuids.length > 0) {
        const baseReplicatedTo = replicatedVdis.find(
          replicatedVdi => replicatedVdi.other_config[COPY_OF] === vdi.other_config[BASE_DELTA_VDI]
        )
        // baseReplicatedTo can be undefined if a new disk is added and other are already replicated
        vdi.baseVdi = baseReplicatedTo
      } else {
        // first replication of this disk
        vdi.baseVdi = undefined
      }
      // ensure the VDI are created on the target SR
      vdi.SR = sr.$ref
    })

    return backup
  }

  async _transfer({ timestamp, deltaExport, vm }) {
    const { _warmMigration } = this._settings
    const sr = this._sr
    const job = this._job
    const scheduleId = this._scheduleId

    const { uuid: srUuid, $xapi: xapi } = sr

    let targetVmRef
    await Task.run({ name: 'transfer' }, async () => {
      targetVmRef = await importIncrementalVm(this.#decorateVmMetadata(deltaExport), sr)
      // size is mandatory to ensure the task have the right data
      return {
        size: Object.values(deltaExport.disks).reduce(
          (sum, disk) => sum + disk.getNbGeneratedBlock() * disk.getBlockSize(),
          0
        ),
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
      setVmOtherConfig(xapi, targetVmRef, {
        timestamp,
        jobId: job.id,
        scheduleId,
        vmUuid: vm.uuid,
        srUuid,
      }),
    ])
  }
}
