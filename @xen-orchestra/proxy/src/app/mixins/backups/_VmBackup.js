import assert from 'assert'
import eos from 'end-of-stream'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import { createLogger } from '@xen-orchestra/log'
import { formatDateTime } from '@xen-orchestra/xapi'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'
import { PassThrough } from 'stream'
import { watchStreamSize } from '@xen-orchestra/backups/watchStreamSize'

import { DisasterRecoveryWriter } from './_DisasterRecoveryWriter'
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
    assert.strictEqual(job.mode, 'full')

    this.job = job
    this.remoteHandlers = remoteHandlers
    this.remotes = remotes
    this.scheduleId = schedule.id
    this.sourceVm = undefined
    this.srs = srs
    this.timestamp = undefined
    this.vm = vm

    this._getSnapshotNameLabel = getSnapshotNameLabel
    this._isDelta = false
    this._jobId = job.id
    this._settings = settings
  }

  // ensure the VM itself does not have any backup metadata which would be
  // copied on manual snapshots and interfere with the backup jobs
  async _cleanMetadata() {
    const { vm } = this
    // debug('clean metadata', { vm })

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

    const isRunning = vm.power_state === 'Running'
    const settings = this._settings

    const doSnapshot = isRunning || settings.snapshotRetention !== 0
    if (doSnapshot) {
      // debug('snapshot', { vm })

      if (!settings.bypassVdiChainsCheck) {
        await vm.$assertHealthyVdiChains()
      }

      const snapshotRef = await vm.$snapshot(this._getSnapshotNameLabel(vm))
      this.timestamp = Date.now()

      await vm.$xapi.setFieldEntries('VM', snapshotRef, 'other_config', {
        'xo:backup:datetime': formatDateTime(this.timestamp),
        'xo:backup:job': this._jobId,
        'xo:backup:schedule': this.scheduleId,
        'xo:backup:vm': vm.uuid,
      })

      this.sourceVm = await vm.$xapi.getRecord('VM', snapshotRef)
    } else {
      this.sourceVm = vm
      this.timestamp = Date.now()
    }
  }

  async _copyFull() {
    const { _settings: settings, job, vm } = this
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
    const stream = await vm.$xapi.VM_export(this.sourceVm.$ref, {
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

    return sizeContainer.size
  }

  async _removeUnusedSnapshots() {
    const { $ref: vmRef, $xapi: xapi } = this.vm
    const { scheduleId } = this

    const snapshotsRef = await xapi.getField('VM', vmRef, 'snapshots')
    const snapshotsOtherConfig = await Promise.all(
      snapshotsRef.map(ref => xapi.getField('VM', ref, 'other_config'))
    )

    const scheduleSnapshots = []
    snapshotsOtherConfig.forEach((other_config, i) => {
      if (other_config['xo:backup:schedule'] === scheduleId) {
        scheduleSnapshots.push({ other_config, $ref: snapshotsRef[i] })
      }
    })
    scheduleSnapshots.sort((a, b) =>
      a.other_config['xo:backup:datetime'] <
      b.other_config['xo:backup:datetime']
        ? -1
        : 1
    )

    assert.strictEqual(
      this.job.mode,
      'full',
      'TODO: dont destroy base snapshot'
    )

    // TODO: handle all schedules (no longer existing schedules default to 0 retention)

    await Promise.all(
      getOldEntries(
        this._settings.snapshotRetention,
        scheduleSnapshots
      ).map(_ => xapi.VM_destroy(_.$ref))
    )
  }

  async run() {
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

      return { transferredSize: await this._copyFull() }
    } finally {
      if (startAfter) {
        ignoreErrors.call(vm.$callAsync('start', false, false))
      }

      await this._removeUnusedSnapshots()
    }
  }
}
