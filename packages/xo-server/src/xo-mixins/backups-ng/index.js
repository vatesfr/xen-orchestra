// @flow

// $FlowFixMe
import defer from 'golike-defer'
import { dirname, resolve } from 'path'
// $FlowFixMe
import { fromEvent, timeout as pTimeout } from 'promise-toolbox'
// $FlowFixMe
import { isEmpty, last, mapValues, values } from 'lodash'
import { type Pattern, createPredicate } from 'value-matcher'
import { PassThrough } from 'stream'

import { type Executor, type Job } from '../jobs'
import { type Schedule } from '../scheduling'

import createSizeStream from '../../size-stream'
import { asyncMap, safeDateFormat, serializeError } from '../../utils'
// import { parseDateTime } from '../../xapi/utils'
import { type RemoteHandlerAbstract } from '../../remote-handlers/abstract'
import { type Xapi } from '../../xapi'

type Dict<T, K = string> = { [K]: T }

type Mode = 'full' | 'delta'

type Settings = {|
  deleteFirst?: boolean,
  exportRetention?: number,
  snapshotRetention?: number,
  vmTimeout?: number
|}

type SimpleIdPattern = {|
  id: string | {| __or: string[] |}
|}

export type BackupJob = {|
  ...$Exact<Job>,
  compression?: 'native',
  mode: Mode,
  remotes?: SimpleIdPattern,
  settings: Dict<Settings>,
  srs?: SimpleIdPattern,
  type: 'backup',
  vms: Pattern
|}

type BackupResult = {|
  mergeDuration: number,
  mergeSize: number,
  transferDuration: number,
  transferSize: number
|}

type MetadataBase = {|
  jobId: string,
  mode: Mode,
  scheduleId: string,
  timestamp: number,
  version: '2.0.0',
  vm: Object,
  vmSnapshot: Object
|}
type MetadataDelta = {| ...MetadataBase, mode: 'delta' |}
type MetadataFull = {|
  ...MetadataBase,
  data: string, // relative path to the XVA
  mode: 'full'
|}
type Metadata = MetadataDelta | MetadataFull

const compareSnapshotTime = (a, b) =>
  a.snapshot_time < b.snapshot_time ? -1 : 1

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

// returns all entries but the last (retention - 1)-th
//
// the “-1” is because this code is usually run with entries computed before the
// new entry is created
//
// FIXME: check whether it take the new one into account
const getOldEntries = <T>(retention: number, entries?: T[]): T[] =>
  entries === undefined
    ? []
    : --retention > 0 ? entries.slice(0, -retention) : entries

const defaultSettings: Settings = {
  deleteFirst: false,
  exportRetention: 0,
  snapshotRetention: 0,
  vmTimeout: 0,
}
const getSetting = (
  settings: Dict<Settings>,
  name: $Keys<Settings>,
  ...keys: string[]
): any => {
  for (let i = 0, n = keys.length; i < n; ++i) {
    const objectSettings = settings[keys[i]]
    if (objectSettings !== undefined) {
      const setting = objectSettings[name]
      if (setting !== undefined) {
        return setting
      }
    }
  }
  return defaultSettings[name]
}

const BACKUP_DIR = 'xo-vm-backups'
const getVmBackupDir = (uuid: string) => `${BACKUP_DIR}/${uuid}`

const isMetadataFile = (filename: string) => filename.endsWith('.json')

const listReplicatedVms = (xapi: Xapi, scheduleId: string, srId) => {
  const { all } = xapi.objects
  const vms = {}
  for (const key in all) {
    const object = all[key]
    if (
      object.$type === 'vm' &&
      object.other_config['xo:backup:schedule'] === scheduleId &&
      object.other_config['xo:backup:sr'] === srId
    ) {
      vms[object.$id] = object
    }
  }

  // the replicated VMs have been created from a snapshot, therefore we can use
  // `snapshot_time` as the creation time
  return values(vms).sort(compareSnapshotTime)
}

const parseVmBackupId = id => {
  const i = id.indexOf('/')
  return {
    metadataFilename: id.slice(i + 1),
    remoteId: id.slice(0, i),
  }
}

// used to resolve the data field from the metadata
const resolveRelativeFromFile = (file, path) =>
  resolve('/', dirname(file), path).slice(1)

const unboxIds = (pattern?: SimpleIdPattern): string[] => {
  if (pattern === undefined) {
    return []
  }
  const { id } = pattern
  return typeof id === 'string' ? [id] : id.__or
}

