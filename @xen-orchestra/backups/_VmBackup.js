'use strict'

const assert = require('assert')
const findLast = require('lodash/findLast.js')
const groupBy = require('lodash/groupBy.js')
const ignoreErrors = require('promise-toolbox/ignoreErrors')
const keyBy = require('lodash/keyBy.js')
const mapValues = require('lodash/mapValues.js')
const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')
const { decorateMethodsWith } = require('@vates/decorate-with')
const { defer } = require('golike-defer')
const { formatDateTime } = require('@xen-orchestra/xapi')

const { DeltaBackupWriter } = require('./writers/DeltaBackupWriter.js')
const { DeltaReplicationWriter } = require('./writers/DeltaReplicationWriter.js')
const { exportDeltaVm } = require('./_deltaVm.js')
const { forkStreamUnpipe } = require('./_forkStreamUnpipe.js')
const { FullBackupWriter } = require('./writers/FullBackupWriter.js')
const { FullReplicationWriter } = require('./writers/FullReplicationWriter.js')
const { getOldEntries } = require('./_getOldEntries.js')
const { Task } = require('./Task.js')
const { watchStreamSize } = require('./_watchStreamSize.js')

const { debug, warn } = createLogger('xo:backups:VmBackup')

class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}

const asyncEach = async (iterable, fn, thisArg = iterable) => {
  for (const item of iterable) {
    await fn.call(thisArg, item)
  }
}

const forkDeltaExport = deltaExport =>
  Object.create(deltaExport, {
    streams: {
      value: mapValues(deltaExport.streams, forkStreamUnpipe),
    },
  })

class VmBackup {
  constructor({
    config,
    getSnapshotNameLabel,
    healthCheckSr,
    job,
    remoteAdapters,
    remotes,
    schedule,
    settings,
    srs,
    throttleStream,
    vm,
  }) {
    if (vm.other_config['xo:backup:job'] === job.id && 'start' in vm.blocked_operations) {
      // don't match replicated VMs created by this very job otherwise they
      // will be replicated again and again
      throw new Error('cannot backup a VM created by this very job')
    }

    this.config = config
    this.job = job
    this.remoteAdapters = remoteAdapters
    this.scheduleId = schedule.id
    this.timestamp = undefined

    // VM currently backed up
    this.vm = vm
    const { tags } = this.vm

    // VM (snapshot) that is really exported
    this.exportedVm = undefined

    this._fullVdisRequired = undefined
    this._getSnapshotNameLabel = getSnapshotNameLabel
    this._isDelta = job.mode === 'delta'
    this._healthCheckSr = healthCheckSr
    this._jobId = job.id
    this._jobSnapshots = undefined
    this._throttleStream = throttleStream
    this._xapi = vm.$xapi

    // Base VM for the export
    this._baseVm = undefined

    // Settings for this specific run (job, schedule, VM)
    if (tags.includes('xo-memory-backup')) {
      settings.checkpointSnapshot = true
    }
    if (tags.includes('xo-offline-backup')) {
      settings.offlineSnapshot = true
    }
    this._settings = settings

    // Create writers
    {
      const writers = new Set()
      this._writers = writers

      const [BackupWriter, ReplicationWriter] = this._isDelta
        ? [DeltaBackupWriter, DeltaReplicationWriter]
        : [FullBackupWriter, FullReplicationWriter]

      const allSettings = job.settings
      Object.keys(remoteAdapters).forEach(remoteId => {
        const targetSettings = {
          ...settings,
          ...allSettings[remoteId],
        }
        if (targetSettings.exportRetention !== 0) {
          writers.add(new BackupWriter({ backup: this, remoteId, settings: targetSettings }))
        }
      })
      srs.forEach(sr => {
        const targetSettings = {
          ...settings,
          ...allSettings[sr.uuid],
        }
        if (targetSettings.copyRetention !== 0) {
          writers.add(new ReplicationWriter({ backup: this, sr, settings: targetSettings }))
        }
      })
    }
  }

