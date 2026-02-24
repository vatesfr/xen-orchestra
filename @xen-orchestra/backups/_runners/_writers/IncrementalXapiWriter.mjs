import { asyncMapSettled } from '@xen-orchestra/async-map'
import ignoreErrors from 'promise-toolbox/ignoreErrors'

import { getOldEntries } from '../../_getOldEntries.mjs'
import { importIncrementalVm } from '../../_incrementalVm.mjs'
import { Task } from '../../Task.mjs'

import { AbstractIncrementalWriter } from './_AbstractIncrementalWriter.mjs'
import { MixinXapiWriter } from './_MixinXapiWriter.mjs'
import { compareReplicatedVmDatetime, listReplicatedVms } from './_listReplicatedVms.mjs'
import {
  COPY_OF,
  setVmOtherConfig,
  BASE_DELTA_VDI,
  JOB_ID,
  SCHEDULE_ID,
  REPLICATED_TO_SR_UUID,
  DATETIME,
  VM_UUID,
} from '../../_otherConfig.mjs'
import assert from 'node:assert'
import { formatFilenameDate } from '../../_filenameDate.mjs'

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
    const replicatedVdis = sr.$VDIs.filter(vdi => {
      // REPLICATED_TO_SR_UUID is not used here since we are already filtering from sr.$VDIs
      // Also search snapshot VDIs to support the single-VM replication flow where
      // base VDIs live on snapshots of the replicated VM.
      return vdi?.managed && baseUuidToSrcVdi.has(vdi?.other_config[COPY_OF])
    })

    const replicatedCopyOfUuids = replicatedVdis.map(({ other_config }) => other_config?.[COPY_OF]).filter(_ => !!_)

    for (const uuid of baseUuidToSrcVdi.keys()) {
      if (!replicatedCopyOfUuids.includes(uuid)) {
        baseUuidToSrcVdi.delete(uuid)
      }
    }

    // Track the target VM (the replicated VM to update on the next transfer).
    // For snapshot VDIs, traverse snapshot VM → snapshot_of to reach the replicated VM.
    if (replicatedVdis.length > 0) {
      for (const vdi of replicatedVdis) {
        const vbd = vdi.$VBDs?.find(vbd => !vbd.$VM.is_control_domain)
        if (!vbd || !vbd.$VM) {
          continue
        }
        let vm = vbd.$VM
        if (vm.is_a_snapshot) {
          vm = vm.$snapshot_of
        }

        if (vm.blocked_operations.start !== undefined) {
          this._targetVmRef = vm.$ref
          break
        }
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

    const allEntries = listReplicatedVms(xapi, scheduleId, srUuid, vmUuid)

    // In the snapshot-based flow a non-snapshot VM (the live target) coexists with its
    // snapshots (one per transfer). That VM must not be subject to retention — only its
    // snapshots are. Build the set of VM refs that already have snapshots in the list so
    // we can exclude them, while keeping old-style non-snapshot VMs (no snapshots).
    const vmRefsWithSnapshots = new Set(allEntries.filter(e => e.is_a_snapshot).map(e => e.snapshot_of))
    const retentionEntries = allEntries.filter(e => e.is_a_snapshot || !vmRefsWithSnapshots.has(e.$ref))
    retentionEntries.sort(compareReplicatedVmDatetime)
    this._oldEntries = getOldEntries(settings.copyRetention - 1, retentionEntries)

    if (settings.deleteFirst && settings.skipDeleteOldEntries) {
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
    if (!this._settings.skipDeleteOldEntries) {
      await this._deleteOldEntries()
    }
  }

  async _deleteOldEntries() {
    return asyncMapSettled(this._oldEntries, vm => vm.$destroy({ bypassBlockedOperation: true }))
  }

  #decorateVmMetadata(backup, timestamp) {
    const { _warmMigration } = this._settings
    const sr = this._sr
    const vm = backup.vm
    const job = this._job
    const scheduleId = this._scheduleId

    vm.name_label = `${vm.name_label} - ${job.name}`
    // update other_config data as soon as possible to ensure the next job
    // will be able to detect any partial transfer and lean them
    vm.other_config[COPY_OF] = vm.uuid
    vm.other_config[JOB_ID] = job.id
    vm.other_config[SCHEDULE_ID] = scheduleId
    vm.other_config[REPLICATED_TO_SR_UUID] = sr.uuid
    // set the timestamp in the past to ensure any incomplete VM will be deleted on next run
    vm.other_config[DATETIME] = formatFilenameDate(0)

    vm.blocked_operations = {
      start: 'Start operation for this vm is blocked, clone it if you want to use it.',
      start_on: 'Start operation for this vm is blocked, clone it if you want to use it.',
    }

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
      return vdi?.managed && !vdi?.is_a_snapshot && sourceVdiUuids.includes(vdi?.other_config[COPY_OF])
    })

    Object.values(backup.vdis).forEach(vdi => {
      vdi.other_config[COPY_OF] = vdi.uuid
      vdi.other_config[JOB_ID] = job.id
      vdi.other_config[SCHEDULE_ID] = scheduleId
      vdi.other_config[REPLICATED_TO_SR_UUID] = sr.uuid
      vdi.other_config[VM_UUID] = vm.uuid

      if (sourceVdiUuids.length > 0) {
        const baseReplicatedTo = replicatedVdis.filter(
          replicatedVdi => replicatedVdi.other_config[COPY_OF] === vdi.other_config[BASE_DELTA_VDI]
        )
        assert.ok(
          baseReplicatedTo.length <= 1,
          `Target of a replication must be unique, got ${baseReplicatedTo.length} candidates`
        )
        // baseReplicatedTo can be undefined if a new disk is added and other are already replicated
        vdi.baseVdi = baseReplicatedTo[0]
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
      targetVmRef = await importIncrementalVm(this.#decorateVmMetadata(deltaExport, timestamp), sr, {
        targetRef: this._targetVmRef,
      })
      // this also ensure the data are up to date on the snapshot
      await setVmOtherConfig(xapi, targetVmRef, {
        timestamp, // updated at the end to mark the transfer as complete
        jobId: job.id,
        scheduleId,
        vmUuid: vm.uuid,
        srUuid,
      })

      // take a snapshot to ensure these data are not modified until next snapshot
      await Task.run({ name: 'target snapshot' }, () =>
        xapi.VM_snapshot(targetVmRef, {
          name_label: `${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`,
        })
      )
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
    ])
  }
}
