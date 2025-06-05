import groupBy from 'lodash/groupBy.js'

import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { Disposable } from 'promise-toolbox'
import { createPredicate } from 'value-matcher'

import { getVmBackupDir } from '../../_getVmBackupDir.mjs'

import { Abstract } from './_Abstract.mjs'
import { extractIdsFromSimplePattern } from '../../extractIdsFromSimplePattern.mjs'
import { Task } from '../../Task.mjs'

export const AbstractRemote = class AbstractRemoteVmBackupRunner extends Abstract {
  _filterPredicate
  constructor({
    config,
    job,
    healthCheckSr,
    remoteAdapters,
    schedule,
    settings,
    sourceRemoteAdapter,
    throttleGenerator,
    vmUuid,
  }) {
    super()
    this.config = config
    this.job = job
    this.remoteAdapters = remoteAdapters
    this._settings = settings
    this.scheduleId = schedule.id
    this.timestamp = undefined

    this._healthCheckSr = healthCheckSr
    this._sourceRemoteAdapter = sourceRemoteAdapter
    this._throttleGenerator = throttleGenerator
    this._vmUuid = vmUuid

    const allSettings = job.settings
    const writers = new Set()
    this._writers = writers

    const RemoteWriter = this._getRemoteWriter()
    extractIdsFromSimplePattern(job.remotes).forEach(remoteId => {
      const adapter = remoteAdapters[remoteId]
      const targetSettings = {
        ...settings,
        ...allSettings[remoteId],
      }
      writers.add(
        new RemoteWriter({
          adapter,
          config,
          healthCheckSr,
          job,
          scheduleId: schedule.id,
          vmUuid,
          remoteId,
          settings: targetSettings,
        })
      )
    })
    const { filter } = job
    if (filter === undefined) {
      this._filterPredicate = () => true
    } else {
      this._filterPredicate = createPredicate(filter)
    }
  }

  async #computeTransferListPerJob(sourceBackups, remotesBackups) {
    const localMetada = new Map()
    sourceBackups.forEach(metadata => {
      const timestamp = metadata.timestamp
      localMetada.set(timestamp, metadata)
    })
    const nbRemotes = remotesBackups.length
    const remoteMetadatas = {}
    remotesBackups.forEach(async remoteBackups => {
      remoteBackups.forEach(metadata => {
        const timestamp = metadata.timestamp
        remoteMetadatas[timestamp] = (remoteMetadatas[timestamp] ?? 0) + 1
      })
    })

    let transferList = []
    const timestamps = [...localMetada.keys()]
    timestamps.sort()
    for (const timestamp of timestamps) {
      if (remoteMetadatas[timestamp] !== nbRemotes) {
        // this backup is not present in all the remote
        // should be retransferred if not found later
        transferList.push(localMetada.get(timestamp))
      } else {
        // backup is present in local and remote : the chain has already been transferred
        transferList = []
      }
    }
    if (transferList.length > 0) {
      const filteredTransferList = this._filterTransferList(transferList)
      if (filteredTransferList.length > 0) {
        return filteredTransferList
      } else {
        Task.info('This VM is excluded by the job filter')
        return []
      }
    } else {
      Task.info('No new data to upload for this VM')
    }

    return []
  }

  /**
   *
   * @param {*} vmPredicate a callback checking if backup is eligible for transfer. This filter MUST NOT cut delta chains
   * @returns
   */
  async _computeTransferList(vmPredicate) {
    const sourceBackups = Object.values(await this._sourceRemoteAdapter.listVmBackups(this._vmUuid, vmPredicate))
    const remotesBackups = await Promise.all(
      Object.values(this.remoteAdapters).map(remoteAdapter => remoteAdapter.listVmBackups(this._vmUuid, vmPredicate))
    )
    const sourceBackupByJobId = groupBy(sourceBackups, 'jobId')
    const transferByJobs = await Promise.all(
      Object.values(sourceBackupByJobId).map(vmBackupsByJob =>
        this.#computeTransferListPerJob(vmBackupsByJob, remotesBackups)
      )
    )
    return transferByJobs.flat(1)
  }

  async run($defer) {
    const handler = this._sourceRemoteAdapter._handler
    await Disposable.use(await handler.lock(getVmBackupDir(this._vmUuid)), async () => {
      await this._callWriters(async writer => {
        await writer.beforeBackup()
        $defer(async () => {
          await writer.afterBackup()
        })
      }, 'writer.beforeBackup()')
      await this._run()
      await this._healthCheck()
    })
  }
}

decorateMethodsWith(AbstractRemote, {
  run: defer,
})
