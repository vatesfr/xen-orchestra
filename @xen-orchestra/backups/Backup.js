'use strict'

const { asyncMap, asyncMapSettled } = require('@xen-orchestra/async-map')
const Disposable = require('promise-toolbox/Disposable')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const pTimeout = require('promise-toolbox/timeout')
const { compileTemplate } = require('@xen-orchestra/template')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { extractIdsFromSimplePattern } = require('./extractIdsFromSimplePattern.js')
const { PoolMetadataBackup } = require('./_PoolMetadataBackup.js')
const { Task } = require('./Task.js')
const { VmBackup } = require('./_VmBackup.js')
const { XoMetadataBackup } = require('./_XoMetadataBackup.js')
const createStreamThrottle = require('./_createStreamThrottle.js')

const noop = Function.prototype

const getAdaptersByRemote = adapters => {
  const adaptersByRemote = {}
  adapters.forEach(({ adapter, remoteId }) => {
    adaptersByRemote[remoteId] = adapter
  })
  return adaptersByRemote
}

const runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs

const DEFAULT_SETTINGS = {
  getRemoteTimeout: 300e3,
  reportWhen: 'failure',
}

const DEFAULT_VM_SETTINGS = {
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
  vmTimeout: 0,
}

const DEFAULT_METADATA_SETTINGS = {
  retentionPoolMetadata: 0,
  retentionXoMetadata: 0,
}

class RemoteTimeoutError extends Error {
  constructor(remoteId) {
    super('timeout while getting the remote ' + remoteId)
    this.remoteId = remoteId
  }
}

exports.Backup = class Backup {
  constructor({ config, getAdapter, getConnectedRecord, job, schedule }) {
    this._config = config
    this._getRecord = getConnectedRecord
    this._job = job
    this._schedule = schedule

    this._getSnapshotNameLabel = compileTemplate(config.snapshotNameLabelTpl, {
      '{job.name}': job.name,
      '{vm.name_label}': vm => vm.name_label,
    })

    const { type } = job
    const baseSettings = { ...DEFAULT_SETTINGS }
    if (type === 'backup') {
      Object.assign(baseSettings, DEFAULT_VM_SETTINGS, config.defaultSettings, config.vm?.defaultSettings)
      this.run = this._runVmBackup
    } else if (type === 'metadataBackup') {
      Object.assign(baseSettings, DEFAULT_METADATA_SETTINGS, config.defaultSettings, config.metadata?.defaultSettings)
      this.run = this._runMetadataBackup
    } else {
      throw new Error(`No runner for the backup type ${type}`)
    }
    Object.assign(baseSettings, job.settings[''])

    this._baseSettings = baseSettings
    this._settings = { ...baseSettings, ...job.settings[schedule.id] }

    const { getRemoteTimeout } = this._settings
    this._getAdapter = async function (remoteId) {
      try {
        const disposable = await pTimeout.call(getAdapter(remoteId), getRemoteTimeout, new RemoteTimeoutError(remoteId))

        return new Disposable(() => disposable.dispose(), {
          adapter: disposable.value,
          remoteId,
        })
      } catch (error) {
        // See https://github.com/vatesfr/xen-orchestra/commit/6aa6cfba8ec939c0288f0fa740f6dfad98c43cbb
        runTask(
          {
            name: 'get remote adapter',
            data: { type: 'remote', id: remoteId },
          },
          () => Promise.reject(error)
        )
      }
    }
  }

  async _runMetadataBackup() {
    const schedule = this._schedule
    const job = this._job
    const remoteIds = extractIdsFromSimplePattern(job.remotes)
    if (remoteIds.length === 0) {
      throw new Error('metadata backup job cannot run without remotes')
    }

    const config = this._config
    const poolIds = extractIdsFromSimplePattern(job.pools)
    const isEmptyPools = poolIds.length === 0
    const isXoMetadata = job.xoMetadata !== undefined
    if (!isXoMetadata && isEmptyPools) {
      throw new Error('no metadata mode found')
    }

    const settings = this._settings

    const { retentionPoolMetadata, retentionXoMetadata } = settings

    if (
      (retentionPoolMetadata === 0 && retentionXoMetadata === 0) ||
      (!isXoMetadata && retentionPoolMetadata === 0) ||
      (isEmptyPools && retentionXoMetadata === 0)
    ) {
      throw new Error('no retentions corresponding to the metadata modes found')
    }

    await Disposable.use(
      Disposable.all(
        poolIds.map(id =>
          this._getRecord('pool', id).catch(error => {
            // See https://github.com/vatesfr/xen-orchestra/commit/6aa6cfba8ec939c0288f0fa740f6dfad98c43cbb
            runTask(
              {
                name: 'get pool record',
                data: { type: 'pool', id },
              },
              () => Promise.reject(error)
            )
          })
        )
      ),
      Disposable.all(remoteIds.map(id => this._getAdapter(id))),
      async (pools, remoteAdapters) => {
        // remove adapters that failed (already handled)
        remoteAdapters = remoteAdapters.filter(_ => _ !== undefined)
        if (remoteAdapters.length === 0) {
          return
        }
        remoteAdapters = getAdaptersByRemote(remoteAdapters)

        // remove pools that failed (already handled)
        pools = pools.filter(_ => _ !== undefined)

        const promises = []
        if (pools.length !== 0 && settings.retentionPoolMetadata !== 0) {
          promises.push(
            asyncMap(pools, async pool =>
              runTask(
                {
                  name: `Starting metadata backup for the pool (${pool.$id}). (${job.id})`,
                  data: {
                    id: pool.$id,
                    pool,
                    poolMaster: await ignoreErrors.call(pool.$xapi.getRecord('host', pool.master)),
                    type: 'pool',
                  },
                },
                () =>
                  new PoolMetadataBackup({
                    config,
                    job,
                    pool,
                    remoteAdapters,
                    schedule,
                    settings,
                  }).run()
              )
            )
          )
        }

        if (job.xoMetadata !== undefined && settings.retentionXoMetadata !== 0) {
          promises.push(
            runTask(
              {
                name: `Starting XO metadata backup. (${job.id})`,
                data: {
                  type: 'xo',
                },
              },
              () =>
                new XoMetadataBackup({
                  config,
                  job,
                  remoteAdapters,
                  schedule,
                  settings,
                }).run()
            )
          )
        }
        await Promise.all(promises)
      }
    )
  }

  async _runVmBackup() {
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
                return runTask(taskStart, () =>
                  new VmBackup({
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
                  }).run()
                )
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
