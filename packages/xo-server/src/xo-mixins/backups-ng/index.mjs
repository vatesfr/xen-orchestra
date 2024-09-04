import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import Disposable from 'promise-toolbox/Disposable'
import forOwn from 'lodash/forOwn.js'
import groupBy from 'lodash/groupBy.js'
import merge from 'lodash/merge.js'
import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { decorateWith } from '@vates/decorate-with'
import { formatVmBackups } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { HealthCheckVmBackup } from '@xen-orchestra/backups/HealthCheckVmBackup.mjs'
import { ImportVmBackup } from '@xen-orchestra/backups/ImportVmBackup.mjs'
import { createRunner } from '@xen-orchestra/backups/Backup.mjs'
import { invalidParameters } from 'xo-common/api-errors.js'
import { runBackupWorker } from '@xen-orchestra/backups/runBackupWorker.mjs'
import { Task } from '@vates/task'

import { debounceWithKey, REMOVE_CACHE_ENTRY } from '../../_pDebounceWithKey.mjs'
import { handleBackupLog } from '../../_handleBackupLog.mjs'
import { serializeError, unboxIdsFromPattern } from '../../utils.mjs'
import { waitAll } from '../../_waitAll.mjs'

const log = createLogger('xo:xo-mixins:backups-ng')

const parseVmBackupId = id => {
  const i = id.indexOf('/')
  return {
    metadataFilename: id.slice(i + 1),
    remoteId: id.slice(0, i),
  }
}

