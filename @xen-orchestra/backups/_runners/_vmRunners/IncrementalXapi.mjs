import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { pipeline } from 'node:stream'
import { Task } from '@vates/task'
import isVhdDifferencingDisk from 'vhd-lib/isVhdDifferencingDisk.js'
import keyBy from 'lodash/keyBy.js'
import mapValues from 'lodash/mapValues.js'
import vhdStreamValidator from 'vhd-lib/vhdStreamValidator.js'

import { AbstractXapi } from './_AbstractXapi.mjs'
import { exportIncrementalVm } from '../../_incrementalVm.mjs'
import { forkDeltaExport } from './_forkDeltaExport.mjs'
import { IncrementalRemoteWriter } from '../_writers/IncrementalRemoteWriter.mjs'
import { IncrementalXapiWriter } from '../_writers/IncrementalXapiWriter.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'
import {
  DATETIME,
  DELTA_CHAIN_LENGTH,
  EXPORTED_SUCCESSFULLY,
  setVmDeltaChainLength,
  markExportSuccessfull,
} from '../../_otherConfig.mjs'

const { debug } = createLogger('xo:backups:IncrementalXapiVmBackup')
const noop = Function.prototype

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
    // since NBD is network based, if one disk use nbd , all the disk use them
    // except the suspended VDI
    if (Object.values(deltaExport.streams).some(({ _nbd }) => _nbd)) {
      Task.info('Transfer data using NBD')
    }

    const isVhdDifferencing = {}
    // since isVhdDifferencingDisk is reading and unshifting data in stream
    // it should be done BEFORE any other stream transform
    await asyncEach(Object.entries(deltaExport.streams), async ([key, stream]) => {
      isVhdDifferencing[key] = await isVhdDifferencingDisk(stream)
    })
    const sizeContainers = mapValues(deltaExport.streams, stream => watchStreamSize(stream))

    if (this._settings.validateVhdStreams) {
      deltaExport.streams = mapValues(deltaExport.streams, stream => pipeline(stream, vhdStreamValidator, noop))
    }
    deltaExport.streams = mapValues(deltaExport.streams, this._throttleStream)

    const timestamp = Date.now()

    await this._callWriters(
      writer =>
        writer.transfer({
          deltaExport: forkDeltaExport(deltaExport),
          isVhdDifferencing,
          sizeContainers,
          timestamp,
          vm,
          vmSnapshot: exportedVm,
        }),
      'writer.transfer()'
    )

    // we want to control the uuid of the vhd in the chain
    // and ensure they are correctly chained
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

    const size = Object.values(sizeContainers).reduce((sum, { size }) => sum + size, 0)
    const end = Date.now()
    const duration = end - timestamp
    debug('transfer complete', {
      duration,
      speed: duration !== 0 ? (size * 1e3) / 1024 / 1024 / duration : 0,
      size,
    })

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
