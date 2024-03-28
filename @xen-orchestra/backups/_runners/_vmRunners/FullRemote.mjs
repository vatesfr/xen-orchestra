import { AbstractRemote } from './_AbstractRemote.mjs'
import { FullRemoteWriter } from '../_writers/FullRemoteWriter.mjs'
import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'
import { Task } from '../../Task.mjs'

export const FullRemote = class FullRemoteVmBackupRunner extends AbstractRemote {
  _getRemoteWriter() {
    return FullRemoteWriter
  }
  async _run() {
    const transferList = await this._computeTransferList(({ mode }) => mode === 'full')

    if (transferList.length > 0) {
      for (const metadata of transferList) {
        const stream = await this._sourceRemoteAdapter.readFullVmBackup(metadata)
        const sizeContainer = watchStreamSize(stream)

        // @todo shouldn't transfer backup if it will be deleted by retention policy (higher retention on source than destination)
        await this._callWriters(
          writer =>
            writer.run({
              stream: forkStreamUnpipe(stream),
              // stream will be forked and transformed, it's not safe to attach additionnal properties to it
              streamLength: stream.length,
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
