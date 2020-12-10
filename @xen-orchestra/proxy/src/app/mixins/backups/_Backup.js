import asyncMap from '@xen-orchestra/async-map'
import limitConcurrency from 'limit-concurrency-decorator'
import using from 'promise-toolbox/using'
import { compileTemplate } from '@xen-orchestra/template'
import { decorateWith } from '@vates/decorate-with'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern'

import { disposable } from '../../_disposable'

import { Task } from './_Task'
import { VmBackup } from './_VmBackup'

const noop = Function.prototype

export class Backup {
  constructor({
    app,
    config,
    connectedXapis,
    job,

    recordToXapi,
    remotes,
    schedule,
  }) {
    this._app = app
    this._config = config
    this._connectedXapis = connectedXapis
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

    const srs = await Promise.all(extractIdsFromSimplePattern(job.srs).map(_ => this._getRecord('SR', _)))

    const remoteAdapters = extractIdsFromSimplePattern(job.remotes).map(id => this._getAdapter(id))
    await using(remoteAdapters, async adapters => {
      const vmIds = extractIdsFromSimplePattern(job.vms)

      Task.info('vms', { vms: vmIds })

      const remoteAdapters = {}
      adapters.forEach(({ adapter, remoteId }) => {
        remoteAdapters[remoteId] = adapter
      })

      const handleVm = vmUuid =>
        Task.run({ name: 'backup VM', data: { type: 'VM', id: vmUuid } }, async () =>
          new VmBackup({
            getSnapshotNameLabel,
            job,
            // remotes,
            remoteAdapters,
            schedule,
            settings: { ...scheduleSettings, ...settings[vmUuid] },
            srs,
            vm: await this._getRecord('VM', vmUuid),
          }).run()
        ).catch(noop) // errors are handled by logs
      const { concurrency } = scheduleSettings
      await asyncMap(vmIds, concurrency === 0 ? handleVm : limitConcurrency(concurrency)(handleVm))
    })
  }

  @decorateWith(disposable)
  *_getAdapter(remoteId) {
    const adapter = yield this._app.remotes.getAdapter(this._remotes[remoteId])
    return {
      adapter,
      remoteId,
    }
  }

  async _getRecord(type, uuid) {
    const xapiId = this._recordToXapi[uuid]
    const xapi = this._connectedXapis[xapiId]
    if (xapiId === undefined || xapi === undefined) {
      throw new Error('no XAPI associated to ' + uuid)
    }

    return xapi.getRecordByUuid(type, uuid)
  }
}
