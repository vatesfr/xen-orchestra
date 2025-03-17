import { createLogger } from '@xen-orchestra/log'
import keyBy from 'lodash/keyBy.js'

import { AbstractXapi } from './_AbstractXapi.mjs'
import { exportIncrementalVm } from '../../_incrementalVm.mjs'
import { IncrementalRemoteWriter } from '../_writers/IncrementalRemoteWriter.mjs'
import { IncrementalXapiWriter } from '../_writers/IncrementalXapiWriter.mjs'
import {
  DATETIME,
  DELTA_CHAIN_LENGTH,
  EXPORTED_SUCCESSFULLY,
  setVmDeltaChainLength,
  markExportSuccessfull,
} from '../../_otherConfig.mjs'
import { SynchronizedDisk } from '@xen-orchestra/disk-transform'

const { debug } = createLogger('xo:backups:IncrementalXapiVmBackup')

export const IncrementalXapi = class IncrementalXapiVmBackupRunner extends AbstractXapi {
  _getWriters() {
    return [IncrementalRemoteWriter, IncrementalXapiWriter]
  }

  _mustDoSnapshot() {
    return true
  }

  async _copy() {
    const baseVdis = this._baseVdis
    const vm = this._vm
    const exportedVm = this._exportedVm

    const isFull = Object.values(baseVdis).length === 0 || Object.values(baseVdis).some(_ => !_)
    await this._callWriters(writer => writer.prepare({ isFull }), 'writer.prepare()')

    const deltaExport = await exportIncrementalVm(exportedVm, baseVdis, {
      nbdConcurrency: this._settings.nbdConcurrency,
      preferNbd: this._settings.preferNbd,
    })

    const isVhdDifferencing = {}
    for (const key in deltaExport.disks) {
      const disk = deltaExport.disks[key]
      isVhdDifferencing[key] = disk.isDifferencing()
      deltaExport.disks[key] = new SynchronizedDisk(disk)
    }

    function fork(deltaExport, label) {
      const { disks, ...forked } = deltaExport
      forked.disks = {}
      for (const key in disks) {
        forked.disks[key] = disks[key].fork(label)
      }
      return forked
    }

    // @todo : reimplement throttle,nbsource: d use
    const timestamp = Date.now()
    await this._callWriters(
      writer =>
        writer.transfer({
          deltaExport: fork(deltaExport, writer.constructor.name + ' ' + Math.random()),
          isVhdDifferencing,
          timestamp,
          vm,
          vmSnapshot: exportedVm,
        }),
      'writer.transfer()'
    )
    await this._callWriters(
      writer =>
        writer.updateUuidAndChain({
          isVhdDifferencing,
          timestamp,
          vdis: deltaExport.vdis,
        }),
      'writer.updateUuidAndChain()'
    )

    if (isFull) {
      await setVmDeltaChainLength(this._xapi, exportedVm.$ref, 0)
    } else {
      await setVmDeltaChainLength(this._xapi, exportedVm.$ref, (this._deltaChainLength ?? 0) + 1)
    }

    // not the case if offlineBackup
    if (exportedVm.is_a_snapshot) {
      await markExportSuccessfull(this._xapi, exportedVm.$ref)
    }

    await this._callWriters(writer => writer.cleanup(), 'writer.cleanup()')
  }

  async _selectBaseVm() {
    const xapi = this._xapi

    // filter _jobSnapshotVdis to have only the last successfully exported vdi
    // compute delta chain length
    // fill baseUuidToSrcVdi with this data

    const exportedVdis = this._jobSnapshotVdis.filter(
      _ => EXPORTED_SUCCESSFULLY in _.other_config && DATETIME in _.other_config
    )
    let lastSuccessfullBackup
    let lastExportedVdis = []
    for (const exportedVdi of exportedVdis) {
      if (lastSuccessfullBackup === undefined || lastSuccessfullBackup < exportedVdi.other_config[DATETIME]) {
        lastExportedVdis = []
        lastSuccessfullBackup = exportedVdi.other_config[DATETIME]
      }
      if (lastSuccessfullBackup === exportedVdi.other_config[DATETIME]) {
        lastExportedVdis.push(exportedVdi)
      }
    }

    this._baseVdis = {}
    if (lastExportedVdis.length === 0) {
      debug('no base VDIS found', {
        jobLength: this._jobSnapshotVdis.length,
        lastSuccessfullBackup,
        exportedLength: exportedVdis.length,
      })
      return
    }
    const deltaChainLength = Math.max(
      ...lastExportedVdis.map(({ other_config }) => Number(other_config[DELTA_CHAIN_LENGTH] ?? 0))
    )
    const fullInterval = this._settings.fullInterval
    if (fullInterval !== 0 && fullInterval <= deltaChainLength + 1) {
      debug('not using base VM because fullInterval reached', {
        fullInterval,
        deltaChainLength,
        eq: fullInterval < deltaChainLength + 1,
        dc1: deltaChainLength + 1,
      })
      return
    }

    const srcVdis = keyBy(await xapi.getRecords('VDI', await this._vm.$getDisks()), '$ref')

    const baseUuidToSrcVdiUuid = new Map()
    for (const lastExportedVdi of lastExportedVdis) {
      const baseUuid = lastExportedVdi.uuid
      const snapshotOf = lastExportedVdi.snapshot_of
      const srcVdi = srcVdis[snapshotOf]
      if (srcVdi !== undefined) {
        baseUuidToSrcVdiUuid.set(baseUuid, srcVdi.uuid)
      } else {
        debug('ignore snapshot VDI because no longer present on VM', {
          vdi: baseUuid,
        })
      }
    }

    const presentBaseVdis = new Map(baseUuidToSrcVdiUuid)
    await this._callWriters(
      writer => presentBaseVdis.size !== 0 && writer.checkBaseVdis(presentBaseVdis),
      'writer.checkBaseVdis()',
      false
    )

    if (presentBaseVdis.size === 0) {
      debug('no base VM found')
      return
    }
    baseUuidToSrcVdiUuid.forEach((srcVdiUuid, baseUuid) => {
      if (presentBaseVdis.has(baseUuid)) {
        debug('found base VDI', {
          base: baseUuid,
          vdi: srcVdiUuid,
        })
        this._baseVdis[srcVdiUuid] = lastExportedVdis.find(vdi => vdi.uuid === baseUuid)
      } else {
        debug('missing base VDI', {
          base: baseUuid,
          vdi: srcVdiUuid,
        })
        // this will force a full for this vdi
        this._baseVdis[srcVdiUuid] = undefined
      }
    })
    this._deltaChainLength = deltaChainLength
  }
}