// File structure on remotes:
//
// <remote>
// └─ xo-vm-backups
//   ├─ index.json // TODO
//   └─ <VM UUID>
//      ├─ index.json // TODO
//      ├─ vdis
//      │  └─ <VDI UUID>
//      │     ├─ index.json // TODO
//      │     └─ <YYYYMMDD>T<HHmmss>.vhd
//      ├─ <YYYYMMDD>T<HHmmss>.json // backup metadata
//      └─ <YYYYMMDD>T<HHmmss>.xva
//
// Attributes of created VMs:
//
// - name: `${original name} (${safeDateFormat(backup timestamp)})`
// - tag:
//    - copy in delta mode: `Continuous Replication`
//    - copy in full mode: `Disaster Recovery`
//    - imported from backup: `restored from backup`
export default class BackupNg {
  _app: any

  constructor (app: any) {
    this._app = app

    app.on('start', () => {
      const executor: Executor = async ({
        cancelToken,
        job: job_,
        logger,
        runJobId,
        schedule,
      }) => {
        if (schedule === undefined) {
          throw new Error('backup job cannot run without a schedule')
        }

        const job: BackupJob = (job_: any)
        const vms = app.getObjects({
          filter: createPredicate({
            type: 'VM',
            ...job.vms,
          }),
        })
        if (isEmpty(vms)) {
          throw new Error('no VMs match this pattern')
        }
        const jobId = job.id
        const scheduleId = schedule.id
        const status: Object = {
          calls: {},
          runJobId,
          start: Date.now(),
          timezone: schedule.timezone,
        }
        const { calls } = status
        await asyncMap(vms, async vm => {
          const { uuid } = vm
          const method = 'backup-ng'
          const params = {
            id: uuid,
            tag: job.name,
          }

          const name = vm.name_label
          const runCallId = logger.notice(
            `Starting backup of ${name}. (${jobId})`,
            {
              event: 'jobCall.start',
              method,
              params,
              runJobId,
            }
          )
          const call: Object = (calls[runCallId] = {
            method,
            params,
            start: Date.now(),
          })
          const vmCancel = cancelToken.fork()
          try {
            // $FlowFixMe injected $defer param
            let p = this._backupVm(vmCancel.token, uuid, job, schedule)
            const vmTimeout: number = getSetting(
              job.settings,
              'vmTimeout',
              uuid,
              scheduleId
            )
            if (vmTimeout !== 0) {
              p = pTimeout.call(p, vmTimeout)
            }
            const returnedValue = await p
            logger.notice(
              `Backuping ${name} (${runCallId}) is a success. (${jobId})`,
              {
                event: 'jobCall.end',
                runJobId,
                runCallId,
                returnedValue,
              }
            )

            call.returnedValue = returnedValue
            call.end = Date.now()
          } catch (error) {
            vmCancel.cancel()
            logger.notice(
              `Backuping ${name} (${runCallId}) has failed. (${jobId})`,
              {
                event: 'jobCall.end',
                runJobId,
                runCallId,
                error: serializeError(error),
              }
            )

            call.error = error
            call.end = Date.now()

            console.warn(error.stack) // TODO: remove
          }
        })
        status.end = Date.now()
        return status
      }
      app.registerJobExecutor('backup', executor)
    })
  }

  async createBackupNgJob (
    props: $Diff<BackupJob, {| id: string |}>,
    schedules?: Dict<$Diff<Schedule, {| id: string |}>>
  ): Promise<BackupJob> {
    const app = this._app
    props.type = 'backup'
    const job: BackupJob = await app.createJob(props)

    if (schedules !== undefined) {
      const { id, settings } = job
      const tmpIds = Object.keys(schedules)
      await asyncMap(tmpIds, async (tmpId: string) => {
        // $FlowFixMe don't know what is the problem (JFT)
        const schedule = schedules[tmpId]
        schedule.jobId = id
        settings[(await app.createSchedule(schedule)).id] = settings[tmpId]
        delete settings[tmpId]
      })
      await app.updateJob({ id, settings })
    }

    return job
  }

  async deleteBackupNgJob (id: string): Promise<void> {
    const app = this._app
    const [schedules] = await Promise.all([
      app.getAllSchedules(),
      app.getJob(id, 'backup'),
    ])
    await Promise.all([
      app.removeJob(id),
      asyncMap(schedules, schedule => {
        if (schedule.id === id) {
          app.deleteSchedule(schedule.id)
        }
      }),
    ])
  }

