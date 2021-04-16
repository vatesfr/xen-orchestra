// @flow
import asyncMapSettled from '@xen-orchestra/async-map/legacy'
import cloneDeep from 'lodash/cloneDeep'
import Disposable from 'promise-toolbox/Disposable'
import { Backup } from '@xen-orchestra/backups/Backup'
import { createLogger } from '@xen-orchestra/log'
import { parseMetadataBackupId } from '@xen-orchestra/backups/parseMetadataBackupId'
import { RestoreMetadataBackup } from '@xen-orchestra/backups/RestoreMetadataBackup'
import { Task } from '@xen-orchestra/backups/Task'

import { debounceWithKey, REMOVE_CACHE_ENTRY } from '../_pDebounceWithKey'
import { handleBackupLog } from '../_handleBackupLog'
import { waitAll } from '../_waitAll'
import { type Xapi } from '../xapi'
import { serializeError, type SimpleIdPattern, unboxIdsFromPattern } from '../utils'

import { type Executor, type Job } from './jobs'
import { type Schedule } from './scheduling'

const log = createLogger('xo:xo-mixins:metadata-backups')

const METADATA_BACKUP_JOB_TYPE = 'metadataBackup'

type ReportWhen = 'always' | 'failure' | 'never'

type Settings = {|
  reportWhen?: ReportWhen,
  retentionPoolMetadata?: number,
  retentionXoMetadata?: number,
|}

type MetadataBackupJob = {
  ...$Exact<Job>,
  pools?: SimpleIdPattern,
  proxy?: string,
  remotes: SimpleIdPattern,
  settings: $Dict<Settings>,
  type: METADATA_BACKUP_JOB_TYPE,
  xoMetadata?: boolean,
}

// metadata.json
//
// {
//   jobId: String,
//   jobName: String,
//   scheduleId: String,
//   scheduleName: String,
//   timestamp: number,
//   pool?: <Pool />
//   poolMaster?: <Host />
// }
//
// File structure on remotes:
//
// <remote>
// ├─ xo-config-backups
// │  └─ <schedule ID>
// │     └─ <YYYYMMDD>T<HHmmss>
// │        ├─ metadata.json
// │        └─ data.json
// └─ xo-pool-metadata-backups
//    └─ <schedule ID>
//       └─ <pool UUID>
//          └─ <YYYYMMDD>T<HHmmss>
//             ├─ metadata.json
//             └─ data
//
// Task logs emitted in a metadata backup execution:
//
// job.start(data: { reportWhen: ReportWhen })
// ├─ task.start(data: { type: 'pool', id: string, pool?: <Pool />, poolMaster?: <Host /> })
// │  ├─ task.start(data: { type: 'remote', id: string })
// │  │  └─ task.end
// │  └─ task.end
// ├─ task.start(data: { type: 'xo' })
// │  ├─ task.start(data: { type: 'remote', id: string })
// │  │  └─ task.end
// │  └─ task.end
// └─ job.end
export default class metadataBackup {
  _app: {
    createJob: ($Diff<MetadataBackupJob, {| id: string |}>) => Promise<MetadataBackupJob>,
    createSchedule: ($Diff<Schedule, {| id: string |}>) => Promise<Schedule>,
    deleteSchedule: (id: string) => Promise<void>,
    getXapi: (id: string) => Xapi,
    getJob: (id: string, ?METADATA_BACKUP_JOB_TYPE) => Promise<MetadataBackupJob>,
    updateJob: ($Shape<MetadataBackupJob>, ?boolean) => Promise<MetadataBackupJob>,
    removeJob: (id: string) => Promise<void>,
  }

  get runningMetadataRestores() {
    return this._runningMetadataRestores
  }

  constructor(app: any) {
    this._app = app
    this._logger = undefined
    this._runningMetadataRestores = new Set()

    const debounceDelay = app.config.getDuration('backups.listingDebounce')
    this._listXoMetadataBackups = debounceWithKey(this._listXoMetadataBackups, debounceDelay, remoteId => remoteId)
    this._listPoolMetadataBackups = debounceWithKey(this._listPoolMetadataBackups, debounceDelay, remoteId => remoteId)

    app.hooks.on('start', async () => {
      this._logger = await app.getLogger('metadataRestore')

      app.registerJobExecutor(METADATA_BACKUP_JOB_TYPE, this._executor.bind(this))
    })
  }

