import eos from 'end-of-stream'
import findLast from 'lodash/findLast'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import mapValues from 'lodash/mapValues'
import { createLogger } from '@xen-orchestra/log'
import { formatDateTime } from '@xen-orchestra/xapi'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'
import { PassThrough } from 'stream'
import { watchStreamSize } from '@xen-orchestra/backups/watchStreamSize'

import { ContinuousReplicationWriter } from './_ContinuousReplicationWriter'
import { DeltaBackupWriter } from './_DeltaBackupWriter'
import { DisasterRecoveryWriter } from './_DisasterRecoveryWriter'
import { exportDeltaVm } from './_deltaVm'
import { FullBackupWriter } from './_FullBackupWriter'

const { debug, warn } = createLogger('xo:proxy:backups:VmBackup')

// create a new readable stream from an existing one which may be piped later
//
// in case of error in the new readable stream, it will simply be unpiped
// from the original one
const forkStreamUnpipe = stream => {
  const proxy = new PassThrough()
  stream.pipe(proxy)
  eos(stream, error => {
    if (error !== undefined) {
      proxy.destroy(error)
    }
  })
  eos(proxy, _ => {
    stream.unpipe(proxy)
  })
  return proxy
}

const forkDeltaExport = deltaExport =>
  Object.create(deltaExport, {
    streams: {
      value: mapValues(deltaExport.streams, forkStreamUnpipe),
    },
  })

export class VmBackup {
  constructor({
    getSnapshotNameLabel,
    job,
    remotes,
    remoteHandlers,
    schedule,
    settings,
    srs,
    vm,
  }) {
    this.job = job
    this.remoteHandlers = remoteHandlers
    this.remotes = remotes
    this.scheduleId = schedule.id
    this.srs = srs
    this.timestamp = undefined

    // VM currently backed up
    this.vm = vm

    // VM (snapshot) that is really exported
    this.exportedVm = undefined

    this._getSnapshotNameLabel = getSnapshotNameLabel
    this._isDelta = job.mode === 'delta'
    this._jobId = job.id
    this._jobSnapshots = undefined
    this._xapi = vm.$xapi

    // Base VM for the export
    this._baseVm = undefined

    // Settings for this specific run (job, schedule, VM)
    this._settings = settings
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
      this._isDelta ||
      vm.power_state === 'Running' ||
      settings.snapshotRetention !== 0
    if (doSnapshot) {
      if (!settings.bypassVdiChainsCheck) {
        await vm.$assertHealthyVdiChains()
      }

      const snapshotRef = await vm.$snapshot(this._getSnapshotNameLabel(vm))
      this.timestamp = Date.now()

      await xapi.setFieldEntries('VM', snapshotRef, 'other_config', {
        'xo:backup:datetime': formatDateTime(this.timestamp),
        'xo:backup:job': this._jobId,
        'xo:backup:schedule': this.scheduleId,
        'xo:backup:vm': vm.uuid,
      })

      this.exportedVm = await xapi.getRecord('VM', snapshotRef)
    } else {
      this.exportedVm = vm
      this.timestamp = Date.now()
    }
  }

  async _copyDelta() {
    const { _settings: settings, job, vm } = this
    const allSettings = job.settings

    const writers = []
    Object.keys(this.remoteHandlers).forEach(remoteId => {
      const targetSettings = {
        ...settings,
        ...allSettings[remoteId],
      }
      if (targetSettings.exportRetention !== 0) {
        writers.push(new DeltaBackupWriter(this, remoteId, targetSettings))
      }
    })
    this.srs.forEach(sr => {
      const targetSettings = {
        ...settings,
        ...allSettings[sr.uuid],
      }
      if (targetSettings.copyRetention !== 0) {
        writers.push(new ContinuousReplicationWriter(this, sr, targetSettings))
      }
    })

    if (writers.length === 0) {
      return
    }

    const baseVm = this._baseVm
    const { exportedVm } = this
    const deltaExport = await exportDeltaVm(exportedVm, baseVm)
    const sizeContainers = mapValues(deltaExport.streams, watchStreamSize)

    const timestamp = Date.now()

    await Promise.all(
      writers.map(async writer => {
        try {
          await writer.run({
            deltaExport: forkDeltaExport(deltaExport),
            sizeContainers,
            timestamp,
          })
        } catch (error) {
          warn('copy failure', {
            error,
            target: writer.target,
            vm,
          })
        }
      })
    )

    this._baseVm = exportedVm

    // not the case if offlineBackup
    if (exportedVm.is_a_snapshot) {
      await exportedVm.update_other_config('xo:backup:exported', 'true')
    }

    const size = Object.values(sizeContainers).reduce(
      (sum, { size }) => sum + size,
      0
    )
    const end = Date.now()
    const duration = end - timestamp
    debug('transfer complete', {
      duration,
      speed: duration !== 0 ? (size * 1e3) / 1024 / 1024 / duration : 0,
      size,
    })

    return size
  }