  async deleteVmBackupNg (id: string): Promise<void> {
    const app = this._app
    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const handler = await app.getRemoteHandler(remoteId)
    const metadata: Metadata = JSON.parse(
      await handler.readFile(metadataFilename)
    )

    if (metadata.mode === 'delta') {
      throw new Error('not implemented')
    }

    metadata._filename = metadataFilename
    await this._deleteFullVmBackups(handler, [metadata])
  }

  getAllBackupNgJobs (): Promise<BackupJob[]> {
    return this._app.getAllJobs('backup')
  }

  getBackupNgJob (id: string): Promise<BackupJob> {
    return this._app.getJob(id, 'backup')
  }

  async importVmBackupNg (id: string, srId: string): Promise<void> {
    const app = this._app
    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const handler = await app.getRemoteHandler(remoteId)
    const metadata: Metadata = JSON.parse(
      await handler.readFile(metadataFilename)
    )

    if (metadata.mode === 'delta') {
      throw new Error('not implemented')
    }

    const xapi = app.getXapi(srId)
    const sr = xapi.getObject(srId)
    const xva = await handler.createReadStream(
      resolveRelativeFromFile(metadataFilename, metadata.data)
    )
    const vm = await xapi.importVm(xva, { srId: sr.$id })
    await Promise.all([
      xapi.addTag(vm.$id, 'restored from backup'),
      xapi.editVm(vm.$id, {
        name_label: `${metadata.vm.name_label} (${safeDateFormat(
          metadata.timestamp
        )})`,
      }),
    ])
    return vm.$id
  }

  async listVmBackupsNg (remotes: string[]) {
    const backupsByVmByRemote: Dict<Dict<Metadata[]>> = {}

    const app = this._app
    await Promise.all(
      remotes.map(async remoteId => {
        const handler = await app.getRemoteHandler(remoteId)

        const entries = (await handler.list(BACKUP_DIR).catch(error => {
          if (error == null || error.code !== 'ENOENT') {
            throw error
          }
          return []
        })).filter(name => name !== 'index.json')

        const backupsByVm = (backupsByVmByRemote[remoteId] = {})
        await Promise.all(
          entries.map(async vmId => {
            // $FlowFixMe don't know what is the problem (JFT)
            const backups = await this._listVmBackups(handler, vmId)

            if (backups.length === 0) {
              return
            }

            // inject an id usable by importVmBackupNg()
            backups.forEach(backup => {
              backup.id = `${remoteId}/${backup._filename}`
            })

            backupsByVm[vmId] = backups
          })
        )
      })
    )

    return backupsByVmByRemote
  }

