'use strict'

const { asyncMapSettled } = require('@xen-orchestra/async-map')
const Disposable = require('promise-toolbox/Disposable')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { extractIdsFromSimplePattern } = require('../extractIdsFromSimplePattern.js')
const { Task } = require('../Task.js')
const createStreamThrottle = require('./createStreamThrottle.js')
const { IncrementalXapiVmBackup } = require('./VmBackup/IncrementalXapiVmBackup.js')
const { FullXapiVmBackup } = require('./VmBackup/FullXapiVmBackup.js')
const { DEFAULT_SETTINGS, AbstractBackupJob } = require('./AbstractBackupJob.js')
const { runTask } = require('./runTask.js')
const { getAdaptersByRemote } = require('./getAdapterByRemote.js')

const DEFAULT_XAPI_VM_SETTINGS = {
  bypassVdiChainsCheck: false,
  checkpointSnapshot: false,
  concurrency: 2,
  copyRetention: 0,
  deleteFirst: false,
  exportRetention: 0,
  fullInterval: 0,
  healthCheckSr: undefined,
  healthCheckVmsWithTags: [],
  maxExportRate: 0,
  maxMergedDeltasPerRun: Infinity,
  offlineBackup: false,
  offlineSnapshot: false,
  snapshotRetention: 0,
  timeout: 0,
  useNbd: false,
  unconditionalSnapshot: false,
  validateVhdStreams: false,
  vmTimeout: 0,
}

exports.XapiVmBackupJob = class XapiVmBackupJob extends AbstractBackupJob {
  _computeBaseSettings(config, job) {
    const baseSettings = { ...DEFAULT_SETTINGS }
    Object.assign(baseSettings, DEFAULT_XAPI_VM_SETTINGS, config.defaultSettings, config.vm?.defaultSettings)
    Object.assign(baseSettings, job.settings[''])
    return baseSettings
  }

  async run() {
    const job = this._job

    // FIXME: proper SimpleIdPattern handling
    const getSnapshotNameLabel = this._getSnapshotNameLabel
    const schedule = this._schedule
    const settings = this._settings

    const throttleStream = createStreamThrottle(settings.maxExportRate)

    const config = this._config
    await Disposable.use(
      Disposable.all(
        extractIdsFromSimplePattern(job.srs).map(id =>
          this._getRecord('SR', id).catch(error => {
            runTask(
              {
                name: 'get SR record',
                data: { type: 'SR', id },
              },
              () => Promise.reject(error)
            )
          })
        )
      ),
      Disposable.all(extractIdsFromSimplePattern(job.remotes).map(id => this._getAdapter(id))),
      () => (settings.healthCheckSr !== undefined ? this._getRecord('SR', settings.healthCheckSr) : undefined),
      async (srs, remoteAdapters, healthCheckSr) => {
        // remove adapters that failed (already handled)
        remoteAdapters = remoteAdapters.filter(_ => _ !== undefined)

        // remove srs that failed (already handled)
        srs = srs.filter(_ => _ !== undefined)

        if (remoteAdapters.length === 0 && srs.length === 0 && settings.snapshotRetention === 0) {
          return
        }

        const vmIds = extractIdsFromSimplePattern(job.vms)

        Task.info('vms', { vms: vmIds })

        remoteAdapters = getAdaptersByRemote(remoteAdapters)

        const allSettings = this._job.settings
        const baseSettings = this._baseSettings

        const handleVm = vmUuid => {
          const taskStart = { name: 'backup VM', data: { type: 'VM', id: vmUuid } }

          return this._getRecord('VM', vmUuid).then(
            disposableVm =>
              Disposable.use(disposableVm, vm => {
                taskStart.data.name_label = vm.name_label
                return runTask(taskStart, () => {
                  const opts = {
                    baseSettings,
                    config,
                    getSnapshotNameLabel,
                    healthCheckSr,
                    job,
                    remoteAdapters,
                    schedule,
                    settings: { ...settings, ...allSettings[vm.uuid] },
                    srs,
                    throttleStream,
                    vm,
                  }
                  let vmBackup
                  if (job.mode === 'delta') {
                    vmBackup = new IncrementalXapiVmBackup(opts)
                  } else {
                    if (job.mode === 'full') {
                      vmBackup = new FullXapiVmBackup(opts)
                    } else {
                      throw new Error(`Job mode ${job.mode} not implemented`)
                    }
                  }
                  return vmBackup.run()
                })
              }),
            error =>
              runTask(taskStart, () => {
                throw error
              })
          )
        }
        const { concurrency } = settings
        await asyncMapSettled(vmIds, concurrency === 0 ? handleVm : limitConcurrency(concurrency)(handleVm))
      }
    )
  }
}