  async _executor({ cancelToken, job: job_, logger, runJobId, schedule }): Executor {
    const job: MetadataBackupJob = cloneDeep((job_: any))
    const scheduleSettings = job.settings[schedule.id]

    // it also replaces null retentions introduced by the commit
    // https://github.com/vatesfr/xen-orchestra/commit/fea5117ed83b58d3a57715b32d63d46e3004a094#diff-c02703199db2a4c217943cf8e02b91deR40
    if (scheduleSettings?.retentionXoMetadata == null) {
      delete scheduleSettings.retentionXoMetadata
    }
    if (scheduleSettings?.retentionPoolMetadata == null) {
      delete scheduleSettings.retentionPoolMetadata
    }

    const app = this._app
    job.xoMetadata = job.xoMetadata ? await app.exportConfig() : undefined

    const remoteIds = unboxIdsFromPattern(job.remotes)
    const proxyId = job.proxy
    try {
      if (proxyId !== undefined) {
        const recordToXapi = {}
        const servers = new Set()
        const handleRecord = uuid => {
          const serverId = app.getXenServerIdByObject(uuid)
          recordToXapi[uuid] = serverId
          servers.add(serverId)
        }
        unboxIdsFromPattern(job.pools).forEach(handleRecord)

        const remotes = {}
        const xapis = {}
        await waitAll([
          asyncMapSettled(remoteIds, async id => {
            const remote = await app.getRemoteWithCredentials(id)
            if (remote.proxy !== proxyId) {
              throw new Error(`The remote ${remote.name} must be linked to the proxy ${proxyId}`)
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
          streamLogs: true,
          xapis,
        }

        const logsStream = await app.callProxyMethod(proxyId, 'backup.run', params, {
          assertType: 'iterator',
        })

        const localTaskIds = { __proto__: null }

        let result
        for await (const log of logsStream) {
          result = handleBackupLog(log, {
            localTaskIds,
            logger,
            runJobId,
          })
        }
        return result
      } else {
        cancelToken.throwIfRequested()

        const localTaskIds = { __proto__: null }
        return Task.run(
          {
            name: 'backup run',
            onLog: log =>
              handleBackupLog(log, {
                localTaskIds,
                logger,
                runJobId,
              }),
          },
          () =>
            new Backup({
              config: this._app.config.get('backups'),
              getAdapter: async remoteId => app.getBackupsRemoteAdapter(await app.getRemoteWithCredentials(remoteId)),

              // `@xen-orchestra/backups/Backup` expect that `getConnectedRecord` returns a promise
              getConnectedRecord: async (xapiType, uuid) => app.getXapiObject(uuid),
              job,
              schedule,
            }).run()
        )
      }
    } finally {
      remoteIds.forEach(id => {
        this._listPoolMetadataBackups(REMOVE_CACHE_ENTRY, id)
        this._listXoMetadataBackups(REMOVE_CACHE_ENTRY, id)
      })
    }
  }

  async createMetadataBackupJob(
    props: $Diff<MetadataBackupJob, {| id: string |}>,
    schedules: $Dict<$Diff<Schedule, {| id: string |}>>
  ): Promise<MetadataBackupJob> {
    const app = this._app

    const job: MetadataBackupJob = await app.createJob({
      ...props,
      type: METADATA_BACKUP_JOB_TYPE,
    })

    const { id: jobId, settings } = job
    await asyncMapSettled(schedules, async (schedule, tmpId) => {
      const { id: scheduleId } = await app.createSchedule({
        ...schedule,
        jobId,
      })
      settings[scheduleId] = settings[tmpId]
      delete settings[tmpId]
    })
    await app.updateJob({ id: jobId, settings })

    return job
  }

  async deleteMetadataBackupJob(id: string): Promise<void> {
    const app = this._app
    const [schedules] = await Promise.all([
      app.getAllSchedules(),
      // it test if the job is of type metadataBackup
      app.getJob(id, METADATA_BACKUP_JOB_TYPE),
    ])

    await Promise.all([
      app.removeJob(id),
      asyncMapSettled(schedules, schedule => {
        if (schedule.id === id) {
          return app.deleteSchedule(id)
        }
      }),
    ])
  }

  // xoBackups
  // [{
  //   id: `${remoteId}/folderPath`,
  //   jobId,
  //   jobName,
  //   scheduleId,
  //   scheduleName,
  //   timestamp
  // }]
  async _listXoMetadataBackups(remoteId) {
    const app = this._app
    const remote = await app.getRemoteWithCredentials(remoteId)

    let backups
    if (remote.proxy !== undefined) {
      ;({ [remoteId]: backups } = await app.callProxyMethod(remote.proxy, 'backup.listXoMetadataBackups', {
        remotes: {
          [remoteId]: {
            url: remote.url,
            options: remote.options,
          },
        },
      }))
    } else {
      backups = await Disposable.use(app.getBackupsRemoteAdapter(remote), adapter => adapter.listXoMetadataBackups())
    }

    // inject the remote id on the backup which is needed for restoreMetadataBackup()
    backups.forEach(backup => {
      backup.id = `${remoteId}${backup.id}`
    })

    return backups
  }

  // poolBackups
  // {
  //   [<Pool ID>]: [{
  //     id: `${remoteId}/folderPath`,
  //     jobId,
  //     jobName,
  //     scheduleId,
  //     scheduleName,
  //     timestamp,
  //     pool,
  //     poolMaster,
  //   }]
  // }
  async _listPoolMetadataBackups(remoteId) {
    const app = this._app
    const remote = await app.getRemoteWithCredentials(remoteId)

    let backupsByPool
    if (remote.proxy !== undefined) {
      ;({ [remoteId]: backupsByPool } = await app.callProxyMethod(remote.proxy, 'backup.listPoolMetadataBackups', {
        remotes: {
          [remoteId]: {
            url: remote.url,
            options: remote.options,
          },
        },
      }))
    } else {
      backupsByPool = await Disposable.use(app.getBackupsRemoteAdapter(remote), adapter =>
        adapter.listPoolMetadataBackups()
      )
    }

    // inject the remote id on the backup which is needed for restoreMetadataBackup()
    Object.values(backupsByPool).forEach(backups =>
      backups.forEach(backup => {
        backup.id = `${remoteId}${backup.id}`
      })
    )

    return backupsByPool
  }

  //  {
  //    xo: {
  //      [remote ID]: xoBackups
  //    },
  //    pool: {
  //      [remote ID]: poolBackups
  //    }
  //  }
  async listMetadataBackups(remoteIds: string[]) {
    const xo = {}
    const pool = {}
    await Promise.all(
      remoteIds.map(async remoteId => {
        try {
          const [xoList, poolList] = await Promise.all([
            this._listXoMetadataBackups(remoteId),
            this._listPoolMetadataBackups(remoteId),
          ])
          if (xoList.length !== 0) {
            xo[remoteId] = xoList
          }
          if (Object.keys(poolList).length !== 0) {
            pool[remoteId] = poolList
          }
        } catch (error) {
          log.warn(`listMetadataBackups for remote ${remoteId}`, { error })
        }
      })
    )

    return {
      xo,
      pool,
    }
  }

  // Task logs emitted in a restore execution:
  //
  // task.start(message: 'restore', data: <Metadata />)
  // └─ task.end
  async restoreMetadataBackup(id: string) {
    const app = this._app
    const logger = this._logger
    const [remoteId, ...path] = id.split('/')
    const backupId = path.join('/')

    const remote = await app.getRemoteWithCredentials(remoteId)
    const { type, poolUuid } = parseMetadataBackupId(backupId)

    let rootTaskId
    const localTaskIds = { __proto__: null }
    const onLog = async log => {
      if (type === 'xoConfig' && localTaskIds[log.taskId] === rootTaskId && log.status === 'success') {
        try {
          await app.importConfig(log.result)

          // don't log the XO config
          log.result = undefined
        } catch (error) {
          log.result = serializeError(error)
          log.status = 'failure'
        }
      }

      handleBackupLog(log, {
        logger,
        localTaskIds,
        handleRootTaskId: id => {
          this._runningMetadataRestores.add(id)
          rootTaskId = id
        },
      })
    }

    try {
      if (remote.proxy !== undefined) {
        let xapi
        if (poolUuid !== undefined) {
          const { allowUnauthorized, host, password, username } = await app.getXenServer(
            app.getXenServerIdByObject(poolUuid)
          )
          xapi = {
            allowUnauthorized,
            credentials: {
              username,
              password,
            },
            url: host,
          }
        }

        const logsStream = await app.callProxyMethod(
          remote.proxy,
          'backup.restoreMetadataBackup',
          {
            backupId,
            remote: { url: remote.url, options: remote.options },
            xapi,
          },
          {
            assertType: 'iterator',
          }
        )
        for await (const log of logsStream) {
          onLog(log)
        }
      } else {
        const handler = await app.getRemoteHandler(remoteId)
        await Task.run(
          {
            name: 'metadataRestore',
            data: JSON.parse(String(await handler.readFile(`${backupId}/metadata.json`))),
            onLog,
          },
          async () =>
            new RestoreMetadataBackup({
              backupId,
              handler,
              xapi: poolUuid !== undefined ? await app.getXapi(poolUuid) : undefined,
            }).run()
        )
      }
    } finally {
      this._runningMetadataRestores.delete(rootTaskId)
    }
  }

  async deleteMetadataBackup(id: string) {
    const app = this._app
    const [remoteId, ...path] = id.split('/')
    const backupId = path.join('/')
    const remote = await app.getRemoteWithCredentials(remoteId)

    if (remote.proxy !== undefined) {
      await app.callProxyMethod(remote.proxy, 'backup.deleteMetadataBackup', {
        backupId,
        remote: { url: remote.url, options: remote.options },
      })
    } else {
      await Disposable.use(app.getBackupsRemoteAdapter(remote), adapter => adapter.deleteMetadataBackup(backupId))
    }

    if (parseMetadataBackupId(backupId).type === 'xoConfig') {
      this._listXoMetadataBackups(REMOVE_CACHE_ENTRY, remoteId)
    } else {
      this._listPoolMetadataBackups(REMOVE_CACHE_ENTRY, remoteId)
    }
  }
}