  // - [x] files (.tmp) should be renamed at the end of job
  // - [ ] validate VHDs after exports and before imports
  // - [ ] protect against concurrent backup against a single VM (JFT: why?)
  // - [x] detect full remote
  // - [x] can the snapshot and export retention be different? → Yes
  // - [ ] snapshots and files of an old job should be detected and removed
  // - [ ] adding and removing VDIs should behave
  // - [ ] key export?
  // - [x] deleteFirst per target
  // - [ ] possibility to (re-)run a single VM in a backup?
  // - [x] timeout per VM
  // - [ ] display queued VMs
  // - [ ] jobs should be cancelable
  // - [ ] logs
  // - [x] backups should be deletable from the API
  // - [ ] check merge/transfert duration/size are what we want for delta
  @defer
  async _backupVm (
    $defer: any,
    $cancelToken: any,
    vmId: string,
    job: BackupJob,
    schedule: Schedule
  ): Promise<BackupResult> {
    const app = this._app
    const xapi = app.getXapi(vmId)
    const vm = xapi.getObject(vmId)

    const { id: jobId, settings } = job
    const { id: scheduleId } = schedule

    const exportRetention: number = getSetting(
      settings,
      'exportRetention',
      scheduleId
    )
    const snapshotRetention: number = getSetting(
      settings,
      'snapshotRetention',
      scheduleId
    )

    let remotes, srs
    if (exportRetention === 0) {
      if (snapshotRetention === 0) {
        throw new Error('export and snapshots retentions cannot both be 0')
      }
    } else {
      remotes = unboxIds(job.remotes)
      srs = unboxIds(job.srs)
      if (remotes.length === 0 && srs.length === 0) {
        throw new Error('export retention must be 0 without remotes and SRs')
      }
    }

    const snapshots = vm.$snapshots
      .filter(_ => _.other_config['xo:backup:schedule'] === scheduleId)
      .sort(compareSnapshotTime)
    $defer(() =>
      asyncMap(getOldEntries(snapshotRetention, snapshots), _ =>
        xapi.deleteVm(_)
      )
    )

    let snapshot = await xapi._snapshotVm(
      $cancelToken,
      vm,
      `[XO Backup] ${vm.name_label}`
    )
    $defer.onFailure.call(xapi, '_deleteVm', snapshot)
    await xapi._updateObjectMapProperty(snapshot, 'other_config', {
      'xo:backup:job': jobId,
      'xo:backup:schedule': scheduleId,
    })
    snapshot = await xapi.barrier(snapshot.$ref)

    if (exportRetention === 0) {
      return {
        mergeDuration: 0,
        mergeSize: 0,
        transferDuration: 0,
        transferSize: 0,
      }
    }

    const now = Date.now()
    const { mode } = job

    const metadata: Metadata = {
      jobId,
      mode,
      scheduleId,
      timestamp: now,
      version: '2.0.0',
      vm,
      vmSnapshot: snapshot,
    }

    if (mode === 'full') {
      // TODO: do not create the snapshot if there are no snapshotRetention and
      // the VM is not running
      if (snapshotRetention === 0) {
        $defer.call(xapi, 'deleteVm', snapshot)
      }

      let xva = await xapi.exportVm($cancelToken, snapshot, {
        compress: job.compression === 'native',
      })
      const exportTask = xva.task
      xva = xva.pipe(createSizeStream())

      const dirname = getVmBackupDir(vm.uuid)
      const basename = safeDateFormat(now)

      const dataBasename = `${basename}.xva`
      const metadataFilename = `${dirname}/${basename}.json`

      metadata.data = `./${dataBasename}`
      const dataFilename = `${dirname}/${dataBasename}`
      const tmpFilename = `${dirname}/.${dataBasename}`

      const jsonMetadata = JSON.stringify(metadata)

      await Promise.all([
        asyncMap(
          remotes,
          defer(async ($defer, remoteId) => {
            const fork = xva.pipe(new PassThrough())

            const handler = await app.getRemoteHandler(remoteId)

            const oldBackups = getOldEntries(
              exportRetention,
              await this._listVmBackups(
                handler,
                vm,
                _ => _.mode === 'full' && _.scheduleId === scheduleId
              )
            )

            const deleteFirst = getSetting(settings, 'deleteFirst', remoteId)
            if (deleteFirst) {
              await this._deleteFullVmBackups(handler, oldBackups)
            }

            const output = await handler.createOutputStream(tmpFilename, {
              checksum: true,
            })
            $defer.onFailure.call(handler, 'unlink', tmpFilename)
            $defer.onSuccess.call(
              handler,
              'rename',
              tmpFilename,
              dataFilename,
              { checksum: true }
            )

            const promise = fromEvent(output, 'finish')
            fork.pipe(output)
            await Promise.all([exportTask, promise])

            await handler.outputFile(metadataFilename, jsonMetadata)

            if (!deleteFirst) {
              await this._deleteFullVmBackups(handler, oldBackups)
            }
          })
        ),
        asyncMap(
          srs,
          defer(async ($defer, srId) => {
            const fork = xva.pipe(new PassThrough())
            fork.task = exportTask

            const xapi = app.getXapi(srId)
            const sr = xapi.getObject(srId)

            const oldVms = getOldEntries(
              exportRetention,
              listReplicatedVms(xapi, scheduleId, srId)
            )

            const deleteFirst = getSetting(settings, 'deleteFirst', srId)
            if (deleteFirst) {
              await this._deleteVms(xapi, oldVms)
            }

            const vm = await xapi.barrier(
              await xapi._importVm($cancelToken, fork, sr, vm =>
                xapi._setObjectProperties(vm, {
                  nameLabel: `${metadata.vm.name_label} (${safeDateFormat(
                    metadata.timestamp
                  )})`,
                })
              )
            )

            await Promise.all([
              xapi.addTag(vm.$ref, 'Disaster Recovery'),
              xapi._updateObjectMapProperty(vm, 'blocked_operations', {
                start:
                  'Start operation for this vm is blocked, clone it if you want to use it.',
              }),
              xapi._updateObjectMapProperty(vm, 'other_config', {
                'xo:backup:sr': srId,
              }),
            ])

            if (!deleteFirst) {
              await this._deleteVms(xapi, oldVms)
            }
          })
        ),
      ])

      return {
        mergeDuration: 0,
        mergeSize: 0,
        transferDuration: Date.now() - now,
        transferSize: xva.size,
      }
    }

    const baseSnapshot = last(snapshots)
    if (baseSnapshot !== undefined) {
      console.log(baseSnapshot.$id) // TODO: remove
      // check current state
      // await Promise.all([asyncMap(remotes, remoteId => {})])
    }

    const deltaExport = await xapi.exportDeltaVm(
      $cancelToken,
      snapshot,
      baseSnapshot
    )

    // forks of the lazy streams
    deltaExport.streams = mapValues(deltaExport.streams, lazyStream => {
      let stream
      return () => {
        if (stream === undefined) {
          stream = lazyStream()
        }
        return Promise.resolve(stream).then(stream => {
          const fork = stream.pipe(new PassThrough())
          fork.task = stream.task
          return fork
        })
      }
    })

    const mergeStart = 0
    const mergeEnd = 0
    let transferStart = 0
    let transferEnd = 0
    await Promise.all([
      asyncMap(remotes, defer(async ($defer, remote) => {})),
      asyncMap(
        srs,
        defer(async ($defer, srId) => {
          const xapi = app.getXapi(srId)
          const sr = xapi.getObject(srId)

          const oldVms = getOldEntries(
            exportRetention,
            listReplicatedVms(xapi, scheduleId, srId)
          )

          const deleteFirst = getSetting(settings, 'deleteFirst', srId)
          if (deleteFirst) {
            await this._deleteVms(xapi, oldVms)
          }

          transferStart =
            transferStart === 0
              ? Date.now()
              : Math.min(transferStart, Date.now())

          const { vm } = await xapi.importDeltaVm(deltaExport, {
            disableStartAfterImport: false, // we'll take care of that
            name_label: `${metadata.vm.name_label} (${safeDateFormat(
              metadata.timestamp
            )})`,
            srId: sr.$id,
          })

          transferEnd = Math.max(transferEnd, Date.now())

          await Promise.all([
            xapi.addTag(vm.$ref, 'Continuous Replication'),
            xapi._updateObjectMapProperty(vm, 'blocked_operations', {
              start:
                'Start operation for this vm is blocked, clone it if you want to use it.',
            }),
            xapi._updateObjectMapProperty(vm, 'other_config', {
              'xo:backup:sr': srId,
            }),
          ])

          if (!deleteFirst) {
            await this._deleteVms(xapi, oldVms)
          }
        })
      ),
    ])

    return {
      mergeDuration: mergeEnd - mergeStart,
      mergeSize: 0,
      transferDuration: transferEnd - transferStart,
      transferSize: 0,
    }
  }

