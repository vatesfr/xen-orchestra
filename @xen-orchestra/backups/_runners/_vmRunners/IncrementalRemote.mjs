import { createLogger } from '@xen-orchestra/log'

import { asyncEach } from '@vates/async-each'
import assert from 'node:assert'
import * as UUID from 'uuid'
import isVhdDifferencingDisk from 'vhd-lib/isVhdDifferencingDisk.js'
import mapValues from 'lodash/mapValues.js'

import { AbstractRemote } from './_AbstractRemote.mjs'
import { forkDeltaExport } from './_forkDeltaExport.mjs'
import { IncrementalRemoteWriter } from '../_writers/IncrementalRemoteWriter.mjs'
import { Disposable } from 'promise-toolbox'
import { openVhd } from 'vhd-lib'
import { getVmBackupDir } from '../../_getVmBackupDir.mjs'

const { warn } = createLogger('xo:backups:Incrementalremote')
class IncrementalRemoteVmBackupRunner extends AbstractRemote {
  _getRemoteWriter() {
    return IncrementalRemoteWriter
  }

  // we'll transfer the full list if at least one backup should be transfered
  // to ensure we don't cut the delta chain
  _filterTransferList(transferList) {
    if (transferList.some(vmBackupMetadata => this._filterPredicate(vmBackupMetadata))) {
      return transferList
    }
    return []
  }

  async _selectBaseVm(metadata) {
    // for each disk , get the parent
    const baseUuidToSrcVdi = new Map()

    // no previous backup for a base( =key) backup
    if (metadata.isBase) {
      return
    }
    await asyncEach(Object.entries(metadata.vdis), async ([id, vdi]) => {
      const isDifferencing = metadata.isVhdDifferencing[`${id}.vhd`]
      if (isDifferencing) {
        const vmDir = getVmBackupDir(metadata.vm.uuid)
        const path = `${vmDir}/${metadata.vhds[id]}`
        // don't catch error : we can't recover if the source vhd are missing
        await Disposable.use(openVhd(this._sourceRemoteAdapter._handler, path), vhd => {
          baseUuidToSrcVdi.set(UUID.stringify(vhd.header.parentUuid), vdi.$snapshot_of$uuid)
        })
      }
    })

    const presentBaseVdis = new Map(baseUuidToSrcVdi)
    await this._callWriters(
      writer => presentBaseVdis.size !== 0 && writer.checkBaseVdis(presentBaseVdis),
      'writer.checkBaseVdis()',
      false
    )
    // check if the parent vdi are present in all the remotes
    baseUuidToSrcVdi.forEach((srcVdiUuid, baseUuid) => {
      if (!presentBaseVdis.has(baseUuid)) {
        throw new Error(`Missing vdi ${baseUuid} which is a base for a delta`)
      }
    })
    // yeah , let's go
  }
  async _run() {
    const transferList = await this._computeTransferList(({ mode }) => mode === 'delta')

    for (const metadata of transferList) {
      assert.strictEqual(metadata.mode, 'delta')
      const incrementalExport = await this._sourceRemoteAdapter.readIncrementalVmBackup(metadata, undefined, {
        useChain: false,
      })
      // don't trust metadata too much
      // recompute if it's a base backup
      // recompute if disks are differencing or not
      const isVhdDifferencing = {}

      await asyncEach(Object.entries(incrementalExport.streams), async ([key, stream]) => {
        isVhdDifferencing[key] = await isVhdDifferencingDisk(stream)
      })
      const hasDifferencingDisk = Object.values(isVhdDifferencing).includes(true)
      if (metadata.isBase === hasDifferencingDisk) {
        warn(`Metadata isBase and real disk value are different`, {
          metadataIsBae: metadata.isBase,
          diskIsBase: !hasDifferencingDisk,
          isVhdDifferencing,
        })
      }
      metadata.isBase = !hasDifferencingDisk
      metadata.isVhdDifferencing = isVhdDifferencing
      await this._selectBaseVm(metadata)
      await this._callWriters(writer => writer.prepare({ isBase: metadata.isBase }), 'writer.prepare()')

      incrementalExport.streams = mapValues(incrementalExport.streams, this._throttleStream)
      await this._callWriters(
        writer =>
          writer.transfer({
            deltaExport: forkDeltaExport(incrementalExport),
            isVhdDifferencing,
            timestamp: metadata.timestamp,
            vm: metadata.vm,
            vmSnapshot: metadata.vmSnapshot,
          }),
        'writer.transfer()'
      )
      // this will update parent name with the needed alias
      await this._callWriters(
        writer =>
          writer.updateUuidAndChain({
            isVhdDifferencing,
            timestamp: metadata.timestamp,
            vdis: incrementalExport.vdis,
          }),
        'writer.updateUuidAndChain()'
      )

      await this._callWriters(writer => writer.cleanup(), 'writer.cleanup()')
      // for healthcheck
      this._tags = metadata.vm.tags
    }
  }
}

export const IncrementalRemote = IncrementalRemoteVmBackupRunner
