'use strict'

const findLast = require('lodash/findLast.js')
const keyBy = require('lodash/keyBy.js')
const mapValues = require('lodash/mapValues.js')
const vhdStreamValidator = require('vhd-lib/vhdStreamValidator.js')
const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')
const { pipeline } = require('node:stream')

const { exportIncrementalVm } = require('../../_incrementalVm.js')
const { forkStreamUnpipe } = require('../forkStreamUnpipe.js')
const { Task } = require('../../Task.js')
const { watchStreamSize } = require('../../_watchStreamSize.js')

const { IncrementalRemoteWriter } = require('./writers/IncrementalRemoteWriter.js')
const { IncrementalXapiWriter } = require('./writers/IncrementalXapiWriter.js')
const { AbstractXapiVmBackup } = require('./AbstractXapiVMBackup.js')

const { debug } = createLogger('xo:backups:VmBackup')

const forkDeltaExport = deltaExport =>
  Object.create(deltaExport, {
    streams: {
      value: mapValues(deltaExport.streams, forkStreamUnpipe),
    },
  })
const noop = Function.prototype

class IncrementalXapiVmBackup extends AbstractXapiVmBackup {
  _getWriters() {
    return [IncrementalRemoteWriter, IncrementalXapiWriter]
  }

  _mustDoSnapshot() {
    return true
  }

  async _copy() {
    const { exportedVm } = this
    const vmComparisonBasis = this._vmComparisonBasis
    const fullVdisRequired = this._fullVdisRequired

    const isBase = fullVdisRequired === undefined || fullVdisRequired.size !== 0

    await this._callWriters(writer => writer.prepare({ isBase }), 'writer.prepare()')

    const incrementalExport = await exportIncrementalVm(exportedVm, vmComparisonBasis, {
      fullVdisRequired,
    })
    // since NBD is network based, if one disk use nbd , all the disk use them
    // except the suspended VDI
    if (Object.values(incrementalExport.streams).some(({ _nbd }) => _nbd)) {
      Task.info('Transfer data using NBD')
    }
    const sizeContainers = mapValues(incrementalExport.streams, stream => watchStreamSize(stream))

    if (this._settings.validateVhdStreams) {
      incrementalExport.streams = mapValues(incrementalExport.streams, stream =>
        pipeline(stream, vhdStreamValidator, noop)
      )
    }

    incrementalExport.streams = mapValues(incrementalExport.streams, this._throttleStream)

    const timestamp = Date.now()

    await this._callWriters(
      writer =>
        writer.transfer({
          deltaExport: forkDeltaExport(incrementalExport),
          sizeContainers,
          timestamp,
        }),
      'writer.transfer()'
    )

    this._vmComparisonBasis = exportedVm

    if (vmComparisonBasis !== undefined) {
      await exportedVm.update_other_config(
        'xo:backup:deltaChainLength',
        String(+(vmComparisonBasis.other_config['xo:backup:deltaChainLength'] ?? 0) + 1)
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
      debug('not using base VM because fullInterval reached')
      return
    }

    const srcVdis = keyBy(await xapi.getRecords('VDI', await this.vm.$getDisks()), '$ref')

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

    this._vmComparisonBasis = baseVm
    this._fullVdisRequired = fullVdisRequired
  }
}
exports.IncrementalXapiVmBackup = IncrementalXapiVmBackup
