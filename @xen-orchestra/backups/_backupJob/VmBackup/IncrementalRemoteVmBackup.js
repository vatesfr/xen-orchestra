'use strict'
const assert = require('node:assert')

const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { AbstractRemoteVmBackup } = require('./AbstractRemoteVmBackup')
const { mapValues } = require('lodash')
const { IncrementalRemoteWriter } = require('./writers/IncrementalRemoteWriter')
const { forkStreamUnpipe } = require('../forkStreamUnpipe')
const { Task } = require('../../Task')

const forkDeltaExport = deltaExport =>
  Object.create(deltaExport, {
    streams: {
      value: mapValues(deltaExport.streams, forkStreamUnpipe),
    },
  })

class IncrementalRemoteVmBackup extends AbstractRemoteVmBackup {
  _getRemoteWriter() {
    return IncrementalRemoteWriter
  }
  async _run($defer) {
    const transferList = await this._computeTransferList(({ mode }) => mode === 'delta')
    await this._callWriters(async writer => {
      await writer.beforeBackup()
      $defer(async () => {
        await writer.afterBackup()
      })
    }, 'writer.beforeBackup()')

    if (transferList.length > 0) {
      for (const metadata of transferList) {
        assert.strictEqual(metadata.mode, 'delta')

        await this._callWriters(writer => writer.prepare({ isBase: metadata.isBase }), 'writer.prepare()')
        const incrementalExport = await this._sourceRemoteAdapter.readIncrementalVmBackup(metadata, undefined, {
          useSynthetic: false,
        })

        incrementalExport.streams = mapValues(incrementalExport.streams, this._throttleStream)
        await this._callWriters(
          writer =>
            writer.transfer({
              deltaExport: forkDeltaExport(incrementalExport),
              timestamp: metadata.timestamp,
            }),
          'writer.transfer()'
        )
        await this._callWriters(writer => writer.cleanup(), 'writer.cleanup()')
      }
      this._healthCheck()
    } else {
      Task.info('No new data to upload for this VM')
    }
  }
}

exports.IncrementalRemoteVmBackup = IncrementalRemoteVmBackup
decorateMethodsWith(IncrementalRemoteVmBackup, {
  _run: defer,
})
