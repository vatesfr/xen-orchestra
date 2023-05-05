'use strict'

const assert = require('assert')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const groupBy = require('lodash/groupBy.js')
const { asyncMap } = require('@xen-orchestra/async-map')
const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { formatDateTime } = require('@xen-orchestra/xapi')
const { getOldEntries } = require('./writers/_getOldEntries.js')

const { Task } = require('../../Task.js')
const { AbstractVmBackup } = require('./AbstractVmBackup.js')

class AbstractXapiVmBackup extends AbstractVmBackup {
  constructor({
    config,
    getSnapshotNameLabel,
    healthCheckSr,
    job,
    remoteAdapters,
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

    this.config = config
    this.job = job
    this.remoteAdapters = remoteAdapters
    this.scheduleId = schedule.id
    this.timestamp = undefined

    // VM currently backed up
    this.vm = vm
    const { tags } = this.vm

    // VM (snapshot) that is really exported
    this.exportedVm = undefined

    this._fullVdisRequired = undefined
    this._getSnapshotNameLabel = getSnapshotNameLabel
    this._healthCheckSr = healthCheckSr
    this._jobId = job.id
    this._jobSnapshots = undefined
    this._throttleStream = throttleStream
    this._xapi = vm.$xapi

    // Reference VM for the incremental export
    // if possible we willonly export the difference between thie vm and now
    this._vmComparisonBasis = undefined

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

      const [RemoteWriter, XapiWriter] = this._getWriters()

      const allSettings = job.settings
      Object.keys(remoteAdapters).forEach(remoteId => {
        const targetSettings = {
          ...settings,
          ...allSettings[remoteId],
        }
        if (targetSettings.exportRetention !== 0) {
          writers.add(new RemoteWriter({ backup: this, remoteId, settings: targetSettings }))
        }
      })
      srs.forEach(sr => {
        const targetSettings = {
          ...settings,
          ...allSettings[sr.uuid],
        }
        if (targetSettings.copyRetention !== 0) {
          writers.add(new XapiWriter({ backup: this, sr, settings: targetSettings }))
        }
      })
    }
  }

  // ensure the VM itself does not have any backup metadata which would be
  // copied on manual snapshots and interfere with the backup jobs
  async _cleanMetadata() {
    const { vm } = this
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
    const { vm } = this
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

        this.exportedVm = await xapi.getRecord('VM', snapshotRef)

        return this.exportedVm.uuid
      })
    } else {
      this.exportedVm = vm
      this.timestamp = Date.now()
    }
  }

  async _fetchJobSnapshots() {
    const jobId = this._jobId
    const vmRef = this.vm.$ref
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
    const vmComparisonBasisRef = this._vmComparisonBasis?.$ref

    const snapshotsPerSchedule = groupBy(this._jobSnapshots, _ => _.other_config['xo:backup:schedule'])
    const xapi = this._xapi
    await asyncMap(Object.entries(snapshotsPerSchedule), ([scheduleId, snapshots]) => {
      const settings = {
        ...baseSettings,
        ...allSettings[scheduleId],
        ...allSettings[this.vm.uuid],
      }
      return asyncMap(getOldEntries(settings.snapshotRetention, snapshots), ({ $ref }) => {
        if ($ref !== vmComparisonBasisRef) {
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

    // will only do something during incremental Backup
    await this._selectBaseVm()

    await this._cleanMetadata()
    await this._removeUnusedSnapshots()

    const { vm } = this
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
    }
    await this._healthCheck()
  }
}
exports.AbstractXapiVmBackup = AbstractXapiVmBackup

decorateMethodsWith(AbstractXapiVmBackup, {
  run: defer,
})
