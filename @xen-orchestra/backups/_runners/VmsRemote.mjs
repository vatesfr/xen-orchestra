import { asyncMapSettled } from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import { limitConcurrency } from 'limit-concurrency-decorator'

import { extractIdsFromSimplePattern } from '../extractIdsFromSimplePattern.mjs'
import { Task } from '../Task.mjs'
import createStreamThrottle from './_createStreamThrottle.mjs'
import { DEFAULT_SETTINGS, Abstract } from './_Abstract.mjs'
import { getAdaptersByRemote } from './_getAdaptersByRemote.mjs'
import { FullRemote } from './_vmRunners/FullRemote.mjs'
import { IncrementalRemote } from './_vmRunners/IncrementalRemote.mjs'

const noop = Function.prototype

const DEFAULT_REMOTE_VM_SETTINGS = {
  concurrency: 2,
  copyRetention: 0,
  deleteFirst: false,
  exportRetention: 0,
  healthCheckSr: undefined,
  healthCheckVmsWithTags: [],
  healthCheckTimeout: '10m',
  maxExportRate: 0,
  maxMergedDeltasPerRun: Infinity,
  nRetriesVmBackupFailures: 0,
  timeout: 0,
  validateVhdStreams: false,
  vmTimeout: 0,
}

export const VmsRemote = class RemoteVmsBackupRunner extends Abstract {
  _computeBaseSettings(config, job) {
    const baseSettings = { ...DEFAULT_SETTINGS }
    Object.assign(baseSettings, DEFAULT_REMOTE_VM_SETTINGS, config)
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

        const queue = new Set(vmsUuids)
        const taskByVmId = {}
        const nTriesByVmId = {}

        const handleVm = vmUuid => {
          if (nTriesByVmId[vmUuid] === undefined) {
            nTriesByVmId[vmUuid] = 0
          }
          nTriesByVmId[vmUuid]++

          const taskStart = { name: 'backup VM', data: { type: 'VM', id: vmUuid } }
          const vmSettings = { ...settings, ...allSettings[vmUuid] }
          const isLastRun = nTriesByVmId[vmUuid] === vmSettings.nRetriesVmBackupFailures + 1

          const opts = {
            baseSettings,
            config,
            job,
            healthCheckSr,
            remoteAdapters,
            schedule,
            settings: vmSettings,
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

          return sourceRemoteAdapter
            .listVmBackups(vmUuid, ({ mode }) => mode === job.mode)
            .then(vmBackups => {
              // avoiding to create tasks for empty directories
              if (vmBackups.length > 0) {
                if (taskByVmId[vmUuid] === undefined) {
                  taskByVmId[vmUuid] = new Task(taskStart)
                }
                const task = taskByVmId[vmUuid]
                return task
                  .run(async () => {
                    try {
                      const result = await vmBackup.run()
                      task.success(result)
                      return result
                    } catch (error) {
                      if (isLastRun) {
                        throw error
                      } else {
                        Task.warning(`Retry the VM mirror backup due to an error`, {
                          attempt: nTriesByVmId[vmUuid],
                          error: error.message,
                        })
                        queue.add(vmUuid)
                      }
                    }
                  })
                  .catch(noop)
              }
            })
        }
        const { concurrency } = settings
        const _handleVm = !concurrency ? handleVm : limitConcurrency(concurrency)(handleVm)

        while (queue.size > 0) {
          const vmIds = Array.from(queue)
          queue.clear()

          await asyncMapSettled(vmIds, _handleVm)
        }
      }
    )
  }
}
