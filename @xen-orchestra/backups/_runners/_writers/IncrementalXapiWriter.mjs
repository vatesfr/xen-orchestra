import humanFormat from 'human-format'

import { asyncMapSettled } from '@xen-orchestra/async-map'
import { Task } from '@vates/task'
import ignoreErrors from 'promise-toolbox/ignoreErrors'

import { getOldEntries } from '../../_getOldEntries.mjs'
import { importIncrementalVm } from '../../_incrementalVm.mjs'

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
import { formatFilenameDate } from '../../_filenameDate.mjs'
import { XapiDiskSource } from '@xen-orchestra/xapi'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('xo:backups:IncrementalXapiWriter')

export class IncrementalXapiWriter extends MixinXapiWriter(AbstractIncrementalWriter) {
  // Map of source VDI UUID (COPY_OF) → validated active VDI on the target SR.
  // Built by checkBaseVdis, consumed by #decorateVmMetadata to set baseVdi.
  #baseVdisBySourceUuid = new Map()

  async checkBaseVdis(baseUuidToSrcVdi) {
    const sr = this._sr
    this.#baseVdisBySourceUuid = new Map()

    if (baseUuidToSrcVdi.size === 0) {
      // searching for the vdis is expensive
      // don't do it if there is nothing to find
      return
    }

    // look for the same snapshot
    // ensure there are no data between the snapshot and the active disk

    const snapshotCandidates = sr.$VDIs.filter(vdi => {
      return (
        vdi?.managed &&
        vdi?.is_a_snapshot &&
        vdi.other_config[JOB_ID] === this._job.id &&
        vdi.other_config[VM_UUID] === this._vmUuid &&
        baseUuidToSrcVdi.has(vdi?.other_config[COPY_OF])
      )
    })
    debug('checkBaseVdis, got snapshot candidates,', snapshotCandidates.length)

    if (snapshotCandidates.length > 0) {
      // reset before searching for candidates
      this.#baseVdisBySourceUuid = new Map()
      this._targetVmRef = undefined
      const { baseVdisBySourceUuid, targetVmRef } = await this.#validateSnapshotCandidates(snapshotCandidates)
      for (const [sourceUuid, vdi] of baseVdisBySourceUuid) {
        this.#baseVdisBySourceUuid.set(sourceUuid, vdi)
      }
      if (targetVmRef !== undefined) {
        this._targetVmRef = targetVmRef
      }
    } else {
      // Legacy fallback (upgrade from pre-6.3): no target snapshots exist yet,
      // look for active (non-snapshot) VDIs with matching COPY_OF, like the old code did.
      debug('checkBaseVdis, no snapshot candidates, falling back to legacy active VDI lookup')
      const legacyVdis = sr.$VDIs.filter(vdi => {
        return vdi?.managed && !vdi?.is_a_snapshot && baseUuidToSrcVdi.has(vdi?.other_config[COPY_OF])
      })
      for (const vdi of legacyVdis) {
        const sourceUuid = vdi.other_config[COPY_OF]
        if (sourceUuid) {
          this.#baseVdisBySourceUuid.set(sourceUuid, vdi)
        }
      }
    }

    for (const uuid of baseUuidToSrcVdi.keys()) {
      if (!this.#baseVdisBySourceUuid.has(uuid)) {
        baseUuidToSrcVdi.delete(uuid)
      }
    }
  }
  /**
   * 6.3+ snapshot-based validation: for each snapshot candidate, check whether
   * the active VDI has diverged from the snapshot. Returns a baseVdisBySourceUuid
   * map and, when all disks are clean, the targetVmRef to reuse.
   */
  async #validateSnapshotCandidates(snapshotCandidates) {
    const sr = this._sr
    const baseVdisBySourceUuid = new Map()
    let targetVmRef
    let canChainToTargetVm = true

