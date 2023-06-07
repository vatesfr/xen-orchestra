'use strict'

const { asyncMapSettled } = require('@xen-orchestra/async-map')
const Disposable = require('promise-toolbox/Disposable')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { extractIdsFromSimplePattern } = require('../extractIdsFromSimplePattern.js')
const { Task } = require('../Task.js')
const createStreamThrottle = require('./_createStreamThrottle.js')
const { DEFAULT_SETTINGS, Abstract } = require('./_Abstract.js')
const { runTask } = require('./_runTask.js')
const { getAdaptersByRemote } = require('./_getAdaptersByRemote.js')
const { FullRemote } = require('./_vmRunners/FullRemote.js')
const { IncrementalRemote } = require('./_vmRunners/IncrementalRemote.js')

const DEFAULT_REMOTE_VM_SETTINGS = {
  concurrency: 2,
  copyRetention: 0,
  deleteFirst: false,
  exportRetention: 0,
  healthCheckSr: undefined,
  healthCheckVmsWithTags: [],
  maxExportRate: 0,
  maxMergedDeltasPerRun: Infinity,
  timeout: 0,
  validateVhdStreams: false,
  vmTimeout: 0,
}

exports.VmsRemote = class RemoteVmsBackupRunner extends Abstract {
  _computeBaseSettings(config, job) {
    const baseSettings = { ...DEFAULT_SETTINGS }
    Object.assign(baseSettings, DEFAULT_REMOTE_VM_SETTINGS, config.defaultSettings, config.vm?.defaultSettings)
    Object.assign(baseSettings, job.settings[''])
    return baseSettings
  }

  async run() {
    const job = this._job
    const schedule = this._schedule
    const settings = this._settings

    const throttleStream = createStreamThrottle(settings.maxExportRate)

    const config = this._config
    await Disposable.use(
      () => this._getAdapter(job.sourceRemote),
      () => (settings.healthCheckSr !== undefined ? this._getRecord('SR', settings.healthCheckSr) : undefined),
      Disposable.all(
        extractIdsFromSimplePattern(job.remotes).map(id => id !== job.sourceRemote && this._getAdapter(id))
      ),
      async ({ adapter: sourceRemoteAdapter }, healthCheckSr, remoteAdapters) => {
        // remove adapters that failed (already handled)
        remoteAdapters = remoteAdapters.filter(_ => !!_)
        if (remoteAdapters.length === 0) {
          return
        }

        const vmsUuids = await sourceRemoteAdapter.listAllVms()

        Task.info('vms', { vms: vmsUuids })

        remoteAdapters = getAdaptersByRemote(remoteAdapters)
        const allSettings = this._job.settings
        const baseSettings = this._baseSettings

        const handleVm = vmUuid => {
          const taskStart = { name: 'backup VM', data: { type: 'VM', id: vmUuid } }

          const opts = {
            baseSettings,
            config,
            job,
            healthCheckSr,
            remoteAdapters,
            schedule,
            settings: { ...settings, ...allSettings[vmUuid] },
            sourceRemoteAdapter,
            throttleStream,
            vmUuid,
          }
          let vmBackup
          if (job.mode === 'delta') {
            vmBackup = new IncrementalRemote(opts)
          } else if (job.mode === 'full') {
            vmBackup = new FullRemote(opts)
          } else {
            throw new Error(`Job mode ${job.mode} not implemented for mirror backup`)
          }

          return runTask(taskStart, () => vmBackup.run())
        }
        const { concurrency } = settings
        await asyncMapSettled(vmsUuids, !concurrency ? handleVm : limitConcurrency(concurrency)(handleVm))
      }
    )
  }
}
