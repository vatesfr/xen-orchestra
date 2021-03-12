// @flow

// $FlowFixMe
import asyncMapSettled from '@xen-orchestra/async-map/legacy'
import createLogger from '@xen-orchestra/log'
import type RemoteHandler from '@xen-orchestra/fs'
import using from 'promise-toolbox/using'
import { decorateWith } from '@vates/decorate-with'
import { formatVmBackups } from '@xen-orchestra/backups/formatVmBackups'
import { forOwn, merge } from 'lodash'
import { ImportVmBackup } from '@xen-orchestra/backups/ImportVmBackup'
import { invalidParameters } from 'xo-common/api-errors'
import { parseDuration } from '@vates/parse-duration'
import { runBackupWorker } from '@xen-orchestra/backups/backupWorker'
import { Task } from '@xen-orchestra/backups/Task'
import { type Pattern, createPredicate } from 'value-matcher'

import type Logger from '../logs/loggers/abstract'
import { type CallJob, type Executor, type Job } from '../jobs'
import { type Schedule } from '../scheduling'

import { debounceWithKey, REMOVE_CACHE_ENTRY } from '../../_pDebounceWithKey'
import { handleBackupLog } from '../../_handleBackupLog'
import { waitAll } from '../../_waitAll'
import { type DeltaVmExport, type Xapi } from '../../xapi'
import { type SimpleIdPattern, unboxIdsFromPattern } from '../../utils'

import { translateLegacyJob } from './migration'

const log = createLogger('xo:xo-mixins:backups-ng')

export type Mode = 'full' | 'delta'
export type ReportWhen = 'always' | 'failure' | 'never'

type Settings = {|
  bypassVdiChainsCheck?: boolean,
  checkpointSnapshot?: boolean,
  concurrency?: number,
  deleteFirst?: boolean,
  copyRetention?: number,
  exportRetention?: number,
  offlineBackup?: boolean,
  offlineSnapshot?: boolean,
  reportRecipients?: Array<string>,
  reportWhen?: ReportWhen,
  snapshotRetention?: number,
  timeout?: number,
  vmTimeout?: number,
|}

export type BackupJob = {|
  ...$Exact<Job>,
  compression?: 'native' | 'zstd' | '',
  mode: Mode,
  proxy?: string,
  remotes?: SimpleIdPattern,
  settings: $Dict<Settings>,
  srs?: SimpleIdPattern,
  type: 'backup',
  vms: Pattern,
|}

type MetadataBase = {|
  _filename?: string,
  jobId: string,
  scheduleId: string,
  timestamp: number,
  version: '2.0.0',
  vm: Object,
  vmSnapshot: Object,
|}
type MetadataDelta = {|
  ...MetadataBase,
  mode: 'delta',
  vdis: $PropertyType<DeltaVmExport, 'vdis'>,
  vbds: $PropertyType<DeltaVmExport, 'vbds'>,
  vhds: { [vdiId: string]: string },
  vifs: $PropertyType<DeltaVmExport, 'vifs'>,
|}
type MetadataFull = {|
  ...MetadataBase,
  mode: 'full',
  xva: string,
|}
type Metadata = MetadataDelta | MetadataFull

const parseVmBackupId = (id: string) => {
  const i = id.indexOf('/')
  return {
    metadataFilename: id.slice(i + 1),
    remoteId: id.slice(0, i),
  }
}

const extractIdsFromSimplePattern = (pattern: mixed) => {
  if (pattern === null || typeof pattern !== 'object') {
    return
  }

  let keys = Object.keys(pattern)
  if (keys.length !== 1 || keys[0] !== 'id') {
    return
  }

  pattern = pattern.id
  if (typeof pattern === 'string') {
    return [pattern]
  }
  if (pattern === null || typeof pattern !== 'object') {
    return
  }

  keys = Object.keys(pattern)
  if (
    keys.length === 1 &&
    keys[0] === '__or' &&
    Array.isArray((pattern = pattern.__or)) &&
    pattern.every(_ => typeof _ === 'string')
  ) {
    return pattern
  }
}

