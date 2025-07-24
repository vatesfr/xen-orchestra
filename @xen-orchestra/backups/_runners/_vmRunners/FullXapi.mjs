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

  async _mustDoSnapshot() {
    const vm = this._vm
    const vdis = await this._xapi.getRecords('VDI', await vm.$getDisks())
    const hasNOBAKtag = vdis.some(idx => idx.name_label.includes('[NOBAK]'))
    const settings = this._settings

    // General setting forcing snapshot at all times
    if (settings.unconditionalSnapshot) {
      return true
    }

    // If offline backup option is not checked
    // and vm is running, we make a snapshot
    if (!settings.offlineBackup && vm.power_state === 'Running') {
      return true
    }

    // General setting used for snapshot retention
    // see schedule in backupJob edition
    if (settings.snapshotRetention !== 0) {
      return true
    }

    // if there is a disk with NOBAK tag
    // we need to make a snapshot
    if (hasNOBAKtag) {
      return true
    }
  }
  _selectBaseVm() {}

  async _copy() {
    const { compression } = this.job
    const vm = this._vm
    const exportedVm = this._exportedVm
    // @todo put back throttle for full backup/Replication
    const stream =
      /* this._throttleStream( */
      (
        await this._xapi.VM_export(exportedVm.$ref, {
          compress: Boolean(compression) && (compression === 'native' ? 'gzip' : 'zstd'),
          useSnapshot: false,
        })
      ).body
    /* ) */

    const vdis = await exportedVm.$getDisks()
    let maxStreamLength = 1024 * 1024 // Ovf file and tar headers are a few KB, let's stay safe
    for (const vdiRef of vdis) {
      const vdi = await this._xapi.getRecord('VDI', vdiRef)

      // the size a of fully allocated vdi will be virtual_size exactly, it's a gross over evaluation
      // of the real stream size in general, since a disk is never completely full
      // vdi.physical_size seems to underevaluate a lot the real disk usage of a VDI, as of 2023-10-30
      maxStreamLength += vdi.virtual_size
    }

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
