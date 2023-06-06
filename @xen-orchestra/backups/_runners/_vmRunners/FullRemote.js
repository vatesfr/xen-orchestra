'use strict'

const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { AbstractRemote } = require('./_AbstractRemote')
const { FullRemoteWriter } = require('../_writers/FullRemoteWriter')
const { forkStreamUnpipe } = require('../_forkStreamUnpipe')
const { watchStreamSize } = require('../../_watchStreamSize')
const { Task } = require('../../Task')

class FullRemoteVmBackupRunner extends AbstractRemote {
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
    if (transferList.length > 0) {
      for (const metadata of transferList) {
        const stream = await this._sourceRemoteAdapter.readFullVmBackup(metadata)
        const sizeContainer = watchStreamSize(stream)

        // @todo shouldn't transfer backup if it will be deleted by retention policy (higher retention on source than destination)
        await this._callWriters(
          writer =>
            writer.run({
              stream: forkStreamUnpipe(stream),
              timestamp: metadata.timestamp,
              vm: metadata.vm,
              vmSnapshot: metadata.vmSnapshot,
              sizeContainer,
            }),
          'writer.run()'
        )
        // for healthcheck
        this._tags = metadata.vm.tags
      }
    } else {
      Task.info('No new data to upload for this VM')
    }
  }
}

exports.FullRemote = FullRemoteVmBackupRunner
decorateMethodsWith(FullRemoteVmBackupRunner, {
  _run: defer,
})