// File structure on remotes:
//
// <remote>
// └─ xo-vm-backups
//   ├─ index.json // TODO
//   └─ <VM UUID>
//      ├─ index.json // TODO
//      ├─ vdis
//      │  └─ <job UUID>
//      │     └─ <VDI UUID>
//      │        ├─ index.json // TODO
//      │        └─ <YYYYMMDD>T<HHmmss>.vhd
//      ├─ <YYYYMMDD>T<HHmmss>.json // backup metadata
//      ├─ <YYYYMMDD>T<HHmmss>.xva
//      └─ <YYYYMMDD>T<HHmmss>.xva.checksum
//
// Attributes on created VM snapshots:
//
// - `other_config`:
//    - `xo:backup:deltaChainLength` = n (number of delta copies/replicated since a full)
//    - `xo:backup:exported` = 'true' (added at the end of the backup)
//
// Attributes on created VMs and created snapshots:
//
// - `other_config`:
//    - `xo:backup:datetime`: format is UTC %Y%m%dT%H:%M:%SZ
//       - from snapshots: snapshot.snapshot_time
//       - with offline backup: formatDateTime(Date.now())
//    - `xo:backup:job` = job.id
//    - `xo:backup:schedule` = schedule.id
//    - `xo:backup:vm` = vm.uuid
//
// Attributes of created VMs:
//
// - `name_label`: `${original name} - ${job name} - (${safeDateFormat(backup timestamp)})`
// - tag:
//    - copy in delta mode: `Continuous Replication`
//    - copy in full mode: `Disaster Recovery`
//    - imported from backup: `restored from backup`
// - `blocked_operations.start`: message
// - for copies/replications only, added after complete transfer
//    - `other_config[xo:backup:sr]` = sr.uuid
//
// Task logs emitted in a backup execution:
//
// job.start(data: { mode: Mode, reportWhen: ReportWhen })
// ├─ task.info(message: 'vms', data: { vms: string[] })
// ├─ task.warning(message: string)
// ├─ task.start(data: { type: 'VM', id: string })
// │  ├─ task.warning(message: string)
// │  ├─ task.start(message: 'snapshot')
// │  │  └─ task.end
// │  ├─ task.start(message: 'export', data: { type: 'SR' | 'remote', id: string })
// │  │  ├─ task.warning(message: string)
// │  │  ├─ task.start(message: 'transfer')
// │  │  │  ├─ task.warning(message: string)
// │  │  │  └─ task.end(result: { size: number })
// │  │  │
// │  │  │  // in case of full backup, DR and CR
// │  │  ├─ task.start(message: 'clean')
// │  │  │  ├─ task.warning(message: string)
// │  │  │  └─ task.end
// │  │  │
// │  │  │ // in case of delta backup
// │  │  ├─ task.start(message: 'merge')
// │  │  │  ├─ task.warning(message: string)
// │  │  │  └─ task.end(result: { size: number })
// │  │  │
// │  │  └─ task.end
// │  └─ task.end
// └─ job.end
export default class BackupNg {
  _app: {
    createJob: ($Diff<BackupJob, {| id: string |}>) => Promise<BackupJob>,
    createSchedule: ($Diff<Schedule, {| id: string |}>) => Promise<Schedule>,
    deleteSchedule: (id: string) => Promise<void>,
    getAllSchedules: () => Promise<Schedule[]>,
    getRemoteHandler: (id: string) => Promise<RemoteHandler>,
    getXapi: (id: string) => Xapi,
    getJob: ((id: string, 'backup') => Promise<BackupJob>) & ((id: string, 'call') => Promise<CallJob>),
    getLogs: (namespace: string) => Promise<{ [id: string]: Object }>,
    updateJob: (($Shape<BackupJob>, ?boolean) => Promise<BackupJob>) &
      (($Shape<CallJob>, ?boolean) => Promise<CallJob>),
    removeJob: (id: string) => Promise<void>,
    worker: $Dict<any>,
  }
  _logger: Logger
  _runningRestores: Set<string>

  get runningRestores() {
    return this._runningRestores
  }

