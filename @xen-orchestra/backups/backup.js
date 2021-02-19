const asyncMapSettled = require('@xen-orchestra/async-map').default
const Disposable = require('promise-toolbox/Disposable')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const limitConcurrency = require('limit-concurrency-decorator').default
const using = require('promise-toolbox/using')
const { compileTemplate } = require('@xen-orchestra/template')

const { asyncMap } = require('./asyncMap')
const { extractIdsFromSimplePattern } = require('./_extractIdsFromSimplePattern')
const { PoolMetadataBackup } = require('./_PoolMetadataBackup')
const { Task } = require('./task')
const { VmBackup } = require('./_VmBackup')
const { XoMetadataBackup } = require('./_XoMetadataBackup')

const noop = Function.prototype

const getAdaptersByRemote = adapters => {
  const adaptersByRemote = {}
  adapters.forEach(({ adapter, remoteId }) => {
    adaptersByRemote[remoteId] = adapter
  })
  return adaptersByRemote
}

const runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs

class Backup {
  constructor({
    config,
    getAdapter,
    getConnectedXapi,
    job,

    recordToXapi,
    remotes,
    schedule,
  }) {
    this._config = config
    this._getConnectedXapi = getConnectedXapi
    this._job = job
    this._recordToXapi = recordToXapi
    this._remotes = remotes
    this._schedule = schedule

    this._getAdapter = Disposable.factory(function* (remoteId) {
      return {
        adapter: yield getAdapter(remotes[remoteId]),
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
    const config = this._config
    const job = this._job
    const schedule = this._schedule

    const settings = {
      ...config.defaultSettings,
      ...config.metadata.defaultSettings,
      ...job.settings[''],
      ...job.settings[schedule.id],
    }

    await using(
      Disposable.all(
        extractIdsFromSimplePattern(job.pools).map(id =>
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
        extractIdsFromSimplePattern(job.remotes).map(id =>
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

    await using(
      Disposable.all(extractIdsFromSimplePattern(job.srs).map(_ => this._getRecord('SR', _))),
      Disposable.all(extractIdsFromSimplePattern(job.remotes).map(id => this._getAdapter(id))),
      async (srs, remoteAdapters) => {
        const vmIds = extractIdsFromSimplePattern(job.vms)

        Task.info('vms', { vms: vmIds })

        remoteAdapters = getAdaptersByRemote(remoteAdapters)

        const handleVm = vmUuid =>
          runTask({ name: 'backup VM', data: { type: 'VM', id: vmUuid } }, () =>
            using(this._getRecord('VM', vmUuid), vm =>
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

  _getRecord = Disposable.factory(this._getRecord)
  async *_getRecord(type, uuid) {
    const xapiId = this._recordToXapi[uuid]
    if (xapiId === undefined) {
      throw new Error('no XAPI associated to ' + uuid)
    }

    const xapi = yield this._getConnectedXapi(xapiId)
    return xapi.getRecordByUuid(type, uuid)
  }
}

exports.Backup = Backup
