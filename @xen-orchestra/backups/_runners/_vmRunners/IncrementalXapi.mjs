import { asyncEach } from '@vates/async-each'
import { asyncMap } from '@xen-orchestra/async-map'
import { createLogger } from '@xen-orchestra/log'
import { pipeline } from 'node:stream'
import findLast from 'lodash/findLast.js'
import isVhdDifferencingDisk from 'vhd-lib/isVhdDifferencingDisk.js'
import keyBy from 'lodash/keyBy.js'
import mapValues from 'lodash/mapValues.js'
import vhdStreamValidator from 'vhd-lib/vhdStreamValidator.js'

import { AbstractXapi } from './_AbstractXapi.mjs'
import { exportIncrementalVm } from '../../_incrementalVm.mjs'
import { forkDeltaExport } from './_forkDeltaExport.mjs'
import { IncrementalRemoteWriter } from '../_writers/IncrementalRemoteWriter.mjs'
import { IncrementalXapiWriter } from '../_writers/IncrementalXapiWriter.mjs'
import { Task } from '../../Task.mjs'
import { watchStreamSize } from '../../_watchStreamSize.mjs'

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
    const baseVm = this._baseVm
    const vm = this._vm
    const exportedVm = this._exportedVm
    const fullVdisRequired = this._fullVdisRequired

    const isFull = fullVdisRequired === undefined || fullVdisRequired.size !== 0

    await this._callWriters(writer => writer.prepare({ isFull }), 'writer.prepare()')

    const deltaExport = await exportIncrementalVm(exportedVm, baseVm, {
      fullVdisRequired,
      preferNbd: this._settings.preferNbd,
      nbdConcurrency: this._settings.nbdConcurrency,
    })
    // since NBD is network based, if one disk use nbd , all the disk use them
    // except the suspended VDI
    if (Object.values(deltaExport.streams).some(({ _nbd }) => _nbd)) {
      Task.info('Transfer data using NBD')
    }

    const differentialVhds = {}
    // since isVhdDifferencingDisk is reading and unshifting data in stream
    // it should be done BEFORE any other stream transform
    await asyncEach(Object.entries(deltaExport.streams), async ([key, stream]) => {
      differentialVhds[key] = await isVhdDifferencingDisk(stream)
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
          differentialVhds,
          sizeContainers,
          timestamp,
          vm,
          vmSnapshot: exportedVm,
        }),
      'writer.transfer()'
    )

    this._baseVm = exportedVm

    if (baseVm !== undefined) {
      await exportedVm.update_other_config(
        'xo:backup:deltaChainLength',
        String(+(baseVm.other_config['xo:backup:deltaChainLength'] ?? 0) + 1)
      )
    }

    // not the case if offlineBackup
    if (exportedVm.is_a_snapshot) {
      await exportedVm.update_other_config('xo:backup:exported', 'true')
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

    let baseVm = findLast(this._jobSnapshots, _ => 'xo:backup:exported' in _.other_config)
    if (baseVm === undefined) {
      debug('no base VM found')
      return
    }

    const fullInterval = this._settings.fullInterval
    const deltaChainLength = +(baseVm.other_config['xo:backup:deltaChainLength'] ?? 0) + 1
    if (!(fullInterval === 0 || fullInterval > deltaChainLength)) {
      debug('not using base VM becaust fullInterval reached')
      return
    }

    const srcVdis = keyBy(await xapi.getRecords('VDI', await this._vm.$getDisks()), '$ref')

    // resolve full record
    baseVm = await xapi.getRecord('VM', baseVm.$ref)

    const baseUuidToSrcVdi = new Map()
    await asyncMap(await baseVm.$getDisks(), async baseRef => {
      const [baseUuid, snapshotOf] = await Promise.all([
        xapi.getField('VDI', baseRef, 'uuid'),
        xapi.getField('VDI', baseRef, 'snapshot_of'),
      ])
      const srcVdi = srcVdis[snapshotOf]
      if (srcVdi !== undefined) {
        baseUuidToSrcVdi.set(baseUuid, srcVdi)
      } else {
        debug('ignore snapshot VDI because no longer present on VM', {
          vdi: baseUuid,
        })
      }
    })

    const presentBaseVdis = new Map(baseUuidToSrcVdi)
    await this._callWriters(
      writer => presentBaseVdis.size !== 0 && writer.checkBaseVdis(presentBaseVdis, baseVm),
      'writer.checkBaseVdis()',
      false
    )

    if (presentBaseVdis.size === 0) {
      debug('no base VM found')
      return
    }

    const fullVdisRequired = new Set()
    baseUuidToSrcVdi.forEach((srcVdi, baseUuid) => {
      if (presentBaseVdis.has(baseUuid)) {
        debug('found base VDI', {
          base: baseUuid,
          vdi: srcVdi.uuid,
        })
      } else {
        debug('missing base VDI', {
          base: baseUuid,
          vdi: srcVdi.uuid,
        })
        fullVdisRequired.add(srcVdi.uuid)
      }
    })

    this._baseVm = baseVm
    this._fullVdisRequired = fullVdisRequired
  }
}
