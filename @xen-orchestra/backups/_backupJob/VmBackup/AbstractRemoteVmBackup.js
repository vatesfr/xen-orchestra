'use strict'
const { AbstractVmBackup } = require('./AbstractVmBackup')
const { getVmBackupDir } = require('../../_getVmBackupDir')

const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
class AbstractRemoteVmBackup extends AbstractVmBackup {
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

    // the vm object is used in writers
    // remoteWriter only need vm.uuid
    // @todo : how to do better ?
    // missing tags for healthcheck
    this.vm = { uuid: vmUuid }

    this._healthCheckSr = healthCheckSr
    this._sourceRemoteAdapter = sourceRemoteAdapter
    this._throttleStream = throttleStream

    const allSettings = job.settings
    const writers = new Set()
    this._writers = writers

    const RemoteWriter = this._getRemoteWriter()
    Object.keys(remoteAdapters).forEach(remoteId => {
      const targetSettings = {
        ...settings,
        ...allSettings[remoteId],
      }
      if (targetSettings.exportRetention !== 0) {
        writers.add(new RemoteWriter({ backup: this, remoteId, settings: targetSettings }))
      }
    })
  }

  async _computeTransferList(predicate) {
    const vmBackups = await this._sourceRemoteAdapter.listVmBackups(this.vm.uuid, predicate)

    const localMetada = {}
    Object.values(vmBackups).forEach(metadata => {
      const timestamp = metadata.timestamp
      localMetada[timestamp] = metadata
    })
    const nbRemotes = Object.keys(this.remoteAdapters).length
    const remoteMetadatas = {}
    await Promise.all(
      Object.values(this.remoteAdapters).map(async remoteAdapter => {
        const remoteMetadata = await remoteAdapter.listVmBackups(this.vm.uuid, predicate)
        remoteMetadata.forEach(metadata => {
          const timestamp = metadata.timestamp
          remoteMetadatas[timestamp] = (remoteMetadatas[timestamp] ?? 0) + 1
        })
      })
    )

    let chain = []
    for (const timestamp in localMetada) {
      if (remoteMetadatas[timestamp] !== nbRemotes) {
        // this backup is not present in all the remote
        // should be retransfered if not found later
        chain.push(localMetada[timestamp])
      } else {
        // backup is present in local and remote : the chain has already been transferred
        chain = []
      }
    }

    return chain
  }

  async run($defer) {
    const handler = this._sourceRemoteAdapter._handler
    const sourceLock = await handler.lock(getVmBackupDir(this.vm.uuid))
    $defer(async () => {
      sourceLock.dispose()
    })
    await this._run()
  }
}

exports.AbstractRemoteVmBackup = AbstractRemoteVmBackup
decorateMethodsWith(AbstractRemoteVmBackup, {
  run: defer,
})