  async _copyFull() {
    const { _settings: settings, _xapi: xapi, job, vm } = this
    const allSettings = job.settings

    const writers = []
    Object.keys(this.remoteHandlers).forEach(remoteId => {
      const targetSettings = {
        ...settings,
        ...allSettings[remoteId],
      }
      if (targetSettings.exportRetention !== 0) {
        writers.push(new FullBackupWriter(this, remoteId, targetSettings))
      }
    })
    this.srs.forEach(sr => {
      const targetSettings = {
        ...settings,
        ...allSettings[sr.uuid],
      }
      if (targetSettings.copyRetention !== 0) {
        writers.push(new DisasterRecoveryWriter(this, sr, targetSettings))
      }
    })

    if (writers.length === 0) {
      return
    }

    const { compression } = job
    const stream = await xapi.VM_export(this.exportedVm.$ref, {
      compress:
        Boolean(compression) && (compression === 'native' ? 'gzip' : 'zstd'),
      useSnapshot: false,
    })
    const sizeContainer = watchStreamSize(stream)

    const timestamp = Date.now()

    await Promise.all(
      writers.map(async writer => {
        try {
          await writer.run({
            sizeContainer,
            stream: forkStreamUnpipe(stream),
            timestamp,
          })
        } catch (error) {
          warn('copy failure', {
            error,
            target: writer.target,
            vm,
          })
        }
      })
    )

    const { size } = sizeContainer
    const end = Date.now()
    const duration = end - timestamp
    debug('transfer complete', {
      duration,
      speed: duration !== 0 ? (size * 1e3) / 1024 / 1024 / duration : 0,
      size,
    })

    return size
  }

  async _fetchJobSnapshots() {
    const jobId = this._jobId
    const vmRef = this.vm.$ref
    const xapi = this._xapi

    const snapshotsRef = await xapi.getField('VM', vmRef, 'snapshots')
    const snapshotsOtherConfig = await Promise.all(
      snapshotsRef.map(ref => xapi.getField('VM', ref, 'other_config'))
    )

    const snapshots = []
    snapshotsOtherConfig.forEach((other_config, i) => {
      if (other_config['xo:backup:job'] === jobId) {
        snapshots.push({ other_config, $ref: snapshotsRef[i] })
      }
    })
    snapshots.sort((a, b) =>
      a.other_config['xo:backup:datetime'] <
      b.other_config['xo:backup:datetime']
        ? -1
        : 1
    )
    this._jobSnapshots = snapshots
  }

  async _removeUnusedSnapshots() {
    // TODO: handle all schedules (no longer existing schedules default to 0 retention)

    const { scheduleId } = this
    const scheduleSnapshots = this._jobSnapshots.filter(
      _ => _.other_config['xo:backup:schedule'] === scheduleId
    )

    const baseVmRef = this._baseVm?.$ref
    const xapi = this._xapi
    await Promise.all(
      getOldEntries(this._settings.snapshotRetention, scheduleSnapshots).map(
        ({ $ref }) => {
          if ($ref !== baseVmRef) {
            return xapi.VM_destroy($ref)
          }
        }
      )
    )
  }

  async _selectBaseVm() {
    const baseVm = findLast(
      this._jobSnapshots,
      _ => 'xo:backup:exported' in _.other_config
    )
    if (baseVm !== undefined) {
      const deltaChainLength =
        (baseVm.other_config['xo:backup:deltaChainLength'] ?? 0) + 1

      const fullInterval = this._settings.fullInterval
      if (fullInterval === 0 || fullInterval > deltaChainLength) {
        // resolve to full object
        this._baseVm = await this._xapi.getRecord('VM', baseVm.$ref)
      }
    }

    // TODO: check whether baseVm is available on targets
  }

  async run() {
    await this._fetchJobSnapshots()

    if (this._isDelta) {
      await this._selectBaseVm()
    }

    await this._cleanMetadata()
    await this._removeUnusedSnapshots()

    const { _settings: settings, vm } = this
    const isRunning = vm.power_state === 'Running'
    const startAfter =
      isRunning &&
      (settings.offlineBackup
        ? 'backup'
        : settings.offlineSnapshot && 'snapshot')
    if (startAfter) {
      await vm.$callAsync('clean_shutdown')
    }

    try {
      await this._snapshot()
      if (startAfter === 'snapshot') {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      return {
        transferredSize: await (this._isDelta
          ? this._copyDelta()
          : this._copyFull()),
      }
    } finally {
      if (startAfter) {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      await this._fetchJobSnapshots()
      await this._removeUnusedSnapshots()
    }
  }
}
