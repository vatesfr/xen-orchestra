import groupBy from 'lodash/groupBy.js'

import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { Disposable } from 'promise-toolbox'
import { createPredicate } from 'value-matcher'
import { Task } from '@vates/task'

import { getVmBackupDir } from '../../_getVmBackupDir.mjs'

import { Abstract } from './_Abstract.mjs'
import { extractIdsFromSimplePattern } from '../../extractIdsFromSimplePattern.mjs'

export const AbstractRemote = class AbstractRemoteVmBackupRunner extends Abstract {
  _filterPredicate
  _hasTransferredData

  constructor({
    config,
    job,
    healthCheckSr,
    remoteAdapters,
    schedule,
    settings,
    sourceRemoteAdapter,
    throttleGenerator,
    throttleStream,
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
    this._throttleStream = throttleStream
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
    const localMetadata = new Map()
    sourceBackups.forEach(metadata => {
      const timestamp = metadata.timestamp
      localMetadata.set(timestamp, metadata)
    })
    const nbRemotes = remotesBackups.length
    const remoteMetadata = {}
    remotesBackups.forEach(async remoteBackups => {
      remoteBackups.forEach(metadata => {
        const timestamp = metadata.timestamp
        remoteMetadata[timestamp] = (remoteMetadata[timestamp] ?? 0) + 1
      })
    })

    let transferList = []
    const timestamps = [...localMetadata.keys()]
    timestamps.sort()
    for (const timestamp of timestamps) {
      if (remoteMetadata[timestamp] !== nbRemotes) {
        // this backup is not present in all the remote
        // should be retransferred if not found later
        transferList.push(localMetadata.get(timestamp))
      } else {
        // backup is present in local and remote : the chain has already been transferred
        transferList = []
      }
    }
    if (transferList.length > 0) {
      const filteredTransferList = this._filterTransferList(transferList)
      return { transferList: filteredTransferList, filtered: true }
    } else {
      return { transferList, filtered: false }
    }
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
    const transferObjectsList = await Promise.all(
      Object.values(sourceBackupByJobId).map(vmBackupsByJob =>
        this.#computeTransferListPerJob(vmBackupsByJob, remotesBackups)
      )
    )
    const transferList = transferObjectsList.map(transferObject => transferObject.transferList).flat(1)
    if (transferList.length === 0 && Object.values(sourceBackupByJobId).length > 0) {
      if (transferObjectsList.some(transferObject => transferObject.filtered)) {
        // Happens if any job transfer list wasn't empty before filter and is empty after filter.
        Task.info('This VM is excluded by the job filter')
      } else {
        Task.info('No new data to upload for this VM')
      }
    }
    return transferList
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

      if (this._hasTransferredData === undefined) {
        throw new Error('Missing tag to check there are some transferred data')
      }

      if (this._hasTransferredData) {
        await this._healthCheck()
      } else {
        Task.info(`No healthCheck needed because no data was transferred.`)
      }
    })
  }
}

decorateMethodsWith(AbstractRemote, {
  run: defer,
})
