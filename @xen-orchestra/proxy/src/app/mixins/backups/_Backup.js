import asyncMapSettled from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import limitConcurrency from 'limit-concurrency-decorator'
import using from 'promise-toolbox/using'
import { compileTemplate } from '@xen-orchestra/template'
import { decorateWith } from '@vates/decorate-with'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern'

import { asyncMap } from '../../../_asyncMap'

import { PoolMetadataBackup } from './_PoolMetadataBackup'
import { Task } from './_Task'
import { VmBackup } from './_VmBackup'
import { XoMetadataBackup } from './_XoMetadataBackup'

const noop = Function.prototype

const getAdaptersByRemote = adapters => {
  const adaptersByRemote = {}
  adapters.forEach(({ adapter, remoteId }) => {
    adaptersByRemote[remoteId] = adapter
  })
  return adaptersByRemote
}

const runTask = (...args) => Task.run(...args).catch(noop) // errors are handled by logs

export class Backup {
  constructor({
    app,
    getConnectedXapi,
    job,

    recordToXapi,
    remotes,
    schedule,
  }) {
    // don't change config during backup execution
    const config = app.config.get('backups')

    this._app = app
    this._config = config
    this._getConnectedXapi = getConnectedXapi
    this._job = job
    this._recordToXapi = recordToXapi
    this._remotes = remotes
    this._schedule = schedule

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

  @decorateWith(Disposable.factory)
  *_getAdapter(remoteId) {
    const adapter = yield this._app.remotes.getAdapter(this._remotes[remoteId])
    return {
      adapter,
      remoteId,
    }
  }

  @decorateWith(Disposable.factory)
  async *_getRecord(type, uuid) {
    const xapiId = this._recordToXapi[uuid]
    if (xapiId === undefined) {
      throw new Error('no XAPI associated to ' + uuid)
    }

    const xapi = yield this._getConnectedXapi(xapiId)
    return xapi.getRecordByUuid(type, uuid)
  }
}
