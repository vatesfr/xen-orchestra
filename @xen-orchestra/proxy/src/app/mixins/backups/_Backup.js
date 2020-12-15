import asyncMap from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import limitConcurrency from 'limit-concurrency-decorator'
import using from 'promise-toolbox/using'
import { compileTemplate } from '@xen-orchestra/template'
import { decorateWith } from '@vates/decorate-with'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern'

import { Task } from './_Task'
import { VmBackup } from './_VmBackup'

const noop = Function.prototype

export class Backup {
  constructor({
    app,
    config,
    getConnectedXapi,
    job,

    recordToXapi,
    remotes,
    schedule,
  }) {
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

  async run() {
    const job = this._job

    // FIXME: proper SimpleIdPattern handling
    const getSnapshotNameLabel = this._getSnapshotNameLabel
    const schedule = this._schedule

    const { settings } = job
    const scheduleSettings = {
      ...this._config.defaultSettings,
      ...settings[''],
      ...settings[schedule.id],
    }

    await using(
      Disposable.all(extractIdsFromSimplePattern(job.srs).map(_ => this._getRecord('SR', _))),
      Disposable.all(extractIdsFromSimplePattern(job.remotes).map(id => this._getAdapter(id))),
      async (srs, adapters) => {
        const vmIds = extractIdsFromSimplePattern(job.vms)

        Task.info('vms', { vms: vmIds })

        const remoteAdapters = {}
        adapters.forEach(({ adapter, remoteId }) => {
          remoteAdapters[remoteId] = adapter
        })

        const handleVm = vmUuid =>
          Task.run({ name: 'backup VM', data: { type: 'VM', id: vmUuid } }, () =>
            using(this._getRecord('VM', vmUuid), vm =>
              new VmBackup({
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
          ).catch(noop) // errors are handled by logs
        const { concurrency } = scheduleSettings
        await asyncMap(vmIds, concurrency === 0 ? handleVm : limitConcurrency(concurrency)(handleVm))
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
