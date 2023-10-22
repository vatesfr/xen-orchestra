import { createLogger } from '@xen-orchestra/log'

import { forkStreamUnpipe } from '../_forkStreamUnpipe.mjs'
import { FullRemoteWriter } from '../_writers/FullRemoteWriter.mjs'
import { FullXapiWriter } from '../_writers/FullXapiWriter.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'
import { AbstractXapi } from './_AbstractXapi.mjs'

const { debug } = createLogger('xo:backups:FullXapiVmBackup')

export const FullXapi = class FullXapiVmBackupRunner extends AbstractXapi {
  _getWriters() {
    return [FullRemoteWriter, FullXapiWriter]
  }

  _mustDoSnapshot() {
    const vm = this._vm

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
    const vm = this._vm
    const exportedVm = this._exportedVm
    const stream = this._throttleStream(
      await this._xapi.VM_export(exportedVm.$ref, {
        compress: Boolean(compression) && (compression === 'native' ? 'gzip' : 'zstd'),
        useSnapshot: false,
      })
    )

    const vdis = await exportedVm.$getDisks()
    let maxStreamLength = 1024 * 1024 // Ovf file and tar headers are a few KB, let's stay safe
    vdis.forEach(vdiRef => {
      const vdi = this._xapi.getObject(vdiRef)
      maxStreamLength += vdi.physical_utilisation ?? 0 // at most the xva will take the physical usage of the disk
      // it can be smaller due to the smaller block size for xva than vhd, and compression of xcp-ng
    })

    const sizeContainer = watchStreamSize(stream)

    const timestamp = Date.now()
    await this._callWriters(
      writer =>
        writer.run({
          maxStreamLength,
          sizeContainer,
          stream: forkStreamUnpipe(stream),
          timestamp,
          vm,
          vmSnapshot: exportedVm,
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
