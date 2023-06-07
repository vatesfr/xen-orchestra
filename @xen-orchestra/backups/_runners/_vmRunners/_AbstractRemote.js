'use strict'
const { Abstract } = require('./_Abstract')

const { getVmBackupDir } = require('../../_getVmBackupDir')
const { asyncEach } = require('@vates/async-each')
const { Disposable } = require('promise-toolbox')

exports.AbstractRemote = class AbstractRemoteVmBackupRunner extends Abstract {
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
    Object.entries(remoteAdapters).forEach(([remoteId, adapter]) => {
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
    const vmBackups = await this._sourceRemoteAdapter.listVmBackups(this._vmUuid, predicate)
    const localMetada = new Map()
    Object.values(vmBackups).forEach(metadata => {
      const timestamp = metadata.timestamp
      localMetada.set(timestamp, metadata)
    })
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

  async run() {
    const handler = this._sourceRemoteAdapter._handler
    await Disposable.use(await handler.lock(getVmBackupDir(this._vmUuid)), async () => {
      await this._run()
      await this._healthCheck()
    })
  }
}
