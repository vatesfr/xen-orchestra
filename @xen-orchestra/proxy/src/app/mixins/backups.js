import assert from 'assert'
import asyncMap from '@xen-orchestra/async-map'
import eos from 'end-of-stream'
import fromCallback from 'promise-toolbox/fromCallback'
import ignoreErrors from 'promise-toolbox/ignoreErrors'
import limitConcurrency from 'limit-concurrency-decorator'
import pump from 'pump'
import { basename, dirname, resolve } from 'path'
import { compileTemplate } from '@xen-orchestra/template'
import { createLogger } from '@xen-orchestra/log'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern'
import { formatDateTime, Xapi } from '@xen-orchestra/xapi'
import { formatFilenameDate } from '@xen-orchestra/backups/filenameDate'
import { getHandler } from '@xen-orchestra/fs'
import { getOldEntries } from '@xen-orchestra/backups/getOldEntries'
import { isValidXva } from '@xen-orchestra/backups/isValidXva'
import { PassThrough } from 'stream'
import { watchStreamSize } from '@xen-orchestra/backups/watchStreamSize'

const { debug, warn } = createLogger('xo:proxy:backups')

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

const BACKUP_DIR = 'xo-vm-backups'
const getVmBackupDir = uuid => `${BACKUP_DIR}/${uuid}`

const getReplicatedVmDatetime = vm => {
  const {
    'xo:backup:datetime': datetime = vm.name_label.slice(-17, -1),
  } = vm.other_config
  return datetime
}
const compareReplicatedVmDatetime = (a, b) =>
  getReplicatedVmDatetime(a) < getReplicatedVmDatetime(b) ? -1 : 1
const listReplicatedVms = (xapi, scheduleOrJobId, srUuid, vmUuid) => {
  const { all } = xapi.objects
  const vms = {}
  for (const key in all) {
    const object = all[key]
    const oc = object.other_config
    if (
      object.$type === 'VM' &&
      !object.is_a_snapshot &&
      !object.is_a_template &&
      'start' in object.blocked_operations &&
      (oc['xo:backup:job'] === scheduleOrJobId ||
        oc['xo:backup:schedule'] === scheduleOrJobId) &&
      oc['xo:backup:sr'] === srUuid &&
      (oc['xo:backup:vm'] === vmUuid ||
        // 2018-03-28, JFT: to catch VMs replicated before this fix
        oc['xo:backup:vm'] === undefined)
    ) {
      vms[object.$id] = object
    }
  }

  return Object.values(vms).sort(compareReplicatedVmDatetime)
}

const compareTimestamp = (a, b) => a.timestamp - b.timestamp
const isMetadataFile = filename => filename.endsWith('.json')
const resolveRelativeFromFile = (file, path) =>
  resolve('/', dirname(file), path).slice(1)

const noop = Function.prototype

class RemoteAdapter {
  constructor(handler) {
    this._handler = handler
  }

  async deleteFullVmBackups(backups) {
    const handler = this._handler
    await asyncMap(backups, ({ _filename, xva }) =>
      Promise.all([
        handler.unlink(_filename),
        handler.unlink(resolveRelativeFromFile(_filename, xva)),
      ])
    )
  }

  async listVmBackups(backupDir, predicate) {
    const handler = this._handler
    const backups = []

    try {
      const files = await handler.list(backupDir)
      await Promise.all(
        files.filter(isMetadataFile).map(async file => {
          const path = `${backupDir}/${file}`
          try {
            const metadata = JSON.parse(String(await handler.readFile(path)))
            // if (metadata.mode === 'full') {
            //   metadata.size = await timeout
            //     .call(
            //       handler.getSize(resolveRelativeFromFile(path, metadata.xva)),
            //       parseDuration(this._backupOptions.vmBackupSizeTimeout)
            //     )
            //     .catch(err => {
            //       warn(`listVmBackups, getSize`, { err })
            //     })
            // }
            if (predicate === undefined || predicate(metadata)) {
              Object.defineProperty(metadata, '_filename', {
                value: path,
              })
              backups.push(metadata)
            }
          } catch (error) {
            warn(`listVmBackups ${path}`, { error })
          }
        })
      )
    } catch (error) {
      let code
      if (
        error == null ||
        ((code = error.code) !== 'ENOENT' && code !== 'ENOTDIR')
      ) {
        throw error
      }
    }

    return backups.sort(compareTimestamp)
  }