  // calls fn for each function, warns of any errors, and throws only if there are no writers left
  async _callWriters(fn, step, parallel = true) {
    const writers = this._writers
    const n = writers.size
    if (n === 0) {
      return
    }

    async function callWriter(writer) {
      const { name } = writer.constructor
      try {
        debug('writer step starting', { step, writer: name })
        await fn(writer)
        debug('writer step succeeded', { duration: step, writer: name })
      } catch (error) {
        writers.delete(writer)

        warn('writer step failed', { error, step, writer: name })

        // these two steps are the only one that are not already in their own sub tasks
        if (step === 'writer.checkBaseVdis()' || step === 'writer.beforeBackup()') {
          Task.warning(
            `the writer ${name} has failed the step ${step} with error ${error.message}. It won't be used anymore in this job execution.`
          )
        }

        throw error
      }
    }
    if (n === 1) {
      const [writer] = writers
      return callWriter(writer)
    }

    const errors = []
    await (parallel ? asyncMap : asyncEach)(writers, async function (writer) {
      try {
        await callWriter(writer)
      } catch (error) {
        errors.push(error)
      }
    })
    if (writers.size === 0) {
      throw new AggregateError(errors, 'all targets have failed, step: ' + step)
    }
  }

  // ensure the VM itself does not have any backup metadata which would be
  // copied on manual snapshots and interfere with the backup jobs
  async _cleanMetadata() {
    const { vm } = this
    if ('xo:backup:job' in vm.other_config) {
      await vm.update_other_config({
        'xo:backup:datetime': null,
        'xo:backup:deltaChainLength': null,
        'xo:backup:exported': null,
        'xo:backup:job': null,
        'xo:backup:schedule': null,
        'xo:backup:vm': null,
      })
    }
  }

  async _snapshot() {
    const { vm } = this
    const xapi = this._xapi

    const settings = this._settings

    const doSnapshot =
      settings.unconditionalSnapshot ||
      this._isDelta ||
      (!settings.offlineBackup && vm.power_state === 'Running') ||
      settings.snapshotRetention !== 0
    if (doSnapshot) {
      await Task.run({ name: 'snapshot' }, async () => {
        if (!settings.bypassVdiChainsCheck) {
          await vm.$assertHealthyVdiChains()
        }

        const snapshotRef = await vm[settings.checkpointSnapshot ? '$checkpoint' : '$snapshot']({
          ignoreNobakVdis: true,
          name_label: this._getSnapshotNameLabel(vm),
          unplugVusbs: true,
        })
        this.timestamp = Date.now()

        await xapi.setFieldEntries('VM', snapshotRef, 'other_config', {
          'xo:backup:datetime': formatDateTime(this.timestamp),
          'xo:backup:job': this._jobId,
          'xo:backup:schedule': this.scheduleId,
          'xo:backup:vm': vm.uuid,
        })

        this.exportedVm = await xapi.getRecord('VM', snapshotRef)

        return this.exportedVm.uuid
      })
    } else {
      this.exportedVm = vm
      this.timestamp = Date.now()
    }
  }

