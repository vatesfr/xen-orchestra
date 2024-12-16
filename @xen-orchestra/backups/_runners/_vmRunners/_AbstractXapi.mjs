import assert from 'node:assert'
import groupBy from 'lodash/groupBy.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncMap } from '@xen-orchestra/async-map'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { Task } from '@vates/task'

import { getOldEntries } from '../../_getOldEntries.mjs'
import { Abstract } from './_Abstract.mjs'
import {
  DATETIME,
  JOB_ID,
  SCHEDULE_ID,
  populateVdisOtherConfig,
  resetVmOtherConfig,
  setVmOtherConfig,
} from '../../_otherConfig.mjs'

export const AbstractXapi = class AbstractXapiVmBackupRunner extends Abstract {
  constructor({
    config,
    getSnapshotNameLabel,
    healthCheckSr,
    job,
    remoteAdapters,
    remotes,
    schedule,
    settings,
    srs,
    throttleStream,
    vm,
  }) {
    super()
    if (vm.other_config[JOB_ID] === job.id && 'start' in vm.blocked_operations) {
      // don't match replicated VMs created by this very job otherwise they
      // will be replicated again and again
      throw new Error('cannot backup a VM created by this very job')
    }

    const currentOperations = Object.values(vm.current_operations)
    if (currentOperations.some(_ => _ === 'migrate_send' || _ === 'pool_migrate')) {
      throw new Error('cannot backup a VM currently being migrated')
    }

    this.config = config
    this.job = job
    this.remoteAdapters = remoteAdapters
    this.scheduleId = schedule.id
    this.timestamp = undefined

    // VM currently backed up
    const tags = (this._tags = vm.tags)

    // VM (snapshot) that is really exported
    this._exportedVm = undefined
    this._vm = vm

    this._baseVdis = undefined
    this._getSnapshotNameLabel = getSnapshotNameLabel
    this._isIncremental = job.mode === 'delta'
    this._healthCheckSr = healthCheckSr
    this._jobId = job.id
    this._jobSnapshotVdis = undefined
    this._throttleStream = throttleStream
    this._xapi = vm.$xapi

    // Base VM for the export
    this._baseVdis = undefined

    // Settings for this specific run (job, schedule, VM)
    if (tags.includes('xo-memory-backup')) {
      settings.checkpointSnapshot = true
    }
    if (tags.includes('xo-offline-backup')) {
      settings.offlineSnapshot = true
    }
    this._settings = settings
    // Create writers
    {
      const writers = new Set()
      this._writers = writers

      const [BackupWriter, ReplicationWriter] = this._getWriters()

      const allSettings = job.settings
      Object.entries(remoteAdapters).forEach(([remoteId, adapter]) => {
        const targetSettings = {
          ...settings,
          ...allSettings[remoteId],
        }
        if (targetSettings.exportRetention !== 0) {
          writers.add(
            new BackupWriter({
              adapter,
              config,
              healthCheckSr,
              job,
              scheduleId: schedule.id,
              vmUuid: vm.uuid,
              remoteId,
              settings: targetSettings,
            })
          )
        }
      })
      srs.forEach(sr => {
        const targetSettings = {
          ...settings,
          ...allSettings[sr.uuid],
        }
        if (targetSettings.copyRetention !== 0) {
          writers.add(
            new ReplicationWriter({
              config,
              healthCheckSr,
              job,
              scheduleId: schedule.id,
              vmUuid: vm.uuid,
              sr,
              settings: targetSettings,
            })
          )
        }
      })
    }
  }

  // ensure the VM itself does not have any backup metadata which would be
  // copied on manual snapshots and interfere with the backup jobs
  async _cleanMetadata() {
    const vm = this._vm
    if (JOB_ID in vm.other_config) {
      await resetVmOtherConfig(this._xapi, vm.$ref)
    }
  }

  async _snapshot() {
    const vm = this._vm
    const xapi = this._xapi

    const settings = this._settings

    if (this._mustDoSnapshot()) {
      await Task.run({ properties: { name: 'snapshot' } }, async () => {
        if (!settings.bypassVdiChainsCheck) {
          await vm.$assertHealthyVdiChains()
        }
        if (settings.preferNbd) {
          try {
            // enable CBT on all disks if possible
            const diskRefs = await xapi.VM_getDisks(vm.$ref)
            await Promise.all(diskRefs.map(diskRef => xapi.callAsync('VDI.enable_cbt', diskRef)))
          } catch (error) {
            Task.info(`couldn't enable CBT`, error)
          }
        }

        const snapshotRef = await vm[settings.checkpointSnapshot ? '$checkpoint' : '$snapshot']({
          ignoredVdisTag: '[NOBAK]',
          name_label: this._getSnapshotNameLabel(vm),
          unplugVusbs: true,
        })
        this.timestamp = Date.now()
        await setVmOtherConfig(xapi, snapshotRef, {
          timestamp: this.timestamp,
          jobId: this._jobId,
          scheduleId: this.scheduleId,
          vmUuid: vm.uuid,
        })
        this._exportedVm = await xapi.getRecord('VM', snapshotRef)
        return this._exportedVm.uuid
      })
    } else {
      this._exportedVm = vm
      this.timestamp = Date.now()
    }
  }

  async _fetchJobSnapshots() {
    const jobId = this._jobId
    const vmRef = this._vm.$ref
    const xapi = this._xapi

    // to ensure compatibility with snapshots older than CBT implementation
    // update vdi data to ensure the vdi are correctly fetched in _jobSnapshotVdis
    // remove by then end of 2024
    const vmSnapshotsRef = await xapi.getField('VM', vmRef, 'snapshots')
    const vmSnapshotsOtherConfig = await asyncMap(vmSnapshotsRef, ref => xapi.getField('VM', ref, 'other_config'))

    const vmSnapshots = []
    vmSnapshotsOtherConfig.forEach((other_config, i) => {
      if (other_config[JOB_ID] === jobId) {
        vmSnapshots.push({ other_config, $ref: vmSnapshotsRef[i] })
      }
    })
    await Promise.all(vmSnapshots.map(snapshot => populateVdisOtherConfig(xapi, snapshot.$ref)))
    // end of compatibiliy handling

    // handle snapshot by VDI
    this._jobSnapshotVdis = []
    const srcVdis = await xapi.getRecords('VDI', await this._vm.$getDisks())
    for (const srcVdi of srcVdis) {
      const snapshots = await xapi.getRecords('VDI', srcVdi.snapshots)
      for (const snapshot of snapshots) {
        // only keep the snapshot related to this backup job
        // and only if the job is still using  purge snapshot data or if the disk
        // is not a cbt metadata disk ( expect a type: user for normal disks)
        if (
          snapshot.other_config[JOB_ID] === jobId &&
          (this._settings.cbtDestroySnapshotData || snapshot.type !== 'cbt_metadata')
        ) {
          this._jobSnapshotVdis.push(snapshot)
        }
      }
    }
  }

  async _removeUnusedSnapshots() {
    const allSettings = this.job.settings
    const baseSettings = this._baseSettings

    const xapi = this._xapi
    // ensure all the event has been processed by the xapi
    await xapi.barrier()
    // ensure cached object are up to date
    this._jobSnapshotVdis = this._jobSnapshotVdis.map(vdi => xapi.getObject(vdi.$ref))

    // get the datetime of the most recent snapshot
    const lastSnapshotDateTime = this._jobSnapshotVdis
      .map(({ other_config }) => other_config[DATETIME])
      .sort()
      .pop()

    // remove older snapshot schedule per schedule
    const snapshotsPerSchedule = groupBy(this._jobSnapshotVdis, _ => _.other_config[SCHEDULE_ID])
    await asyncMap(Object.entries(snapshotsPerSchedule), async ([scheduleId, snapshots]) => {
      const snapshotPerDatetime = groupBy(snapshots, _ => _.other_config[DATETIME])

      const datetimes = Object.keys(snapshotPerDatetime)
      datetimes.sort()

      const settings = {
        ...baseSettings,
        ...allSettings[scheduleId],
        ...allSettings[this._vm.uuid],
      }
      const retention = settings.snapshotRetention ?? 0
      await asyncMap(getOldEntries(retention, datetimes), async datetime => {
        // keep the last snapshot across all schedules for delta
        // since we'll need it to compute delta for next backup
        if (this.job.mode === 'delta' && datetime === lastSnapshotDateTime) {
          return
        }
        const vdis = snapshotPerDatetime[datetime]
        let vmRef
        // if there is an attached VM => destroy the VM (Non CBT backups)
        for (const vdi of vdis) {
          const vbds = vdi.$VBDs.filter(({ $VM }) => $VM.is_control_domain === false)
          if (vbds.length > 0) {
            // only one VM linked to this vdi
            // this will throw error for VDI still attached to control domain
            assert.strictEqual(vbds.length, 1, 'VDI must be free or attached to exactly one VM')
            const vm = vbds[0].$VM
            assert.strictEqual(vm.is_a_snapshot, true, `VM must be a snapshot`) // don't delete a VM (especially a control domain)

            const vmRefVdi = vm.$ref
            // same vm than other vdi of the same batch
            assert.ok(
              vmRef === undefined || vmRef === vmRefVdi,
              '_removeUnusedSnapshots don t handle vdi related to multiple VMs '
            )
            vmRef = vmRefVdi
          }
        }
        if (vmRef !== undefined) {
          return xapi.VM_destroy(vmRef)
        } else {
          return asyncMap(
            vdis.map(async ({ $ref }) => {
              await xapi.VDI_destroy($ref)
            })
          )
        }
      })
    })
  }

  async _removeSnapshotData() {
    // now that we use CBT, we can destroy the data of the snapshot used for this backup
    // going back to a previous version of XO not supporting CBT will create a full backup
    // this will only do something after snapshot and transfer
    if (
      // don't modify the VM
      this._exportedVm?.is_a_snapshot &&
      // user don't want to keep the snapshot data
      this._settings.snapshotRetention === 0 &&
      // preferNbd is not a guarantee that the backup used NBD, depending on the network configuration,
      // in that case next runs will be full, but there is not an easy way to prevent that
      this._settings.preferNbd &&
      // only delete snapshost data if the config allows it
      this._settings.cbtDestroySnapshotData
    ) {
      Task.info('will delete snapshot data')
      const vdiRefs = await this._xapi.VM_getDisks(this._exportedVm.$ref)
      await this._xapi.call('VM.destroy', this._exportedVm.$ref)
      for (const vdiRef of vdiRefs) {
        try {
          // data_destroy will fail with a VDI_NO_CBT_METADATA error if CBT is not enabled on this VDI
          await this._xapi.VDI_dataDestroy(vdiRef)
          Task.info(`Snapshot data has been deleted`, { vdiRef })
        } catch (error) {
          Task.warning(`Couldn't delete snapshot data`, { error, vdiRef })
        }
      }
    }
  }

  async copy() {
    throw new Error('Not implemented')
  }

  _getWriters() {
    throw new Error('Not implemented')
  }

  _mustDoSnapshot() {
    throw new Error('Not implemented')
  }

  async _selectBaseVm() {
    throw new Error('Not implemented')
  }

  async run($defer) {
    const settings = this._settings
    assert(
      !settings.offlineBackup || settings.snapshotRetention === 0,
      'offlineBackup is not compatible with snapshotRetention'
    )

    await this._callWriters(async writer => {
      await writer.beforeBackup()
      $defer(async () => {
        await writer.afterBackup()
      })
    }, 'writer.beforeBackup()')

    const vm = this._vm

    // block migration during the backup on the VM itself, not the latest snapshot
    {
      const { pool_migrate, migrate_send } = vm.blocked_operations

      const reason = 'VM migration is blocked during backup'
      await vm.update_blocked_operations({ pool_migrate: reason, migrate_send: reason })

      $defer(async () => {
        // delete the entries if they did not exist previously or if they were
        // equal to reason (which happen if a previous backup was interrupted
        // before resetting them)
        await vm.update_blocked_operations({
          migrate_send: migrate_send === undefined || migrate_send === reason ? null : migrate_send,
          pool_migrate: pool_migrate === undefined || pool_migrate === reason ? null : pool_migrate,
        })

        // 2024-08-19 - Work-around a XAPI bug where allowed_operations are not properly computed when blocked_operations is updated
        //
        // this is a problem because some clients (e.g. XenCenter) use this field to allow operations.
        //
        // internal source: https://team.vates.fr/vates/pl/mjmxnce9qfdx587r3qpe4z91ho
        await vm.$call('update_allowed_operations')
      })
    }

    await this._fetchJobSnapshots()

    await this._selectBaseVm()

    await this._cleanMetadata()
    await this._removeUnusedSnapshots()

    const isRunning = vm.power_state === 'Running'
    const startAfter = isRunning && (settings.offlineBackup ? 'backup' : settings.offlineSnapshot && 'snapshot')
    if (startAfter) {
      await vm.$callAsync('clean_shutdown')
    }

    try {
      await this._snapshot()
      if (startAfter === 'snapshot') {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      if (this._writers.size !== 0) {
        await this._copy()
      }
    } finally {
      if (startAfter) {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      await this._fetchJobSnapshots()
      await this._removeUnusedSnapshots()
      await this._removeSnapshotData()
    }
    await this._healthCheck()
  }
}

decorateMethodsWith(AbstractXapi, {
  run: defer,
})