const extractIdsFromSimplePattern = pattern => {
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

export default class BackupNg {
  get runningRestores() {
    return this._runningRestores
  }

  constructor(app) {
    this._app = app
    this._logger = undefined
    this._runningRestores = new Set()

    app.hooks.on('start', async () => {
      this._logger = await app.getLogger('restore')

      const executor = async ({ cancelToken, data, job: job_, logger, runJobId, schedule }) => {
        const backupsConfig = app.config.get('backups')

        let job = job_
        let vmIds

        if (job.type === 'backup') {
          const vmsPattern = job.vms

          // Make sure we are passing only the VM to run which can be
          // different than the VMs in the job itself.
          vmIds = data?.vms ?? extractIdsFromSimplePattern(vmsPattern)

          await this._checkAuthorizations({ job, schedule, useSmartBackup: vmIds === undefined })
          if (vmIds === undefined) {
            const poolPattern = vmsPattern.$pool

            // Log a failure task when a pool contained in the smart backup
            // pattern doesn't exist
            if (poolPattern !== undefined) {
              const poolIds =
                extractIdsFromSimplePattern({ id: poolPattern }) ??
                poolPattern.__and?.flatMap?.(pattern => extractIdsFromSimplePattern({ id: pattern }) ?? []) ??
                []
              poolIds.forEach(id => {
                try {
                  app.getObject(id)
                } catch (error) {
                  const taskId = logger.notice('missing pool', {
                    data: {
                      type: 'pool',
                      id,
                    },
                    event: 'task.start',
                    parentId: runJobId,
                  })
                  logger.error('missing pool', {
                    event: 'task.end',
                    result: serializeError(error),
                    status: 'failure',
                    taskId,
                  })
                }
              })
            }

            vmIds = Object.keys(
              app.getObjects({
                filter: (() => {
                  const isMatchingVm = createPredicate({
                    type: 'VM',
                    ...vmsPattern,
                  })

                  return obj =>
                    isMatchingVm(obj) &&
                    // don't match replicated VMs created by this very job otherwise
                    // they will be replicated again and again
                    !('start' in obj.blockedOperations && obj.other['xo:backup:job'] === job.id) &&
                    // handle xo:no-bak and xo:no-bak=reason tags. For example : VMs from Health Check
                    !obj.tags.some(t => t.split('=', 1)[0] === 'xo:no-bak')
                })(),
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
        }

        const proxyId = job.proxy
        const useXoProxy = proxyId !== undefined
        const targetRemoteIds = unboxIdsFromPattern(job.remotes)
        try {
          if (!useXoProxy && backupsConfig.disableWorkers) {
            const localTaskIds = { __proto__: null }
            const vmBackupInfo = new Map()
            return await Task.run(
              {
                properties: { name: 'backup run' },
                onProgress: log =>
                  handleBackupLog(log, {
                    vmBackupInfo,
                    app: this._app,
                    jobName: job.name,
                    localTaskIds,
                    logger,
                    runJobId,
                  }),
              },
              () =>
                createRunner({
                  config: backupsConfig,
                  getAdapter: async remoteId =>
                    app.getBackupsRemoteAdapter(await app.getRemoteWithCredentials(remoteId)),

                  // `@xen-orchestra/backups/Backup` expect that `getConnectedRecord` returns a promise
                  getConnectedRecord: async (xapiType, uuid) => app.getXapiObject(uuid),
                  job,
                  schedule,
                }).run()
            )
          }

          const recordToXapi = {}
          const servers = new Set()
          const handleRecord = uuid => {
            try {
              const serverId = app.getXenServerIdByObject(uuid)
              recordToXapi[uuid] = serverId
              servers.add(serverId)
            } catch (error) {
              log.warn(error)
            }
          }
          // can be empty for mirror backup job
          vmIds?.forEach(handleRecord)
          unboxIdsFromPattern(job.srs).forEach(handleRecord)

          // add xapi specific to the health check SR if needed
          if (job.settings[schedule.id].healthCheckSr !== undefined) {
            handleRecord(job.settings[schedule.id].healthCheckSr)
          }

          const remotes = {}
          const xapis = {}
          const remoteErrors = {}
          await waitAll([
            asyncMapSettled([...targetRemoteIds, job.sourceRemote], async id => {
              if (id === undefined) {
                // job.sourceRemote is only defined in mirror backups
                return
              }
              let remote
              try {
                remote = await app.getRemoteWithCredentials(id)
              } catch (error) {
                log.warn('Error while instantiating remote', { error, remoteId: id })
                remoteErrors[id] = error
                return
              }
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
              const { allowUnauthorized, httpProxy, password, username } = await app.getXenServerWithCredentials(id)

              const xapi = app.getAllXapis()[id]

              xapis[id] = {
                allowUnauthorized,
                credentials: {
                  username,
                  password,
                },
                url: await xapi.getHostBackupUrl(xapi.pool.$master),

                // Currently, the HTTP proxy configured in XO is not passed to the XO Proxy
                // to avoid issues when the XO Proxy itself is used as an HTTP Proxy.
                //
                // Therefore, it's necessary to ensure that the XO Proxy can access the host
                // directly for the time being.
                httpProxy: useXoProxy ? undefined : httpProxy,
              }
            }),
          ])

          // update remotes list with only the enabled remotes
          // only keep the destination remote in case of a mirror backup
          const enabledTargetRemotes = Object.keys(remotes).filter(remoteId => remoteId !== job.sourceRemote)

          // Fails the job if all the target remotes are disabled
          //
          // TODO: integrate each failure in its own tasks and still proceed
          // with other tasks like rolling snapshot and replication.
          if (targetRemoteIds.length > 0 && enabledTargetRemotes.length === 0) {
            const error = new Error(`couldn't instantiate any remote`)
            error.errors = remoteErrors
            throw error
          }

          if (job.sourceRemote !== undefined && remotes[job.sourceRemote] === undefined) {
            const error = new Error(`couldn't instantiate source remote`)
            error.errors = remoteErrors
            throw error
          }

          job.remotes = {
            id: {
              __or: enabledTargetRemotes,
            },
          }

          const params = {
            job,
            recordToXapi,
            remotes,
            schedule,
            xapis,
          }

          if (useXoProxy) {
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
              const vmBackupInfo = new Map()
              for await (const log of logsStream) {
                result = handleBackupLog(log, {
                  vmBackupInfo,
                  app: this._app,
                  jobName: job.name,
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
            const vmBackupInfo = new Map()
            return await runBackupWorker(
              {
                config: backupsConfig,
                remoteOptions: app.config.get('remoteOptions'),
                resourceCacheDelay: app.config.getDuration('resourceCacheDelay'),
                xapiOptions: app.config.get('xapiOptions'),
                ...params,
              },
              log =>
                handleBackupLog(log, {
                  vmBackupInfo,
                  app: this._app,
                  jobName: job.name,
                  logger,
                  localTaskIds,
                  runJobId,
                })
            )
          }
        } finally {
          targetRemoteIds.forEach(id => this._listVmBackupsOnRemote(REMOVE_CACHE_ENTRY, id))
        }
      }
      app.registerJobExecutor('backup', executor)
      app.registerJobExecutor('mirrorBackup', executor)
    })
  }

  async createBackupNgJob(type, props, schedules) {
    const app = this._app
    const job = await app.createJob({ ...props, type, userId: this.apiContext?.user?.id })

    if (schedules !== undefined) {
      const { id, settings } = job
      const tmpIds = Object.keys(schedules)
      await asyncMapSettled(tmpIds, async tmpId => {
        const schedule = schedules[tmpId]
        schedule.jobId = id
        settings[(await app.createSchedule(schedule)).id] = settings[tmpId]
        delete settings[tmpId]
      })
      await app.updateJob({ id, settings })
    }

    return job
  }

  async _checkAuthorizations({ job, useSmartBackup, schedule }) {
    const { _app: app } = this

    if (job.type === 'metadataBackup') {
      await app.checkFeatureAuthorization('BACKUP.METADATA')
      // the other checks does not apply to metadata backups
      return
    }

    if (job.type === 'mirrorBackup') {
      await app.checkFeatureAuthorization('BACKUP.MIRROR')
    }

    if (job.mode === 'full') {
      await app.checkFeatureAuthorization('BACKUP.FULL')
    }

    if (job.mode === 'delta') {
      if (unboxIdsFromPattern(job.srs)?.length > 0) {
        await app.checkFeatureAuthorization('BACKUP.DELTA_REPLICATION')
      } else {
        await app.checkFeatureAuthorization('BACKUP.DELTA')
      }
    }
    if (useSmartBackup) {
      await app.checkFeatureAuthorization('BACKUP.SMART_BACKUP')
    }

    // this won't check a per VM settings
    const config = app.config.get('backups')

    // FIXME: does not take into account default values defined in @xen-orchestra/backups/Backup
    const jobSettings = {
      ...config.defaultSettings,
      ...config.vm?.defaultSettings,
      ...job.settings[''],
      ...job.settings[schedule.id],
    }

    if (jobSettings.checkpointSnapshot === true) {
      await app.checkFeatureAuthorization('BACKUP.WITH_RAM')
    }
    if (jobSettings.healthCheckSr !== undefined) {
      await app.checkFeatureAuthorization('BACKUP.HEALTHCHECK')
    }
  }

  async deleteBackupNgJob(id, type) {
    const app = this._app
    const [schedules] = await Promise.all([app.getAllSchedules(), app.getJob(id, type)])
    await Promise.all([
      app.removeJob(id),
      asyncMapSettled(schedules, schedule => {
        if (schedule.id === id) {
          app.deleteSchedule(schedule.id)
        }
      }),
    ])
  }

  deleteVmBackupNg(id) {
    return this.deleteVmBackupsNg([id])
  }

  async deleteVmBackupsNg(ids) {
    const app = this._app
    const backupsByRemote = groupBy(ids.map(parseVmBackupId), 'remoteId')
    await asyncMapSettled(Object.entries(backupsByRemote), async ([remoteId, backups]) => {
      const filenames = backups.map(_ => _.metadataFilename)
      const remote = await app.getRemoteWithCredentials(remoteId)
      if (remote.proxy !== undefined) {
        await app.callProxyMethod(remote.proxy, 'backup.deleteVmBackups', {
          filenames,
          remote: {
            url: remote.url,
            options: remote.options,
          },
        })
      } else {
        await Disposable.use(app.getBackupsRemoteAdapter(remote), adapter => adapter.deleteVmBackups(filenames))
      }

      this._listVmBackupsOnRemote(REMOVE_CACHE_ENTRY, remoteId)
    })
  }

  async importVmBackupNg(id, srId, settings) {
    const app = this._app
    const xapi = app.getXapi(srId)
    const sr = xapi.getObject(srId)

    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const remote = await app.getRemoteWithCredentials(remoteId)

    let rootTaskId
    const logger = this._logger
    try {
      let result
      if (remote.proxy !== undefined) {
        // httpProxy is ignored when using XO Proxy
        const { allowUnauthorized, host, password, username } = await app.getXenServerWithCredentials(
          app.getXenServerIdByObject(sr.$id)
        )

        const params = {
          backupId: metadataFilename,
          remote: {
            url: remote.url,
            options: remote.options,
          },
          settings,
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
            result = handleBackupLog(log, {
              logger,
              localTaskIds,
              handleRootTaskId: id => {
                this._runningRestores.add(id)
                rootTaskId = id
              },
              rootTaskId,
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
        result = await Disposable.use(app.getBackupsRemoteAdapter(remote), async adapter => {
          const metadata = await adapter.readVmBackupMetadata(metadataFilename)
          const localTaskIds = { __proto__: null }
          return Task.run(
            {
              properties: {
                backupId: id,
                jobId: metadata.jobId,
                name: 'restore',
                srId,
                time: metadata.timestamp,
              },
              onProgress: log =>
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
                settings,
                srUuid: srId,
                xapi: await app.getXapi(srId),
              }).run()
          )
        })
      }
      return result.id
    } finally {
      this._runningRestores.delete(rootTaskId)
    }
  }

  @decorateWith(
    debounceWithKey,
    function () {
      return this._app.config.getDuration('backups.listingDebounce')
    },
    function keyFn(remoteId) {
      return [this, remoteId]
    }
  )
  async _listVmBackupsOnRemote(remoteId) {
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
        backupsByVm = await Disposable.use(app.getBackupsRemoteAdapter(remote), async adapter =>
          formatVmBackups(await adapter.listAllVmBackups())
        )
      }

      // inject the remote id on the backup which is needed for importVmBackupNg()
      forOwn(backupsByVm, backups =>
        backups.forEach(backup => {
          backup.id = `${remoteId}/${backup.id}`
        })
      )
      return backupsByVm
    } catch (error) {
      log.warn(`listVmBackups for remote ${remoteId}:`, { error })
    }
  }

  async listVmBackupsNg(remotes, _forceRefresh = false) {
    const backupsByVmByRemote = {}

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

  async checkVmBackupNg(backupId, srId, settings) {
    // TODO : maybe adapt next line ? also present in other files
    await this._app.tasks
      .create({
        name: 'VM Backup Health Check',
        objectId: backupId,
        type: 'backup.vm.healthCheck',
      })
      .run(async () => {
        const app = this._app
        const xapi = app.getXapi(srId)
        const restoredId = await this.importVmBackupNg(backupId, srId, {
          ...settings,
          additionnalVmTag: 'xo:no-bak=Health Check',
        })

        const restoredVm = xapi.getObject(restoredId)
        try {
          await new HealthCheckVmBackup({
            restoredVm,
            xapi,
          }).run()
        } finally {
          await xapi.VM_destroy(restoredVm.$ref)
        }
      })
  }
}