  async outputStream(input, path, { checksum = true, validator = noop } = {}) {
    const handler = this._handler
    input = await input
    const tmpPath = `${dirname(path)}/.${basename(path)}`
    const output = await handler.createOutputStream(tmpPath, { checksum })
    try {
      await Promise.all([
        fromCallback(pump, input, output),
        output.checksumWritten,
        input.task,
      ])
      await validator(tmpPath)
      await handler.rename(tmpPath, path, { checksum })
    } catch (error) {
      await handler.unlink(tmpPath, { checksum })
      throw error
    }
  }
}

class FullBackupWriter {
  constructor(backup, remoteId, settings) {
    this._backup = backup
    this._remoteId = remoteId
    this._settings = settings
  }

  async run({ timestamp, stream }) {
    const backup = this._backup
    const remoteId = this._remoteId
    const settings = this._settings

    const handler = backup.remoteHandlers[remoteId]
    const { job, scheduleId, vm } = backup

    const adapter = new RemoteAdapter(handler)
    const backupDir = getVmBackupDir(vm.uuid)

    // TODO: clean VM backup directory

    const oldBackups = getOldEntries(
      settings.exportRetention - 1,
      await adapter.listVmBackups(
        backupDir,
        _ => _.mode === 'full' && _.scheduleId === scheduleId
      )
    )
    const deleteOldBackups = () => adapter.deleteFullVmBackups(oldBackups)

    const basename = formatFilenameDate(timestamp)

    const dataBasename = basename + '.xva'
    const dataFilename = backupDir + '/' + dataBasename

    const metadataFilename = `${backupDir}/${basename}.json`
    const metadataContent = JSON.stringify({
      jobId: job.id,
      mode: job.mode,
      scheduleId,
      timestamp,
      version: '2.0.0',
      vm,
      vmSnapshot: this.sourceVm,
      xva: './' + dataBasename,
    })

    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }

    await adapter.outputStream(forkStreamUnpipe(stream), dataFilename, {
      validator: tmpPath => {
        if (handler._getFilePath !== undefined) {
          return isValidXva(handler._getFilePath('/' + tmpPath))
        }
      },
    })
    await handler.outputFile(metadataFilename, metadataContent)

    if (!deleteFirst) {
      await deleteOldBackups()
    }

    // TODO: run cleanup?
  }
}

class DrWriter {
  constructor(backup, sr, settings) {
    this._backup = backup
    this._settings = settings
    this._sr = sr
  }

  async run({ timestamp, stream }) {
    const sr = this._sr
    const settings = this._settings
    const { job, scheduleId, vm } = this._backup

    const { uuid: srUuid, $xapi: xapi } = sr

    // delete previous interrupted copies
    ignoreErrors.call(
      asyncMap(listReplicatedVms(xapi, scheduleId, undefined, vm.uuid), vm =>
        xapi.VM_destroy(vm.$ref)
      )
    )

    const oldVms = getOldEntries(
      settings.copyRetention - 1,
      listReplicatedVms(xapi, scheduleId, srUuid, vm.uuid)
    )

    const deleteOldBackups = () =>
      asyncMap(oldVms, vm => xapi.VM_destroy(vm.$ref))
    const { deleteFirst } = settings
    if (deleteFirst) {
      await deleteOldBackups()
    }
    const targetVm = await xapi.getRecord(
      'VM',
      await xapi.VM_import(stream, sr.$ref)
    )

    await Promise.all([
      targetVm.add_tags('Disaster Recovery'),
      targetVm.ha_restart_priority !== '' &&
        Promise.all([
          targetVm.set_ha_restart_priority(''),
          targetVm.add_tags('HA disabled'),
        ]),
      targetVm.set_name_label(
        `${vm.name_label} - ${job.name} - (${formatFilenameDate(timestamp)})`
      ),
      targetVm.update_blocked_operations(
        'start',
        'Start operation for this vm is blocked, clone it if you want to use it.'
      ),
      targetVm.update_other_config({
        'xo:backup:sr': srUuid,

        // these entries need to be added in case of offline backup
        'xo:backup:datetime': formatDateTime(timestamp),
        'xo:backup:job': job.id,
        'xo:backup:schedule': scheduleId,
        'xo:backup:vm': vm.uuid,
      }),
    ])

    if (!deleteFirst) {
      await deleteOldBackups()
    }
  }
}

