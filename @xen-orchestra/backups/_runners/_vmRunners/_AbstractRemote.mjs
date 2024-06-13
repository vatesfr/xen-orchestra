import { asyncEach } from '@vates/async-each'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { Disposable } from 'promise-toolbox'
import { createPredicate } from 'value-matcher'

import { getVmBackupDir } from '../../_getVmBackupDir.mjs'

import { Abstract } from './_Abstract.mjs'
import { extractIdsFromSimplePattern } from '../../extractIdsFromSimplePattern.mjs'

export const AbstractRemote = class AbstractRemoteVmBackupRunner extends Abstract {
  constructor({
    config,
    job,
    healthCheckSr,
    remoteAdapters,
    schedule,
    settings,
    sourceRemoteAdapter,
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
  }

  async _computeTransferList(vmPredicate) {
    const vmBackups = Object.values(await this._sourceRemoteAdapter.listVmBackups(this._vmUuid, vmPredicate))
    const localMetada = new Map()
    vmBackups.forEach(metadata => {
      const timestamp = metadata.timestamp
      localMetada.set(timestamp, metadata)
    })
    const nbRemotes = Object.keys(this.remoteAdapters).length
    const remoteMetadatas = {}
    await asyncEach(Object.values(this.remoteAdapters), async remoteAdapter => {
      const remoteMetadata = await remoteAdapter.listVmBackups(this._vmUuid, vmPredicate)
      remoteMetadata.forEach(metadata => {
        const timestamp = metadata.timestamp
        remoteMetadatas[timestamp] = (remoteMetadatas[timestamp] ?? 0) + 1
      })
    })

    let transferList = []
    const timestamps = [...localMetada.keys()]
    timestamps.sort()
    for (const timestamp of timestamps) {
      if (remoteMetadatas[timestamp] !== nbRemotes) {
        // this backup is not present in all the remotes
        transferList.push(localMetada.get(timestamp))
      } else {
        // backup is present in local and remote : the chain has already been transferred
        transferList = []
      }
    }

    // to ensure that no delta chain is broken, the full list of backups are transfered
    // even if only one match teh filter
    if (transferList.some(vmBackupMetadata => this._shouldTransferBackup(vmBackupMetadata))) {
      return transferList
    }
    return []
  }

  /**
   * check if users want to mirror this vm backup
   *
   * @param {Object} vmBackupMetadata
   * @returns Boolean
   */
  _shouldTransferBackup(vmBackupMetadata) {
    const { filter } = this.job
    if (filter === undefined) {
      return true
    }
    const predicate = createPredicate(filter)
    return predicate(vmBackupMetadata)
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
