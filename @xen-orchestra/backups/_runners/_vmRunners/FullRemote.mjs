import { AbstractRemote } from './_AbstractRemote.mjs'
import { FullRemoteWriter } from '../_writers/FullRemoteWriter.mjs'
import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'
import { AggregatedFullRemoteWriter } from '../_writers/AggregatedFullRemoteWriter.mjs'
import { Task } from '@vates/task'

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

      // @todo shouldn't transfer backup if it will be deleted by retention policy (higher retention on source than destination)
      await this._callWriters(
        writer =>
          writer.run({
            stream: forkStreamUnpipe(stream),
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
      this._vm = metadata.vm
      nbTransferredVms++
      Task.set('progress', Math.round((nbTransferredVms * 100) / nbTransferrableVms))
    }
    Task.set('progress', 100)
    this._hasTransferredData = transferList.length > 0
  }
}