class VmBackup {
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
        writers.push(new DrWriter(this, sr, targetSettings))
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

class Backup {
  constructor({
    config,
    getConnectedXapi,
    job,
    recordToXapi,
    remotes,
    schedule,
  }) {
    this._config = config
    this._getConnectedXapi = getConnectedXapi
    this._job = job
    this._recordToXapi = recordToXapi
    this._remotes = remotes
    this._schedule = schedule

    this._getSnapshotNameLabel = compileTemplate(config.snapshotNameLabelTpl, {
      '{job.name}': job.name,
      '{vm.name_label}': vm => vm.name_label,
    })
  }

  async run() {
    // FIXME: proper SimpleIdPattern handling
    const getSnapshotNameLabel = this._getSnapshotNameLabel
    const job = this._job
    const schedule = this._schedule

    const { settings } = job
    const scheduleSettings = {
      ...this._config.defaultSettings,
      ...settings[''],
      ...settings[schedule.id],
    }

    const srs = await Promise.all(
      extractIdsFromSimplePattern(job.srs).map(_ => this._getRecord('SR', _))
    )

    const remoteIds = extractIdsFromSimplePattern(job.remotes)
    const remoteHandlers = {}
    try {
      await asyncMap(remoteIds, async id => {
        const handler = getHandler(this._remotes[id])
        await handler.sync()
        remoteHandlers[id] = handler
      })
      const handleVm = async vmUuid => {
        try {
          return await new VmBackup({
            getSnapshotNameLabel,
            job,
            // remotes,
            remoteHandlers,
            schedule,
            settings: { ...scheduleSettings, ...settings[vmUuid] },
            srs,
            vm: await this._getRecord('VM', vmUuid),
          }).run()
        } catch (error) {
          warn('VM backup failure', {
            error,
            vmUuid,
          })
        }
      }
      const { concurrency } = scheduleSettings
      return await asyncMap(
        extractIdsFromSimplePattern(job.vms),
        concurrency === 0 ? handleVm : limitConcurrency(concurrency)(handleVm)
      )
    } finally {
      await Promise.all(
        Object.keys(remoteHandlers).map(id =>
          remoteHandlers[id].forget().then(noop)
        )
      )
    }
  }

  async _getRecord(type, uuid) {
    const xapiId = this._recordToXapi[uuid]
    if (xapiId === undefined) {
      throw new Error('no XAPI associated to ' + uuid)
    }

    const xapi = await this._getConnectedXapi(xapiId)
    return xapi.getRecordByUuid(type, uuid)
  }
}

export default class Backups {
  constructor(
    app,
    { config: { backups: config, xapiOptions: globalXapiOptions } }
  ) {
    app.api.addMethods({
      backup: {
        run: [
          async ({ xapis: xapisOptions, ...rest }) => {
            const xapis = []
            async function createConnectedXapi(id) {
              const {
                credentials: { username: user, password },
                ...xapiOptions
              } = xapisOptions[id]
              const xapi = new Xapi({
                ...globalXapiOptions,
                ...xapiOptions,
                auth: {
                  user,
                  password,
                },
              })
              xapis.push(xapi)
              await xapi.connect()
              await xapi.objectsFetched
              return xapi
            }
            async function disconnectAllXapis() {
              const promises = xapis.map(xapi => xapi.disconnect())
              xapis.length = 0
              await Promise.all(promises)
            }
            app.hooks.on('stop', disconnectAllXapis)

            const connectedXapis = { __proto__: null }
            function getConnectedXapi(id) {
              let connectedXapi = connectedXapis[id]
              if (connectedXapi === undefined) {
                connectedXapi = createConnectedXapi(id)
                connectedXapis[id] = connectedXapi
              }
              return connectedXapi
            }

            try {
              return await new Backup({
                ...rest,
                config,
                getConnectedXapi,
              }).run()
            } finally {
              app.hooks.removeListener('stop', disconnectAllXapis)
              ignoreErrors.call(disconnectAllXapis())
            }
          },
          {
            description: 'run a backup job',
            params: {
              job: { type: 'object' },
              remotes: { type: 'object' },
              schedule: { type: 'object' },
              xapis: { type: 'object' },
              recordToXapi: { type: 'object' },
            },
          },
        ],
      },
    })
  }
}