  constructor(app: any, config) {
    this._app = app
    this._logger = undefined
    this._runningRestores = new Set()
    this._backupOptions = config.backups

    app.on('start', async () => {
      this._logger = await app.getLogger('restore')

      const executor: Executor = async ({ cancelToken, data, job: job_, logger, runJobId, schedule }) => {
        let job: BackupJob = (job_: any)

        const vmsPattern = job.vms

        // Make sure we are passing only the VM to run which can be
        // different than the VMs in the job itself.
        let vmIds = data?.vms ?? extractIdsFromSimplePattern(vmsPattern)
        if (vmIds === undefined) {
          vmIds = Object.keys(
            app.getObjects({
              filter: createPredicate({
                type: 'VM',
                ...vmsPattern,
              }),
            })
          )
          if (vmIds.length === 0) {
            throw new Error('no VMs match this pattern')
          }
        }

        job = {
          ...job,

          vms: { id: { __or: vmIds } },
          settings: merge(job.settings, data?.settings),
        }

        const proxyId = job.proxy
        const remoteIds = unboxIdsFromPattern(job.remotes)
        try {
          const recordToXapi = {}
          const servers = new Set()
          const handleRecord = uuid => {
            const serverId = app.getXenServerIdByObject(uuid)
            recordToXapi[uuid] = serverId
            servers.add(serverId)
          }
          vmIds.forEach(handleRecord)
          unboxIdsFromPattern(job.srs).forEach(handleRecord)

          const remotes = {}
          const xapis = {}
          await waitAll([
            asyncMapSettled(remoteIds, async id => {
              const remote = await app.getRemoteWithCredentials(id)
              if (remote.proxy !== proxyId) {
                throw new Error(
                  proxyId === undefined
                    ? 'The remote must not be linked to a proxy'
                    : `The remote ${remote.name} must be linked to the proxy ${proxyId}`
                )
              }

              remotes[id] = remote
            }),
            asyncMapSettled([...servers], async id => {
              const { allowUnauthorized, host, password, username } = await app.getXenServer(id)
              xapis[id] = {
                allowUnauthorized,
                credentials: {
                  username,
                  password,
                },
                url: host,
              }
            }),
          ])

          const params = {
            job,
            recordToXapi,
            remotes,
            schedule,
            xapis,
          }

          if (proxyId !== undefined) {
            try {
              const logsStream = await app.callProxyMethod(
                proxyId,
                'backup.run',
                {
                  ...params,
                  streamLogs: true,
                },
                {
                  assertType: 'iterator',
                }
              )

              const localTaskIds = { __proto__: null }
              let result
              for await (const log of logsStream) {
                result = handleBackupLog(log, {
                  logger,
                  localTaskIds,
                  runJobId,
                })
              }
              return result
            } catch (error) {
              if (invalidParameters.is(error)) {
                // wait for the result to properly reset backup listing cache in `finally`
                return await app.callProxyMethod(proxyId, 'backup.run', params)
              }
              throw error
            }
          } else {
            const localTaskIds = { __proto__: null }
            return await runBackupWorker(
              {
                config,
                ...params,
              },
              log =>
                handleBackupLog(log, {
                  logger,
                  localTaskIds,
                  runJobId,
                })
            )
          }
        } finally {
          remoteIds.forEach(id => this._listVmBackupsOnRemote(REMOVE_CACHE_ENTRY, id))
        }
      }
      app.registerJobExecutor('backup', executor)
    })
  }

