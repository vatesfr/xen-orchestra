import assert from 'node:assert'
import groupBy from 'lodash/groupBy.js'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { formatDateTime } from '@xen-orchestra/xapi'

import { getOldEntries } from '../../_getOldEntries.mjs'
import { Task } from '../../Task.mjs'
import { Abstract } from './_Abstract.mjs'

const { info, warn } = createLogger('xo:backups:AbstractXapi')

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
    if (vm.other_config['xo:backup:job'] === job.id && 'start' in vm.blocked_operations) {
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

    this._fullVdisRequired = undefined
    this._getSnapshotNameLabel = getSnapshotNameLabel
    this._isIncremental = job.mode === 'delta'
    this._healthCheckSr = healthCheckSr
    this._jobId = job.id
    this._jobSnapshots = undefined
    this._throttleStream = throttleStream
    this._xapi = vm.$xapi

    // Base VM for the export
    this._baseVm = undefined

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
    if ('xo:backup:job' in vm.other_config) {
      await vm.update_other_config({
        'xo:backup:datetime': null,
        'xo:backup:deltaChainLength': null,
        'xo:backup:exported': null,
        'xo:backup:job': null,
        'xo:backup:schedule': null,
        'xo:backup:vm': null,
      })
    }
  }

  async _snapshot() {
    const vm = this._vm
    const xapi = this._xapi

    const settings = this._settings

    if (this._mustDoSnapshot()) {
      await Task.run({ name: 'snapshot' }, async () => {
        if (!settings.bypassVdiChainsCheck) {
          await vm.$assertHealthyVdiChains()
        }

        const snapshotRef = await vm[settings.checkpointSnapshot ? '$checkpoint' : '$snapshot']({
          ignoreNobakVdis: true,
          name_label: this._getSnapshotNameLabel(vm),
          unplugVusbs: true,
        })
        this.timestamp = Date.now()

        await xapi.setFieldEntries('VM', snapshotRef, 'other_config', {
          'xo:backup:datetime': formatDateTime(this.timestamp),
          'xo:backup:job': this._jobId,
          'xo:backup:schedule': this.scheduleId,
          'xo:backup:vm': vm.uuid,
        })

        this._exportedVm = await xapi.getRecord('VM', snapshotRef)

        return this._exportedVm.uuid
      })
    } else {
      this._exportedVm = vm
      this.timestamp = Date.now()
    }
  }

  // this will delete current snapshot in case of failure
  // to ensure any retry will start with a clean state, especially in the case of rolling snapshots
  #removeCurrentSnapshotOnFailure() {
    if (this._mustDoSnapshot() && this._exportedVm !== undefined) {
      info('will delete snapshot on failure', { vm: this._vm, snapshot: this._exportedVm })
      assert.notStrictEqual(
        this._vm.$ref,
        this._exportedVm.$ref,
        'there should have a snapshot, but vm and snapshot have the same ref'
      )
      return this._xapi.VM_destroy(this._exportedVm.$ref)
    }
  }

  async _fetchJobSnapshots() {
    const jobId = this._jobId
    const vmRef = this._vm.$ref
    const xapi = this._xapi

    const snapshotsRef = await xapi.getField('VM', vmRef, 'snapshots')
    const snapshotsOtherConfig = await asyncMap(snapshotsRef, ref => xapi.getField('VM', ref, 'other_config'))

    const snapshots = []
    snapshotsOtherConfig.forEach((other_config, i) => {
      if (other_config['xo:backup:job'] === jobId) {
        snapshots.push({ other_config, $ref: snapshotsRef[i] })
      }
    })
    snapshots.sort((a, b) => (a.other_config['xo:backup:datetime'] < b.other_config['xo:backup:datetime'] ? -1 : 1))
    this._jobSnapshots = snapshots
  }

  async _removeUnusedSnapshots() {
    const allSettings = this.job.settings
    const baseSettings = this._baseSettings
    const baseVmRef = this._baseVm?.$ref

    const snapshotsPerSchedule = groupBy(this._jobSnapshots, _ => _.other_config['xo:backup:schedule'])
    const xapi = this._xapi
    await asyncMap(Object.entries(snapshotsPerSchedule), ([scheduleId, snapshots]) => {
      const settings = {
        ...baseSettings,
        ...allSettings[scheduleId],
        ...allSettings[this._vm.uuid],
      }
      return asyncMap(getOldEntries(settings.snapshotRetention, snapshots), ({ $ref }) => {
        if ($ref !== baseVmRef) {
          return xapi.VM_destroy($ref)
        }
      })
    })
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

    await this._fetchJobSnapshots()

    await this._selectBaseVm()

    await this._cleanMetadata()
    await this._removeUnusedSnapshots()

    const vm = this._vm
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
        const { pool_migrate = null, migrate_send = null } = this._exportedVm.blocked_operations

        const reason = 'VM migration is blocked during backup'
        await this._exportedVm.update_blocked_operations({ pool_migrate: reason, migrate_send: reason })
        try {
          await this._copy()
        } finally {
          await this._exportedVm.update_blocked_operations({ pool_migrate, migrate_send })
        }
      }
    } catch (error) {
      try {
        await this.#removeCurrentSnapshotOnFailure()
      } catch (removeSnapshotError) {
        warn('fail removing current snapshot', { error: removeSnapshotError })
      }
      throw error
    } finally {
      if (startAfter) {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      await this._fetchJobSnapshots()
      await this._removeUnusedSnapshots()
    }
    await this._healthCheck()
  }
}

decorateMethodsWith(AbstractXapi, {
  run: defer,
})