    await asyncEach(
      snapshotCandidates,
      async snapshot => {
        let diffDisk
        let activeVdi
        try {
          activeVdi = sr.$xapi.getObject(snapshot.$snapshot_of)
          const userVbds = activeVdi.$VBDs?.filter(vbd => vbd.$VM && !vbd.$VM.is_control_domain) ?? []
          if (userVbds.length !== 1) {
            debug('checkBaseVdis, share vbd ', { ref: snapshot.$ref, userVbds })
            // shared vdi ignore
            return
          }
          const vm = userVbds[0].$VM
          if (!('start' in vm.blocked_operations)) {
            debug('checkBaseVdis, vm not blocked', { vmRef: vm.$ref })
            // vm start unlocked
            // not really an issue since we have check the delta
            // but it indicates the users played with the blocked operations
            return
          }
          diffDisk = new XapiDiskSource({
            xapi: sr.$xapi,
            vdiRef: activeVdi.$ref,
            baseRef: snapshot.$ref,
            onlyListChangedBlocks: true,
          })
          await diffDisk.init()
          const sourceUuid = snapshot.other_config?.[COPY_OF]
          if (diffDisk.getBlockIndexes().length === 0) {
            if (sourceUuid) {
              baseVdisBySourceUuid.set(sourceUuid, activeVdi)
            }
            // Track the target VM (the replicated VM to update on the next transfer).
            targetVmRef = vm.$ref
          } else {
            // if not chain to the snapshot, but create a new VM
            if (sourceUuid) {
              baseVdisBySourceUuid.set(sourceUuid, snapshot)
            }
            // not empty, we will create a new VM
            canChainToTargetVm = false
            debug('checkBaseVdis, data between snapshot and active disk', {
              vdiRef: snapshot.$ref,
              nbBlocks: diffDisk.getBlockIndexes().length,
            })
          }
        } catch (error) {
          debug('checkBaseVdis, skipping snapshot', { ref: snapshot.$ref, error })
          return
        } finally {
          await diffDisk?.close().catch(error => debug('checkBaseVdis, error closing', error))
          await sr.$xapi.VDI_disconnectFromControlDomain(snapshot.$ref)
          if (activeVdi !== undefined) {
            await sr.$xapi.VDI_disconnectFromControlDomain(activeVdi.$ref)
          }
        }
      },
      {
        concurrency: 4,
      }
    )

    if (!canChainToTargetVm) {
      targetVmRef = undefined
    } else if (targetVmRef !== undefined) {
      debug('checkBaseVdis,got a valid vm target', targetVmRef)
    }

    return { baseVdisBySourceUuid, targetVmRef }
  }

  updateUuidAndChain() {
    // nothing to do, the chaining is not modified in this case
  }
  prepare({ isFull }) {
    // create the task related to this export and ensure all methods are called in this context
    const task = new Task({
      properties: {
        id: this._sr.uuid,
        isFull,
        name: 'export',
        name_label: this._sr.name_label,
        type: 'SR',
      },
    })
    this._prepare = task.wrapInside(this._prepare)
    this.transfer = task.wrapInside(this.transfer)
    if (this._healthCheckSr !== undefined) {
      this.cleanup = task.wrapInside(this.cleanup)
      this.healthCheck = task.wrap(this.healthCheck)
    } else {
      this.cleanup = task.wrap(this.cleanup)
    }

    return this._prepare(isFull)
  }

  async _prepare(isFull) {
    const settings = this._settings
    const { uuid: srUuid, $xapi: xapi } = this._sr
    const vmUuid = this._vmUuid
    const scheduleId = this._schedule.id

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
    const scheduleId = this._schedule.id

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

    Object.values(backup.vdis).forEach(vdi => {
      vdi.other_config[COPY_OF] = vdi.uuid
      vdi.other_config[JOB_ID] = job.id
      vdi.other_config[SCHEDULE_ID] = scheduleId
      vdi.other_config[REPLICATED_TO_SR_UUID] = sr.uuid
      vdi.other_config[VM_UUID] = vm.uuid

      const baseDeltaVdiUuid = vdi.other_config[BASE_DELTA_VDI]
      if (baseDeltaVdiUuid !== undefined) {
        // reuse the validated mapping built by checkBaseVdis
        vdi.baseVdi = this.#baseVdisBySourceUuid.get(baseDeltaVdiUuid)
      } else {
        // first replication of this disk (full, no base)
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
    const schedule = this._schedule
    const scheduleId = schedule.id
    const { uuid: srUuid, $xapi: xapi } = sr

    let targetVmRef
    await Task.run({ properties: { name: 'transfer' } }, async () => {
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
      const size = Object.values(deltaExport.disks).reduce(
        (sum, disk) => sum + disk.getNbGeneratedBlock() * disk.getBlockSize(),
        0
      )
      await xapi.setField(
        'VM',
        targetVmRef,
        'name_description',
        deltaExport.vm.name_description +
          ` -- last replication: ${formatFilenameDate(timestamp)} ${humanFormat.bytes(size)} read`
      )
      // take a snapshot to ensure these data are not modified until next snapshot
      await Task.run({ properties: { name: 'target snapshot' } }, async () => {
        await xapi.VM_snapshot(targetVmRef, {
          name_label: `${vm.name_label} - ${job.name} / ${schedule.name} ${formatFilenameDate(timestamp)}`,
        })
      })

      return {
        size,
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
