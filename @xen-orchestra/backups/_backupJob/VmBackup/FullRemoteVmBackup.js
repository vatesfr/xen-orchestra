'use strict'

const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { AbstractRemoteVmBackup } = require('./AbstractRemoteVmBackup')
const { FullRemoteWriter } = require('./writers/FullRemoteWriter')
const { forkStreamUnpipe } = require('../forkStreamUnpipe')

const FullRemoteVmBackup = class FullRemoteVmBackup extends AbstractRemoteVmBackup {
  _getRemoteWriter() {
    return FullRemoteWriter
  }
  async _run($defer) {
    const transferList = await this._computeTransferList(({ mode }) => mode === 'full')

    await this._callWriters(async writer => {
      await writer.beforeBackup()
      $defer(async () => {
        await writer.afterBackup()
      })
    }, 'writer.beforeBackup()')

    for (const metadata of transferList) {
      const stream = await this._sourceRemoteAdapter.readFullVmBackup(metadata)
      // @todo should skip if backup is already there (success on only one remote)
      await this._callWriters(
        writer =>
          writer.run({
            stream: forkStreamUnpipe(stream),
            timestamp: metadata.timestamp,
            vm: metadata.vm,
            vmSnapshot: metadata.vmSnapshot,
          }),
        'writer.run()'
      )
    }
  }
}

exports.FullRemoteVmBackup = FullRemoteVmBackup
decorateMethodsWith(FullRemoteVmBackup, {
  _run: defer,
})
