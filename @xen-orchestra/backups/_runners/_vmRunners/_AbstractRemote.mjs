import { asyncEach } from '@vates/async-each'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { Disposable } from 'promise-toolbox'

import { getVmBackupDir } from '../../_getVmBackupDir.mjs'

import { Abstract } from './_Abstract.mjs'
import { extractIdsFromSimplePattern } from '../../extractIdsFromSimplePattern.mjs'
import { Task } from '../../Task.mjs'

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

  async _computeTransferList(predicate) {
    const vmBackups = Object.values(await this._sourceRemoteAdapter.listVmBackups(this._vmUuid, predicate))
    const localMetada = new Map()
    vmBackups
      .filter(metadata => this._shouldTransferVmBackup(metadata))
      .forEach(metadata => {
        const timestamp = metadata.timestamp
        localMetada.set(timestamp, metadata)
      })
    if (localMetada.size === 0 && vmBackups.length > 0) {
      Task.info('none of the backups passed the filter')
    }
    const nbRemotes = Object.keys(this.remoteAdapters).length
    const remoteMetadatas = {}
    await asyncEach(Object.values(this.remoteAdapters), async remoteAdapter => {
      const remoteMetadata = await remoteAdapter.listVmBackups(this._vmUuid, predicate)
      remoteMetadata.forEach(metadata => {
        const timestamp = metadata.timestamp
        remoteMetadatas[timestamp] = (remoteMetadatas[timestamp] ?? 0) + 1
      })
    })

    let chain = []
    const timestamps = [...localMetada.keys()]
    timestamps.sort()
    for (const timestamp of timestamps) {
      if (remoteMetadatas[timestamp] !== nbRemotes) {
        // this backup is not present in all the remote
        // should be retransfered if not found later
        chain.push(localMetada.get(timestamp))
      } else {
        // backup is present in local and remote : the chain has already been transferred
        chain = []
      }
    }
    return chain
  }

  async _shouldTransferVmBackup(vmBackupMetadata) {
    const { filterJobId } = this._settings
    const { jobId } = vmBackupMetadata
    // filtering by jobId ensure we transfer a full chain of backups
    // we'll need to make synthetic vhd of backup if we move to a filter
    // that may keep only a part of a vhd chain (for example by schedule, by tags)
    return filterJobId === undefined || filterJobId === jobId
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
