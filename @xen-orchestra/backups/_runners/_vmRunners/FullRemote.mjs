import { createLogger } from '@xen-orchestra/log'

import { AbstractRemote } from './_AbstractRemote.mjs'
import { FullRemoteWriter } from '../_writers/FullRemoteWriter.mjs'
import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'
import { AggregatedFullRemoteWriter } from '../_writers/AggregatedFullRemoteWriter.mjs'
import { Task } from '@vates/task'

const { warn } = createLogger('xo:backups:FullRemoteVmBackup')

export const FullRemote = class FullRemoteVmBackupRunner extends AbstractRemote {
  _getRemoteWriters() {
    return [FullRemoteWriter, AggregatedFullRemoteWriter]
  }

  _filterTransferList(transferList) {
    return transferList.filter(this._filterPredicate)
  }

  async _run() {
    const transferList = await this._computeTransferList(({ mode }) => mode === 'full')
    const nbTransferrableVms = transferList.length
    let nbTransferredVms = 0
    for (const metadata of transferList) {
      const stream = this._throttleStream(await this._sourceRemoteAdapter.readFullVmBackup(metadata))
      const sizeContainer = watchStreamSize(stream)
      let checksum
      try {
        // the unencrypted destinations store the same data as the source: no need to compute their checksum again
        checksum = await this._sourceRemoteAdapter.readFullVmBackupChecksum(metadata)
      } catch (error) {
        warn('error while copying reading source checksum, recomputing it', error)
      }

      // a single writer can consume the stream itself: no need to fork it
      const isForked = this._writers.size > 1

      // @todo shouldn't transfer backup if it will be deleted by retention policy (higher retention on source than destination)
      await this._callWriters(
        writer =>
          writer.run({
            checksum,
            stream: isForked ? forkStreamUnpipe(stream) : stream,
            // stream will be forked and transformed, it's not safe to attach additional properties to it
            streamLength: stream.length,
            maxStreamLength: stream.maxStreamLength, // for encrypted destination/source without length
            timestamp: metadata.timestamp,
            vm: metadata.vm,
            vmSnapshot: metadata.vmSnapshot,
            sizeContainer,
          }),
        'writer.run()'
      )
      // for healthcheck
      this._tags = metadata.vm.tags
      nbTransferredVms++
      Task.set('progress', Math.round((nbTransferredVms * 100) / nbTransferrableVms))
    }
    Task.set('progress', 100)
    this._hasTransferredData = transferList.length > 0
  }
}
