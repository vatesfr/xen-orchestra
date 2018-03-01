// @flow

// $FlowFixMe
import defer from 'golike-defer'
// $FlowFixMe
import { fromEvent } from 'promise-toolbox'
import { type Pattern, createPredicate } from 'value-matcher'
import { dirname, resolve } from 'path'
// $FlowFixMe
import { PassThrough } from 'stream'

import { translateOldJobs } from './migration'

import { type Job } from '../jobs'
import { type Schedule } from '../scheduling'

import { asyncMap, safeDateFormat } from '../../utils'
// import { parseDateTime } from '../../xapi/utils'
import { type RemoteHandlerAbstract } from '../../remote-handlers/abstract'
import { type Xapi } from '../../xapi'

type SimpleIdPattern = {|
  id: string | {| __or: Array<string> |}
|}

type Mode = 'full' | 'delta'

type Settings = {|
  deleteFirst?: boolean,
  exportRetention?: number,
  snapshotRetention?: number,
  vmTimeout?: number
|}

export type BackupJob = {|
  ...$Exact<Job>,
  compression?: 'native',
  mode: Mode,
  remotes?: SimpleIdPattern,
  settings: { [string]: Settings },
  srs?: SimpleIdPattern,
  type: 'backup',
  vms: Pattern
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

const compareSnapshotTime = (
  { snapshot_time: time1 },
  { snapshot_time: time2 }
) => (time1 < time2 ? -1 : 1)

// returns all entries but the last retention-th
//
// FIXME: check whether it take the new one into account
const getOldEntries = <T>(retention: number, entries?: Array<T>): Array<T> =>
  entries === undefined
    ? []
    : retention === 0 ? entries : entries.slice(0, -retention)

const defaultSettings: Settings = {
  deleteFirst: false,
  exportRetention: 0,
  snapshotRetention: 0,
}
const getSetting = (
  settings: { [string]: Settings },
  name: $Keys<Settings>,
  ...keys: Array<string>
): any => {
  for (let i = 0, n = keys.length; i < n; ++i) {
    const objectSettings = settings[keys[i]]
    if (objectSettings !== undefined) {
      const setting = objectSettings[name]
      if (settings !== undefined) {
        return setting
      }
    }
  }
  return defaultSettings[name]
}

const getVmBackupDir = vm => 'xo-vm-backups/' + vm.uuid

const isMetadataFile = (filename: string) => filename.endsWith('.json')

const unboxIds = (pattern?: SimpleIdPattern): Array<string> => {
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
export default class BackupNg {
  _app: any

  constructor (app: any) {
    this._app = app

    app.on('start', () => {
      app.registerJobExecutor(({ data, cancelToken, job, runId }) =>
        asyncMap(
          app.getObjects({
            filter: createPredicate({ type: 'VM', ...job.vms }),
          }),
          vm =>
            // $FlowFixMe injected $defer param
            this._backupVm(cancelToken, vm._xapiId, job, data._schedule)
        )
      )
    })
  }

  createBackupNgJob (job: $Diff<BackupJob, {| id: string |}>): Promise<void> {
    return this._app.createJob(job)
  }

  getAllBackupNgJobs (): Promise<Array<BackupJob>> {
    // return this._app.getAllJobs('backup')
    return translateOldJobs(this._app)
  }

  getBackupNgJob (id: string): Promise<BackupJob> {
    return this._app.getJob(id, 'backup')
  }

  // - [x] files (.tmp) should be renamed at the end of job
  // - [ ] validate VHDs after exports and before imports
  // - [ ] protect against concurrent backup against a single VM
  // - [ ] detect full remote
  // - [x] can the snapshot and export retention be different? → Yes
  // - [ ] snapshots and files of an old job should be detected and removed
  // - [ ] adding and removing VDIs should behave
  // - [ ] key export?
  // - [ ] deleteFirst per target
  // - [ ] possibility to (re-)run a single VM in a backup?
  // - [ ] timeout per VM
  // - [ ] display queued VMs
  // - [ ] jobs should be cancelable
  // - [ ] logs
  @defer
  async _backupVm (
    $defer: any,
    $cancelToken: any,
    vmId: string,
    job: BackupJob,
    schedule: Schedule
  ): Promise<void> {
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
      if (remotes.length === 0 || srs.length === 0) {
        throw new Error('export retention must be 0 without remotes and SRs')
      }
    }

    const oldSnapshots = getOldEntries(
      snapshotRetention,
      vm.$snapshots
        .filter(
          ({ other_config: oc }) =>
            oc['xo:backup'] === jobId && oc['xo:backup:schedule'] === scheduleId
        )
        .sort(compareSnapshotTime)
    )

    const vmSnapshot = await xapi._snapshotVm(
      $cancelToken,
      vm,
      `[XO Backup] ${vm.name_label}`
    )
    $defer.onFailure.call(xapi, '_deleteVm', vmSnapshot)
    await xapi._updateObjectMapProperty(vmSnapshot, 'other_config', {
      'xo:backup': jobId,
      'xo:backup:schedule': scheduleId,
    })

    // TODO: should we really wait for this?
    await asyncMap(oldSnapshots, snapshot => xapi.deleteVm(snapshot))

    if (exportRetention === 0) {
      return
    }

    const now = Date.now()
    const { mode } = job

    if (mode === 'full') {
      // TODO: do not create the snapshot if there are no snapshotRetention and
      // the VM is not running
      if (snapshotRetention === 0) {
        $defer.call(xapi, 'deleteVm', vmSnapshot)
      }

      const xva = await xapi.exportVm($cancelToken, vmSnapshot)

      const dirname = getVmBackupDir(vm)
      const basename = safeDateFormat(now)

      const dataBasename = `${basename}.xva`
      const metadataFilename = `${dirname}/${basename}.json`

      const metadata: MetadataFull = {
        data: `./${dataBasename}`,
        jobId,
        mode,
        scheduleId,
        timestamp: now,
        version: '2.0.0',
        vm,
        vmSnapshot,
      }
      const dataFilename = `${dirname}/${dataBasename}`
      const tmpFilename = `${dirname}/.${dataBasename}`

      const jsonMetadata = JSON.stringify(metadata)

      await Promise.all([
        asyncMap(
          remotes,
          defer(async ($defer, remoteId) => {
            const fork = xva.pipe(new PassThrough())

            const handler = app.getRemoteHandler(remoteId)
            $defer.onSuccess.call(
              handler,
              'outputFile',
              metadataFilename,
              metadata
            )

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
            $defer.onSuccess.call(handler, 'rename', tmpFilename, dataFilename)

            const promise = fromEvent(output, 'finish')
            fork.pipe(output)
            await promise

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

            const xapi = app.getXapi(srId)
            const sr = xapi.getObject(srId)

            const vms = []
            sr.$VDIs.forEach(vdi => {
              // TODO
            })

            // the replicated VMs have been created from a snapshot, therefore
            // we can use `snapshot_time` as the creation time
            //
            // TODO: check that's true
            vms.sort(compareSnapshotTime)

            const oldVms = getOldEntries(exportRetention, vms)

            const deleteFirst = getSetting(settings, 'deleteFirst', srId)
            if (deleteFirst) {
              await this._deleteVms(xapi, oldVms)
            }

            const copyRef: string = await xapi._importVm($cancelToken, fork, sr)

            xapi._updateObjectMapProperty(copyRef, 'blocked_operations', {
              start:
                'Start operation for this vm is blocked, clone it if you want to use it.',
            })

            await xapi.addTag(copyRef, 'Disaster Recovery')

            if (!deleteFirst) {
              await this._deleteVms(xapi, oldVms)
            }
          })
        ),
      ])

      return
    }

    // check current state
    await Promise.all([asyncMap(remotes, remoteId => {})])
  }

  async _deleteFullVmBackups (
    handler: RemoteHandlerAbstract,
    backups: Array<Metadata>
  ): Promise<void> {
    await asyncMap(backups, ({ _filename, data }) =>
      Promise.all([
        handler.unlink(_filename),
        handler.unlink(resolve('/', dirname(_filename), data)),
      ])
    )
  }

  async _deleteVms (xapi: Xapi, vms: Array<Object>): Promise<void> {
    return asyncMap(vms, vm => xapi.deleteVm(vm))
  }

  async _listVmBackups (
    handler: RemoteHandlerAbstract,
    vm: Object,
    predicate?: Metadata => boolean
  ): Promise<Array<Metadata>> {
    const backups = []

    // TODO: handle ENOENT dir
    const dir = getVmBackupDir(vm)
    const files = await handler.list(dir)
    await files.filter(isMetadataFile).forEach(async file => {
      try {
        const metadata = JSON.parse(await handler.readFile(file))
        if (predicate === undefined || predicate(metadata)) {
          metadata._filename = `${dir}/${file}`
          backups.push(metadata)
        }
      } catch (error) {
        console.warn('_listVmBackups', file, error)
      }
    })

    return backups
  }
}