  async createBackupNgJob(
    props: $Diff<BackupJob, {| id: string |}>,
    schedules?: $Dict<$Diff<Schedule, {| id: string |}>>
  ): Promise<BackupJob> {
    const app = this._app
    props.type = 'backup'
    const job: BackupJob = await app.createJob(props)

    if (schedules !== undefined) {
      const { id, settings } = job
      const tmpIds = Object.keys(schedules)
      await asyncMapSettled(tmpIds, async (tmpId: string) => {
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

  async deleteBackupNgJob(id: string): Promise<void> {
    const app = this._app
    const [schedules] = await Promise.all([app.getAllSchedules(), app.getJob(id, 'backup')])
    await Promise.all([
      app.removeJob(id),
      asyncMapSettled(schedules, schedule => {
        if (schedule.id === id) {
          app.deleteSchedule(schedule.id)
        }
      }),
    ])
  }

  async deleteVmBackupNg(id: string): Promise<void> {
    const app = this._app
    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const remote = await app.getRemoteWithCredentials(remoteId)
    if (remote.proxy !== undefined) {
      await app.callProxyMethod(remote.proxy, 'backup.deleteVmBackup', {
        filename: metadataFilename,
        remote: {
          url: remote.url,
          options: remote.options,
        },
      })
    } else {
      await using(app.getBackupsRemoteAdapter(remoteId), adapter => adapter.deleteVmBackup(metadataFilename))
    }

    this._listVmBackupsOnRemote(REMOVE_CACHE_ENTRY, remoteId)
  }

  // Task logs emitted in a restore execution:
  //
  // task.start(message: 'restore', data: { jobId: string, srId: string, time: number })
  // ├─ task.start(message: 'transfer')
  // │  └─ task.end(result: { id: string, size: number })
  // └─ task.end
  async importVmBackupNg(id: string, srId: string): Promise<string> {
    const app = this._app
    const xapi = app.getXapi(srId)
    const sr = xapi.getObject(srId)

    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const remote = await app.getRemoteWithCredentials(remoteId)

    let rootTaskId
    const logger = this._logger
    try {
      if (remote.proxy !== undefined) {
        const { allowUnauthorized, host, password, username } = await app.getXenServer(
          app.getXenServerIdByObject(sr.$id)
        )

        const params = {
          backupId: metadataFilename,
          remote: {
            url: remote.url,
            options: remote.options,
          },
          srUuid: sr.uuid,
          streamLogs: true,
          xapi: {
            allowUnauthorized,
            credentials: {
              username,
              password,
            },
            url: host,
          },
        }

        try {
          const logsStream = await app.callProxyMethod(remote.proxy, 'backup.importVmBackup', params, {
            assertType: 'iterator',
          })

          const localTaskIds = { __proto__: null }
          for await (const log of logsStream) {
            handleBackupLog(log, {
              logger,
              localTaskIds,
              handleRootTaskId: id => {
                this._runningRestores.add(id)
                rootTaskId = id
              },
            })
          }
        } catch (error) {
          if (invalidParameters.is(error)) {
            delete params.streamLogs
            return app.callProxyMethod(remote.proxy, 'backup.importVmBackup', params)
          }
          throw error
        }
      } else {
        await using(app.getBackupsRemoteAdapter(remote), async adapter => {
          const metadata: Metadata = await adapter.readVmBackupMetadata(metadataFilename)
          const localTaskIds = { __proto__: null }
          return Task.run(
            {
              data: {
                jobId: metadata.jobId,
                srId,
                time: metadata.timestamp,
              },
              name: 'restore',
              onLog: log =>
                handleBackupLog(log, {
                  logger,
                  localTaskIds,
                  handleRootTaskId: id => {
                    this._runningRestores.add(id)
                    rootTaskId = id
                  },
                }),
            },
            async () =>
              new ImportVmBackup({
                adapter,
                metadata,
                srUuid: srId,
                xapi: await app.getXapi(srId),
              }).run()
          )
        })
      }
    } finally {
      this._runningRestores.delete(rootTaskId)
    }
  }

  @decorateWith(
    debounceWithKey,
    function () {
      return parseDuration(this._backupOptions.listingDebounce)
    },
    function keyFn(remoteId) {
      return [this, remoteId]
    }
  )
  async _listVmBackupsOnRemote(remoteId: string) {
    const app = this._app
    try {
      const remote = await app.getRemoteWithCredentials(remoteId)

      let backupsByVm
      if (remote.proxy !== undefined) {
        ;({ [remoteId]: backupsByVm } = await app.callProxyMethod(remote.proxy, 'backup.listVmBackups', {
          remotes: {
            [remoteId]: {
              url: remote.url,
              options: remote.options,
            },
          },
        }))
      } else {
        backupsByVm = await using(app.getBackupsRemoteAdapter(remote), async adapter =>
          formatVmBackups(await adapter.listAllVmBackups())
        )
      }

      // inject the remote id on the backup which is needed for importVmBackupNg()
      forOwn(backupsByVm, backups =>
        backups.forEach(backup => {
          backup.id = `${remoteId}${backup.id}`
        })
      )
      return backupsByVm
    } catch (error) {
      log.warn(`listVmBackups for remote ${remoteId}:`, { error })
    }
  }

  async listVmBackupsNg(remotes: string[], _forceRefresh = false) {
    const backupsByVmByRemote: $Dict<$Dict<Metadata[]>> = {}

    await Promise.all(
      remotes.map(async remoteId => {
        if (_forceRefresh) {
          this._listVmBackupsOnRemote(REMOVE_CACHE_ENTRY, remoteId)
        }

        backupsByVmByRemote[remoteId] = await this._listVmBackupsOnRemote(remoteId)
      })
    )

    return backupsByVmByRemote
  }

  async migrateLegacyBackupJob(jobId: string) {
    const [job, schedules] = await Promise.all([this._app.getJob(jobId, 'call'), this._app.getAllSchedules()])
    await this._app.updateJob(translateLegacyJob(job, schedules), false)
  }
}
