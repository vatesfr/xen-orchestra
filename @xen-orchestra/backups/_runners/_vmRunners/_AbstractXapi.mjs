import assert from 'node:assert'
import groupBy from 'lodash/groupBy.js'
import { createLogger } from '@xen-orchestra/log'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncMap } from '@xen-orchestra/async-map'
import { asyncEach } from '@vates/async-each'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'

import { getOldEntries } from '../../_getOldEntries.mjs'
import { Task } from '../../Task.mjs'
import { Abstract } from './_Abstract.mjs'
import { DATETIME, JOB_ID, SCHEDULE_ID, VM_UUID, resetVmOtherConfig, setVmOtherConfig } from '../../_otherConfig.mjs'

const { warn, info } = createLogger('xo:backups:AbstractXapi')

const TEMP_SNAPSHOT_NAME = 'xo-backup-temp-snapshot-name'

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
    throttleGenerator,
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
    this._throttleGenerator = throttleGenerator
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

      const [BackupWriter, ReplicationWriter, AggregratedBackupWriter, AggregratedReplicationWriter] =
        this._getWriters()

      const allSettings = job.settings

      if (settings.exportRetention > 0) {
        if (settings.spreadBackups) {
          writers.add(
            new AggregratedBackupWriter({
              adapters: remoteAdapters,
              BackupWriter,
              config,
              healthCheckSr,
              job,
              scheduleId: schedule.id,
              vmUuid: vm.uuid,
              settings,
            })
          )
        } else {
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
        }
      }
      if (settings.copyRetention) {
        if (settings.spreadReplications) {
          writers.add(
            new AggregratedReplicationWriter({
              config,
              healthCheckSr,
              job,
              ReplicationWriter,
              scheduleId: schedule.id,
              vmUuid: vm.uuid,
              srs,
              settings,
            })
          )
        } else {
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

    if (await this._mustDoSnapshot()) {
      await Task.run({ name: 'snapshot' }, async () => {
        if (!settings.bypassVdiChainsCheck) {
          await vm.$assertHealthyVdiChains()
        }
        if (settings.cbtDestroySnapshotData) {
          try {
            // enable CBT on all disks if we want to be able to purge snapshot data
            const diskRefs = await xapi.VM_getDisks(vm.$ref)
            await Promise.all(diskRefs.map(diskRef => xapi.callAsync('VDI.enable_cbt', diskRef)))
          } catch (error) {
            Task.info(`couldn't enable CBT`, error)
          }
        }

        const snapshotRef = await vm[settings.checkpointSnapshot ? '$checkpoint' : '$snapshot']({
          ignoredVdisTag: '[NOBAK]',
          name_label: TEMP_SNAPSHOT_NAME,
          unplugVusbs: true,
        })
        this.timestamp = Date.now()
        await setVmOtherConfig(xapi, snapshotRef, {
          timestamp: this.timestamp,
          jobId: this._jobId,
          scheduleId: this.scheduleId,
          vmUuid: vm.uuid,
        })
        const snapshot = await xapi.getRecord('VM', snapshotRef)
        await snapshot.set_name_label(this._getSnapshotNameLabel(vm))
        // reload data to ensure it is up to date with the new name label
        this._exportedVm = await xapi.getRecord('VM', snapshotRef)
        return this._exportedVm.uuid
      })
    } else {
      this._exportedVm = vm
      this.timestamp = Date.now()
    }
  }

  // handle snapshot by VDI since snapshot of cbtDestroySnapshotData jobs
  // aren't attached to any VM

  // look at all the vdi snapshots ( snapshot_of not empty )
  // with the same vm_uuid and job_uuid
  //   for cbt_metadata list them unconditionnaly to remove older one
  //   for other: only list them if they are attached to a VM snapshot
  //  and if this vm snapshot is also part of the backup
  //   ensure they are attached to only one vm snapshot
  //   ensure any VM-snapshot harvested by this has all its disk harvested (no mix of vdi snapshot from this job and not)

  async _fetchJobSnapshots() {
    const jobId = this._jobId
    const xapi = this._xapi

    const vdiCandidates = {}

    Object.values(xapi.objects.indexes.type.VDI)
      .filter(_ => !!_) // filter nullish
      .filter(({ other_config, $snapshot_of }) => {
        return $snapshot_of !== undefined && other_config[JOB_ID] === jobId && other_config[VM_UUID] === this._vm.uuid
      })
      .forEach(vdi => {
        vdiCandidates[vdi.uuid] = vdi
      })

    // check that user snapshots are clean

    for (const vdi of Object.values(vdiCandidates)) {
      // cbt metadata are always considered linked to a backup job
      // if they have the right other_config
      if (vdi.type === 'cbt_metadata') {
        continue
      }
      const vbds = vdi.$VBDs
        .filter(({ $VM }) => !!$VM) // filter empty VMs
        .filter(({ $VM }) => $VM.is_control_domain === false) // do not handle control domain
      if (vbds.length === 0) {
        // orphan vdi snapshot
        info(
          `disk snapshot ${vdi.name_label} is orphan or attached only to control domain,
          it will be removed at the end of a successful backup run`,
          { vdi, attachedto: vdi.$VBDs.map(vbd => vbd?.$VM) }
        )
        continue
      }
      const userVms = vbds.map(({ $VM }) => $VM)
      if (vbds.length > 1) {
        warn(
          `vdi ${vdi.name_label} (${vdi.uuid}) is linked to multipe vms :  ${userVms.map(({ name_label, uuid }) => `${name_label} ${uuid}`).join(', ')}. 
              This disk snapshot will be excluded from the backup cleaning`,
          { vdi, userVms }
        )
        delete vdiCandidates[vdi.uuid]
        continue
      }

      const vm = vbds[0].$VM

      // xapi has some issue regarding vdi snapshot attached to non snapshot VM
      // it can also be some user action forcibely linking a vdi snapshot to a vm
      // => we exclude these from the backup processing
      if (vm.$snapshot_of === undefined) {
        warn(
          `vdi ${vdi.name_label} (${vdi.uuid}) is a snapshot linked to a non snapshot vm ${vm.name_label} ${vm.uuid}. 
          This disk snapshot will be excluded from the backup cleaning`,
          { vdi, vm }
        )
        delete vdiCandidates[vdi.uuid]
        continue
      }

      // vdi is attached only to a snapshot that is not a backup snapshot
      // we don't check scheduleId since we are looking for all the snapshot of this job
      // => excludes from the list to be cleared
      if (
        vm.other_config[DATETIME] !== vdi.other_config[DATETIME] ||
        vm.other_config[JOB_ID] !== vdi.other_config[JOB_ID] ||
        vm.other_config[VM_UUID] !== vdi.other_config[VM_UUID]
      ) {
        warn(
          `vdi ${vdi.name_label} (${vdi.uuid}) is a snapshot linked to a snapshot vm ${vm.name_label} ${vm.uuid} out of this backup job scope. 
          This disk snapshot will be excluded from the backup cleaning`,
          { vdi, vm }
        )
        delete vdiCandidates[vdi.uuid]
        continue
      }

      // check if all the disks of these VM snapshot have been harvested
      // if not => remove it from the list to ensure we won't half destroy VM later
      vm.$VBDs
        .filter(({ $VDI }) => !!$VDI) // filter missing keys
        .filter(({ $VDI }) => $VDI && vdiCandidates[$VDI.uuid] === undefined)
        .forEach(({ $VDI: outOfSnapshotsVdi, ...other }) => {
          warn(
            `vdi ${vdi.name_label} ${vdi.uuid} is recognized as a snapshot of the backup job,
           linked to vm ${vm.name_label} ${vm.uuid} but vdi ${outOfSnapshotsVdi.name_label} ${outOfSnapshotsVdi.uuid} 
           is not linked to the job. This disk snapshot will be excluded from the backup cleaning`,
            { vdi, vm, vbds, outOfSnapshotsVdi }
          )
          // this will be called multiple time but it is not really an issue
          delete vdiCandidates[vdi.uuid]
        })
    }

    this._jobSnapshotVdis = Object.values(vdiCandidates)
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
        let vm
        // if there is an attached VM => destroy the VM (Non CBT backups)
        for (const vdi of vdis) {
          const vbds = vdi.$VBDs.filter(({ $VM }) => $VM.is_control_domain === false)
          if (vbds.length > 0) {
            // only one VM linked to this vdi
            // this will throw error for VDI still attached to control domain
            // since we won't be able to remove an attached VDI
            assert.strictEqual(vbds.length, 1, 'VDI must be free or attached to exactly one VM')
            const vdiVm = vbds[0].$VM
            if (vdiVm.$snapshot_of === undefined) {
              // don't delete a VM (especially a control domain)
              warn(
                `VM ${vdiVm.uuid} (${vdiVm.name_label}) linked to VDI ${vdi.uuid} (${vdi.name_label}) should be a snapshot`
              )
              throw new Error(`VM must be a snapshot`)
            }
            if (vm !== undefined && vm.$ref !== vdiVm.$ref) {
              // this VDI is attached to another VM than the other vdi of
              // this batch
              // in doubt, do not delete anything
              warn("_removeUnusedSnapshots don't handle vdi related to multiple VMs ", {
                vm1: {
                  label: vm.name_label,
                  id: vm.$id,
                },
                vm2: {
                  label: vdiVm.name_label,
                  id: vdiVm.$id,
                },
                vdis: vdis.map(({ name_label, $id }) => ({ name_label, $id })),
              })
              throw new Error(
                `_removeUnusedSnapshots don't handle vdi related to multiple VMs ${vm.name_label} and ${vdiVm.name_label}`
              )
            }
            vm = vdiVm
          }
        }
        if (vm?.$ref !== undefined) {
          return xapi.VM_destroy(vm.$ref)
        } else {
          return asyncMap(
            vdis.map(async ({ $ref }) => {
              await xapi.VDI_destroy($ref)
            })
          )
        }
      })
    })

    // list and remove the snapshot were the jobs failed between
    // makesnapshot and update_other_config
    const snapshots = this._vm.$snapshots.filter(_ => !!_).filter(({ name_label }) => name_label === TEMP_SNAPSHOT_NAME)
    await asyncEach(snapshots, snapshot => snapshot.$destroy())
  }

  async _removeSnapshotData() {
    // now that we use CBT, we can destroy the data of the snapshot used for this backup
    // going back to a previous version of XO not supporting CBT will create a full backup
    // this will only do something after snapshot and transfer
    if (
      this._exportedVm !== undefined &&
      // don't modify the VM
      this._exportedVm.$snapshot_of !== undefined &&
      // user don't want to keep the snapshot data
      this._settings.snapshotRetention === 0 &&
      // preferNbd is not a guarantee that the backup used NBD, depending on the network configuration,
      // in that case next runs will be full, but there is not an easy way to prevent that
      this._settings.preferNbd &&
      // only delete snapshot data if the config allows it
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

  async _mustDoSnapshot() {
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