  async _copyDelta() {
    const { exportedVm } = this
    const baseVm = this._baseVm
    const fullVdisRequired = this._fullVdisRequired

    const isFull = fullVdisRequired === undefined || fullVdisRequired.size !== 0

    await this._callWriters(writer => writer.prepare({ isFull }), 'writer.prepare()')

    const deltaExport = await exportDeltaVm(exportedVm, baseVm, {
      fullVdisRequired,
    })
    // since NBD is network based, if one disk use nbd , all the disk use them
    // except the suspended VDI
    if (Object.values(deltaExport.streams).some(({ _nbd }) => _nbd)) {
      Task.info('Transfer data using NBD')
    }
    const sizeContainers = mapValues(deltaExport.streams, stream => watchStreamSize(stream))
    deltaExport.streams = mapValues(deltaExport.streams, this._throttleStream)

    const timestamp = Date.now()

    await this._callWriters(
      writer =>
        writer.transfer({
          deltaExport: forkDeltaExport(deltaExport),
          sizeContainers,
          timestamp,
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

  async _copyFull() {
    const { compression } = this.job
    const stream = this._throttleStream(
      await this._xapi.VM_export(this.exportedVm.$ref, {
        compress: Boolean(compression) && (compression === 'native' ? 'gzip' : 'zstd'),
        useSnapshot: false,
      })
    )
    const sizeContainer = watchStreamSize(stream)

    const timestamp = Date.now()

    await this._callWriters(
      writer =>
        writer.run({
          sizeContainer,
          stream: forkStreamUnpipe(stream),
          timestamp,
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

  async _fetchJobSnapshots() {
    const jobId = this._jobId
    const vmRef = this.vm.$ref
    const xapi = this._xapi

    const snapshotsRef = await xapi.getField('VM', vmRef, 'snapshots')
    const snapshotsOtherConfig = await asyncMap(snapshotsRef, ref => xapi.getField('VM', ref, 'other_config'))

    const snapshots = []
    snapshotsOtherConfig.forEach((other_config, i) => {
      if (other_config['xo:backup:job'] === jobId) {
        snapshots.push({ other_config, $ref: snapshotsRef[i] })
      }
    })
    snapshots.sort((a, b) => (a.other_config['xo:backup:datetime'] < b.other_config['xo:backup:datetime'] ? -1 : 1))
    this._jobSnapshots = snapshots
  }

  async _removeUnusedSnapshots() {
    const allSettings = this.job.settings
    const baseSettings = this._baseSettings
    const baseVmRef = this._baseVm?.$ref

    const snapshotsPerSchedule = groupBy(this._jobSnapshots, _ => _.other_config['xo:backup:schedule'])
    const xapi = this._xapi
    await asyncMap(Object.entries(snapshotsPerSchedule), ([scheduleId, snapshots]) => {
      const settings = {
        ...baseSettings,
        ...allSettings[scheduleId],
        ...allSettings[this.vm.uuid],
      }
      return asyncMap(getOldEntries(settings.snapshotRetention, snapshots), ({ $ref }) => {
        if ($ref !== baseVmRef) {
          return xapi.VM_destroy($ref)
        }
      })
    })
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

    this._baseVm = baseVm
    this._fullVdisRequired = fullVdisRequired
  }

  async _healthCheck() {
    const settings = this._settings

    if (this._healthCheckSr === undefined) {
      return
    }

    // check if current VM has tags
    const { tags } = this.vm
    const intersect = settings.healthCheckVmsWithTags.some(t => tags.includes(t))

    if (settings.healthCheckVmsWithTags.length !== 0 && !intersect) {
      return
    }

    await this._callWriters(writer => writer.healthCheck(this._healthCheckSr), 'writer.healthCheck()')
  }

  async run($defer) {
    const settings = this._settings
    assert(
      !settings.offlineBackup || settings.snapshotRetention === 0,
      'offlineBackup is not compatible with snapshotRetention'
    )

    await this._callWriters(async writer => {
      await writer.beforeBackup()
      $defer(async () => {
        await writer.afterBackup()
      })
    }, 'writer.beforeBackup()')

    await this._fetchJobSnapshots()

    if (this._isDelta) {
      await this._selectBaseVm()
    }

    await this._cleanMetadata()
    await this._removeUnusedSnapshots()

    const { vm } = this
    const isRunning = vm.power_state === 'Running'
    const startAfter = isRunning && (settings.offlineBackup ? 'backup' : settings.offlineSnapshot && 'snapshot')
    if (startAfter) {
      await vm.$callAsync('clean_shutdown')
    }

    try {
      await this._snapshot()
      if (startAfter === 'snapshot') {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      if (this._writers.size !== 0) {
        await (this._isDelta ? this._copyDelta() : this._copyFull())
      }
    } finally {
      if (startAfter) {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      await this._fetchJobSnapshots()
      await this._removeUnusedSnapshots()
    }
    await this._healthCheck()
  }
}
exports.VmBackup = VmBackup

decorateMethodsWith(VmBackup, {
  run: defer,
})
