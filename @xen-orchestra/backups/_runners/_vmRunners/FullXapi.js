'use strict'

const { createLogger } = require('@xen-orchestra/log')

const { forkStreamUnpipe } = require('../_forkStreamUnpipe.js')
const { FullRemoteWriter } = require('../_writers/FullRemoteWriter.js')
const { FullXapiWriter } = require('../_writers/FullXapiWriter.js')
const { watchStreamSize } = require('../../_watchStreamSize.js')
const { AbstractXapi } = require('./_AbstractXapi.js')

const { debug } = createLogger('xo:backups:FullXapiVmBackup')

exports.FullXapi = class FullXapiVmBackupRunner extends AbstractXapi {
  _getWriters() {
    return [FullRemoteWriter, FullXapiWriter]
  }

  _mustDoSnapshot() {
    const { vm } = this

    const settings = this._settings
    return (
      settings.unconditionalSnapshot ||
      (!settings.offlineBackup && vm.power_state === 'Running') ||
      settings.snapshotRetention !== 0
    )
  }
  _selectBaseVm() {}

  async _copy() {
    const { compression } = this.job
    const stream = this._throttleStream(
      await this._xapi.VM_export(this.exportedVm.$ref, {
        compress: Boolean(compression) && (compression === 'native' ? 'gzip' : 'zstd'),
        useSnapshot: false,
      })
    )
    const sizeContainer = watchStreamSize(stream)

    const timestamp = Date.now()

    await this._callWriters(
      writer =>
        writer.run({
          sizeContainer,
          stream: forkStreamUnpipe(stream),
          timestamp,
        }),
      'writer.run()'
    )

    const { size } = sizeContainer
    const end = Date.now()
    const duration = end - timestamp
    debug('transfer complete', {
      duration,
      speed: duration !== 0 ? (size * 1e3) / 1024 / 1024 / duration : 0,
      size,
    })
  }
}
