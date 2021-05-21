const { asyncMap, asyncMapSettled } = require('@xen-orchestra/async-map')
const Disposable = require('promise-toolbox/Disposable.js')
const ignoreErrors = require('promise-toolbox/ignoreErrors.js')
const { compileTemplate } = require('@xen-orchestra/template')
const { limitConcurrency } = require('limit-concurrency-decorator')

const { extractIdsFromSimplePattern } = require('./_extractIdsFromSimplePattern.js')
const { PoolMetadataBackup } = require('./_PoolMetadataBackup.js')
const { Task } = require('./Task.js')
const { VmBackup } = require('./_VmBackup.js')
const { XoMetadataBackup } = require('./_XoMetadataBackup.js')

const noop = Function.prototype

const getAdaptersByRemote = adapters => {
  const adaptersByRemote = {}
  adapters.forEach(({ adapter, remoteId }) => {
    adaptersByRemote[remoteId] = adapter
  })
  return adaptersByRemote
}

const runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs

exports.Backup = class Backup {
  constructor({ config, getAdapter, getConnectedRecord, job, schedule }) {
    this._config = config
    this._getRecord = getConnectedRecord
    this._job = job
    this._schedule = schedule

    this._getAdapter = Disposable.factory(function* (remoteId) {
      return {
        adapter: yield getAdapter(remoteId),
        remoteId,
      }
    })

    this._getSnapshotNameLabel = compileTemplate(config.snapshotNameLabelTpl, {
      '{job.name}': job.name,
      '{vm.name_label}': vm => vm.name_label,
    })
  }

  run() {
    const type = this._job.type
    if (type === 'backup') {
      return this._runVmBackup()
    } else if (type === 'metadataBackup') {
      return this._runMetadataBackup()
    } else {
      throw new Error(`No runner for the backup type ${type}`)
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
    const settings = {
      ...config.defaultSettings,
      ...config.metadata.defaultSettings,
      ...job.settings[''],
      ...job.settings[schedule.id],
    }

    const poolIds = extractIdsFromSimplePattern(job.pools)
    const isEmptyPools = poolIds.length === 0
    const isXoMetadata = job.xoMetadata !== undefined
    if (!isXoMetadata && isEmptyPools) {
      throw new Error('no metadata mode found')
    }

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
      Disposable.all(
        remoteIds.map(id =>
          this._getAdapter(id).catch(error => {
            // See https://github.com/vatesfr/xen-orchestra/commit/6aa6cfba8ec939c0288f0fa740f6dfad98c43cbb
            runTask(
              {
                name: 'get remote adapter',
                data: { type: 'remote', id },
              },
              () => Promise.reject(error)
            )
          })
        )
      ),
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

    const config = this._config
    const { settings } = job
    const scheduleSettings = {
      ...config.defaultSettings,
      ...config.vm.defaultSettings,
      ...settings[''],
      ...settings[schedule.id],
    }

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
      Disposable.all(
        extractIdsFromSimplePattern(job.remotes).map(id =>
          this._getAdapter(id).catch(error => {
            runTask(
              {
                name: 'get remote adapter',
                data: { type: 'remote', id },
              },
              () => Promise.reject(error)
            )
          })
        )
      ),
      async (srs, remoteAdapters) => {
        // remove adapters that failed (already handled)
        remoteAdapters = remoteAdapters.filter(_ => _ !== undefined)

        // remove srs that failed (already handled)
        srs = srs.filter(_ => _ !== undefined)

        if (remoteAdapters.length === 0 && srs.length === 0 && scheduleSettings.snapshotRetention === 0) {
          return
        }

        const vmIds = extractIdsFromSimplePattern(job.vms)

        Task.info('vms', { vms: vmIds })

        remoteAdapters = getAdaptersByRemote(remoteAdapters)

        const handleVm = vmUuid =>
          runTask({ name: 'backup VM', data: { type: 'VM', id: vmUuid } }, () =>
            Disposable.use(this._getRecord('VM', vmUuid), vm =>
              new VmBackup({
                config,
                getSnapshotNameLabel,
                job,
                // remotes,
                remoteAdapters,
                schedule,
                settings: { ...scheduleSettings, ...settings[vmUuid] },
                srs,
                vm,
              }).run()
            )
          )
        const { concurrency } = scheduleSettings
        await asyncMapSettled(vmIds, concurrency === 0 ? handleVm : limitConcurrency(concurrency)(handleVm))
      }
    )
  }
}
