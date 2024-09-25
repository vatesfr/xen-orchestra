import Disposable from 'promise-toolbox/Disposable'
import pTimeout from 'promise-toolbox/timeout'
import { compileTemplate } from '@xen-orchestra/template'
import { RemoteTimeoutError } from './_RemoteTimeoutError.mjs'
import { Task } from '@vates/task'

const noop = Function.prototype

export const DEFAULT_SETTINGS = {
  getRemoteTimeout: 300e3,
  reportWhen: 'failure',
}

export const Abstract = class AbstractRunner {
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
        Task.run(
          {
            properties: {
              id: remoteId,
              name: 'get remote adapter',
              type: 'remote',
            },
          },
          () => Promise.reject(error)
        ).catch(noop)
      }
    }
  }
}