  async _deleteFullVmBackups (
    handler: RemoteHandlerAbstract,
    backups: Metadata[]
  ): Promise<void> {
    await asyncMap(backups, ({ _filename, data }) =>
      Promise.all([
        handler.unlink(_filename),
        handler.unlink(resolveRelativeFromFile(_filename, data)),
      ])
    )
  }

  async _deleteVms (xapi: Xapi, vms: Object[]): Promise<void> {
    return asyncMap(vms, vm => xapi.deleteVm(vm))
  }

  async _listVmBackups (
    handler: RemoteHandlerAbstract,
    vm: Object | string,
    predicate?: Metadata => boolean
  ): Promise<Metadata[]> {
    const backups = []

    const dir = getVmBackupDir(typeof vm === 'string' ? vm : vm.uuid)
    try {
      const files = await handler.list(dir)
      await Promise.all(
        files.filter(isMetadataFile).map(async file => {
          const path = `${dir}/${file}`
          try {
            const metadata = JSON.parse(await handler.readFile(path))
            if (predicate === undefined || predicate(metadata)) {
              Object.defineProperty(metadata, '_filename', {
                value: path,
              })
              backups.push(metadata)
            }
          } catch (error) {
            console.warn('_listVmBackups', path, error)
          }
        })
      )
    } catch (error) {
      if (error == null || error.code !== 'ENOENT') {
        throw error
      }
    }

    return backups.sort(compareTimestamp)
  }
}
