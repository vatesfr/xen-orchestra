import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import cloneDeep from 'lodash/cloneDeep.js'
import Disposable from 'promise-toolbox/Disposable'
import { createLogger } from '@xen-orchestra/log'
import { createRunner } from '@xen-orchestra/backups/Backup.mjs'
import { parseMetadataBackupId } from '@xen-orchestra/backups/parseMetadataBackupId.mjs'
import { RestoreMetadataBackup } from '@xen-orchestra/backups/RestoreMetadataBackup.mjs'
import { Task } from '@vates/task'

import { debounceWithKey, REMOVE_CACHE_ENTRY } from '../_pDebounceWithKey.mjs'
import { handleBackupLog } from '../_handleBackupLog.mjs'
import { waitAll } from '../_waitAll.mjs'
import { serializeError, unboxIdsFromPattern } from '../utils.mjs'

const log = createLogger('xo:xo-mixins:metadata-backups')

const METADATA_BACKUP_JOB_TYPE = 'metadataBackup'

export default class metadataBackup {
  get runningMetadataRestores() {
    return this._runningMetadataRestores
  }

  constructor(app) {
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

  async _executor({ cancelToken, job: job_, logger, runJobId, schedule }) {
    const job = cloneDeep(job_)
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

    if (job.xoMetadata) {
      const config = await app.exportConfig()
      job.xoMetadata = typeof config === 'string' ? config : { encoding: 'base64', data: config.toString('base64') }
    }

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
            const { allowUnauthorized, host, password, username } = await app.getXenServerWithCredentials(id)
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
            properties: { name: 'backup run' },
            onProgress: log =>
              handleBackupLog(log, {
                localTaskIds,
                logger,
                runJobId,
              }),
          },
          () =>
            createRunner({
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

  async createMetadataBackupJob(props, schedules) {
    const app = this._app

    const job = await app.createJob({
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

  async deleteMetadataBackupJob(id) {
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
  async listMetadataBackups(remoteIds) {
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
  async restoreMetadataBackup({ id, poolUuid }) {
    const app = this._app
    const logger = this._logger
    const [remoteId, ...path] = id.split('/')
    const backupId = path.join('/')

    const remote = await app.getRemoteWithCredentials(remoteId)
    let type
    if (poolUuid) {
      ;({ type } = parseMetadataBackupId(backupId))
    } else {
      ;({ type, poolUuid } = parseMetadataBackupId(backupId))
    }

    let rootTaskId
    const localTaskIds = { __proto__: null }
    const onLog = async log => {
      if (type === 'xoConfig' && localTaskIds[log.taskId] === rootTaskId && log.status === 'success') {
        try {
          const { result } = log
          await app.importConfig(typeof result === 'string' ? result : Buffer.from(result.data, result.encoding))

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
          const { allowUnauthorized, host, password, username } = await app.getXenServerWithCredentials(
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
            properties: {
              name: 'metadataRestore',
              metadata: JSON.parse(String(await handler.readFile(`${backupId}/metadata.json`))),
            },
            onProgress: onLog,
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

  async deleteMetadataBackup(id) {
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
