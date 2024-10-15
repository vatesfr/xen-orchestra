import { asyncMapSettled } from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import { limitConcurrency } from 'limit-concurrency-decorator'
import { Task } from '@vates/task'

import { extractIdsFromSimplePattern } from '../extractIdsFromSimplePattern.mjs'
import createStreamThrottle from './_createStreamThrottle.mjs'
import { DEFAULT_SETTINGS, Abstract } from './_Abstract.mjs'
import { getAdaptersByRemote } from './_getAdaptersByRemote.mjs'
import { IncrementalXapi } from './_vmRunners/IncrementalXapi.mjs'
import { FullXapi } from './_vmRunners/FullXapi.mjs'

const noop = Function.prototype

const DEFAULT_XAPI_VM_SETTINGS = {
  bypassVdiChainsCheck: false,
  cbtDestroySnapshotData: false,
  checkpointSnapshot: false,
  concurrency: 2,
  copyRetention: 0,
  deleteFirst: false,
  diskPerVmConcurrency: 0, // not limited by default
  exportRetention: 0,
  fullInterval: 0,
  healthCheckSr: undefined,
  healthCheckVmsWithTags: [],
  healthCheckTimeout: '10m',
  maxExportRate: 0,
  maxMergedDeltasPerRun: Infinity,
  nRetriesVmBackupFailures: 0,
  offlineBackup: false,
  offlineSnapshot: false,
  snapshotRetention: 0,
  timeout: 0,
  useNbd: false,
  unconditionalSnapshot: false,
  validateVhdStreams: false,
  vmTimeout: 0,
}

export const VmsXapi = class VmsXapiBackupRunner extends Abstract {
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
            Task.run(
              {
                properties: { id, name: 'get SR record', type: 'SR' },
              },
              () => Promise.reject(error)
            ).catch(noop)
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

        const queue = new Set(vmIds)
        const taskByVmId = {}
        const nTriesByVmId = {}

        const handleVm = vmUuid => {
          const getVmTask = () => {
            if (taskByVmId[vmUuid] === undefined) {
              taskByVmId[vmUuid] = new Task(taskStart)
            }
            return taskByVmId[vmUuid]
          }
          const vmBackupFailed = async (error, task) => {
            if (isLastRun) {
              // ending the task with error
              return task.run(() => {
                throw error
              })
            } else {
              // don't end the task
              task.warning(`Retry the VM backup due to an error`, {
                attempt: nTriesByVmId[vmUuid],
                error: error.message,
              })
              queue.add(vmUuid)
            }
          }

          if (nTriesByVmId[vmUuid] === undefined) {
            nTriesByVmId[vmUuid] = 0
          }
          nTriesByVmId[vmUuid]++

          const vmSettings = { ...settings, ...allSettings[vmUuid] }
          const taskStart = { properties: { id: vmUuid, name: 'backup VM', type: 'VM' } }
          const isLastRun = nTriesByVmId[vmUuid] === vmSettings.nRetriesVmBackupFailures + 1

          return this._getRecord('VM', vmUuid).then(
            disposableVm =>
              Disposable.use(disposableVm, async vm => {
                if (taskStart.properties.name_label === undefined) {
                  taskStart.properties.name_label = vm.name_label
                }

                const task = getVmTask()
                // error has to be caught in the taskto prevent in failure, but handled outside the task to execute another task.run()
                let taskError
                return task
                  .runInside(async () => {
                    const opts = {
                      baseSettings,
                      config,
                      getSnapshotNameLabel,
                      healthCheckSr,
                      job,
                      remoteAdapters,
                      schedule,
                      settings: vmSettings,
                      srs,
                      throttleStream,
                      vm,
                    }

                    let vmBackup
                    if (job.mode === 'delta') {
                      vmBackup = new IncrementalXapi(opts)
                    } else {
                      if (job.mode === 'full') {
                        vmBackup = new FullXapi(opts)
                      } else {
                        throw new Error(`Job mode ${job.mode} not implemented`)
                      }
                    }
                    return vmBackup.run().catch(error => {
                      taskError = error
                    })
                  })
                  .then(result => {
                    if (taskError) {
                      // ending the task with error or not ending the task
                      vmBackupFailed(taskError, task)
                    } else {
                      // ending the task with success
                      task.run(() => result)
                    }
                  })
                  .catch(noop) // errors are handled by logs
              }),
            error => vmBackupFailed(error, getVmTask())
          )
        }
        const { concurrency } = settings
        const _handleVm = concurrency === 0 ? handleVm : limitConcurrency(concurrency)(handleVm)

        while (queue.size > 0) {
          const vmIds = Array.from(queue)
          queue.clear()

          await asyncMapSettled(vmIds, _handleVm)
        }
      }
    )
  }
}
