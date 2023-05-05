'use strict'

const Disposable = require('promise-toolbox/Disposable')
const pTimeout = require('promise-toolbox/timeout')
const { compileTemplate } = require('@xen-orchestra/template')
const { RemoteTimeoutError } = require('./RemoteTimeoutError.js')
const { runTask } = require('./runTask.js')

exports.DEFAULT_SETTINGS = {
  getRemoteTimeout: 300e3,
  reportWhen: 'failure',
}

exports.AbstractBackupJob = class AbstractBackupJob {
  constructor({ config, getAdapter, getConnectedRecord, job, schedule }) {
    this._config = config
    this._getRecord = getConnectedRecord
    this._job = job
    this._schedule = schedule

    this._getSnapshotNameLabel = compileTemplate(config.snapshotNameLabelTpl, {
      '{job.name}': job.name,
      '{vm.name_label}': vm => vm.name_label,
    })

    const baseSettings = this._computeBaseSettings(config, job)
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
}
