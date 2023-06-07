'use strict'
const assert = require('node:assert')

const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { mapValues } = require('lodash')
const { Task } = require('../../Task')
const { AbstractRemote } = require('./_AbstractRemote')
const { IncrementalRemoteWriter } = require('../_writers/IncrementalRemoteWriter')
const { forkDeltaExport } = require('./_forkDeltaExport')
const isVhdDifferencingDisk = require('vhd-lib/isVhdDifferencingDisk')
const { asyncEach } = require('@vates/async-each')

class IncrementalRemoteVmBackupRunner extends AbstractRemote {
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
          useChain: false,
        })

        const differentialVhds = {}

        await asyncEach(Object.entries(incrementalExport.streams), async ([key, stream]) => {
          differentialVhds[key] = await isVhdDifferencingDisk(stream)
        })

        incrementalExport.streams = mapValues(incrementalExport.streams, this._throttleStream)
        await this._callWriters(
          writer =>
            writer.transfer({
              deltaExport: forkDeltaExport(incrementalExport),
              differentialVhds,
              timestamp: metadata.timestamp,
              vm: metadata.vm,
              vmSnapshot: metadata.vmSnapshot,
            }),
          'writer.transfer()'
        )
        await this._callWriters(writer => writer.cleanup(), 'writer.cleanup()')
        // for healthcheck
        this._tags = metadata.vm.tags
      }
    } else {
      Task.info('No new data to upload for this VM')
    }
  }
}

exports.IncrementalRemote = IncrementalRemoteVmBackupRunner
decorateMethodsWith(IncrementalRemoteVmBackupRunner, {
  _run: defer,
})
