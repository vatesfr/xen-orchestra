import { asyncMapSettled } from '@xen-orchestra/async-map'
import Disposable from 'promise-toolbox/Disposable'
import { limitConcurrency } from 'limit-concurrency-decorator'

import { extractIdsFromSimplePattern } from '../extractIdsFromSimplePattern.mjs'
import { Task } from '../Task.mjs'
import createStreamThrottle from './_createStreamThrottle.mjs'
import { DEFAULT_SETTINGS, Abstract } from './_Abstract.mjs'
import { runTask } from './_runTask.mjs'
import { getAdaptersByRemote } from './_getAdaptersByRemote.mjs'
import { IncrementalXapi } from './_vmRunners/IncrementalXapi.mjs'
import { FullXapi } from './_vmRunners/FullXapi.mjs'

const DEFAULT_XAPI_VM_SETTINGS = {
  bypassVdiChainsCheck: false,
  checkpointSnapshot: false,
  concurrency: 2,
  copyRetention: 0,
  deleteFirst: false,
  diskPerVmConcurrency: 0, // not limited by default
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

          const task = new Task(taskStart)
          let nbRun = 0
 
          console.log('runonce', vmUuid)
          // ensure all the eecution are run in the same task 
          const runOnce = async ()=> {
            nbRun ++
            console.log('Will run backup ', vmUuid, nbRun) 
 
            return   this._getRecord('VM', vmUuid).then(
              disposableVm => Disposable.use(disposableVm, async vm => {
              taskStart.data.name_label = vm.name_label
              const opts = {
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

              const res = await  vmBackup.run() 
              console.log('    backup run successfully ', vmUuid, res)
              return res
            })) 
          }
          // ensure the same task is reused
          return task.wrapFn(runOnce)
    

        } 

        let toHandle = []
        console.log('prepare to run ')
        for(const vmUuid of vmIds){
          // prepare a collection of task to bound task to run 
          toHandle.push( handleVm(vmUuid))
        }
        console.log({toHandle})

        for(let i=0; i < 4 && toHandle.length >0; i++){
          console.log('RUN ', i)
          const currentRun = [...toHandle]
          toHandle = []
          await asyncMapSettled(currentRun, async fn=>{
            console.log('got fn ', fn)
            try{
              await fn()
              console.log('run done')
            }catch(error){
              console.log('will retry ')
              toHandle.push(fn)
            }
          })
        }
        const { concurrency } = settings
        if(toHandle.length > 0){
          console.log('LAST RUN  ')
          // last run will really fail this time
          await asyncMapSettled(toHandle, fn=>fn())

        }

      }
    )
  }
}
