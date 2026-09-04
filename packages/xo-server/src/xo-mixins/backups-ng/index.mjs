import asyncMapSettled from '@xen-orchestra/async-map/legacy.js'
import Disposable from 'promise-toolbox/Disposable'
import forOwn from 'lodash/forOwn.js'
import groupBy from 'lodash/groupBy.js'
import merge from 'lodash/merge.js'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { decorateWith } from '@vates/decorate-with'
import { formatVmBackups } from '@xen-orchestra/backups/formatVmBackups.mjs'
import { HealthCheckVmBackup } from '@xen-orchestra/backups/HealthCheckVmBackup.mjs'
import { ImportVmBackup } from '@xen-orchestra/backups/ImportVmBackup.mjs'
import { createRunner } from '@xen-orchestra/backups/Backup.mjs'
import { invalidParameters, noMatchingVm } from 'xo-common/api-errors.js'
import { timeout } from 'promise-toolbox'
import { runBackupWorker } from '@xen-orchestra/backups/runBackupWorker.mjs'
import { Task } from '@vates/task'

import { debounceWithKey, REMOVE_CACHE_ENTRY } from '../../_pDebounceWithKey.mjs'
import { forwardResult, handleBackupLog } from '../../_handleBackupLog.mjs'
import { serializeError, unboxIdsFromPattern } from '../../utils.mjs'
import { waitAll } from '../../_waitAll.mjs'

const logger = createLogger('xo:xo-mixins:backups-ng')

/**
 * @typedef {import('@vates/types').XoBackupRepository} XoBackupRepository
 * @typedef {import('@vates/types').XoVm} XoVm
 * @typedef {import('@vates/types').XoVmBackupArchive} XoVmBackupArchive
 *
 * @typedef {Record<XoVm['id'], XoVmBackupArchive[]>} BackupsByVm
 * @typedef {{ backupsByVm?: BackupsByVm, error?: Error }} RemoteListingResult
 * @typedef {{ _forceRefresh?: boolean, vmId?: XoVm['id'] }} ListVmBackupsOpts
 * @typedef {{ attempt: number, nextAttemptAt: number, error: Error }} ListingRetryState
 */

// a remote whose listing failed is not listed again before this delay
const LISTING_RETRY_DELAY = 30e3
const LISTING_TIMEOUT = 30e3
const LISTING_RETRY_MAX_DELAY = 60 * 60 * 1e3 // cap at 1h
/**
 * @param {number} attempt number of consecutive failures so far, `0` for the first one
 * @returns {number} delay in ms before the next attempt is allowed
 */
export function backupsListingRetryDelay(attempt) {
  let prev = 1
  let curr = 1

  for (let i = 0; i < attempt; i++) {
    const next = prev + curr
    prev = curr
    curr = next
  }

  return Math.min(prev * LISTING_RETRY_DELAY, LISTING_RETRY_MAX_DELAY)
}

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
    this._runningRestores = new Set()

    /** @type {Record<XoBackupRepository['id'], ListingRetryState>} */
    this._backupsListingRetry = { __proto__: null }
    /** @type {Record<XoBackupRepository['id'], Promise<BackupsByVm>>} */
    this._trackedBackupsListings = { __proto__: null }

    app.hooks.on('start', async () => {
      const executor = async ({
        cancelToken,
        data,
        job,
        jobData,
        jobUpdateFct,
        logger: jobsLogger,
        runJobId,
        schedule,
      }) => {
        const backupsConfig = app.config.get('backups')

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
                  const taskId = jobsLogger.notice('missing pool', {
                    data: {
                      type: 'pool',
                      id,
                    },
                    event: 'task.start',
                    parentId: runJobId,
                  })
                  jobsLogger.error('missing pool', {
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
              throw noMatchingVm({ runJobId, jobId: job.id, scheduleId: schedule.id })
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
            const onLogFct = app.tasks.createExternalProgressHandler({
              onRootTaskStart: log => {
                jobUpdateFct(log.id).catch(logger.warn) // is async, but makeOnProgress doesn't await onRootTaskXXX functions
              },
              onTaskUpdate: (log, event) => {
                handleBackupLog(log, event, { app: this._app, jobName: job.name })
              },
            })
            return await Task.run(
              {
                properties: { name: 'backup run', ...jobData },
                onProgress: onLogFct,
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
              logger.warn(error)
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
                logger.warn('Error while instantiating remote', { error, remoteId: id })
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
            jobData,
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

              let result
              const onLogFct = app.tasks.createExternalProgressHandler({
                onRootTaskStart: log => {
                  jobUpdateFct(log.id).catch(logger.warn) // is async, but makeOnProgress doesn't await onRootTaskXXX functions
                },
                onRootTaskEnd: log => {
                  result = forwardResult(log)
                },
                onTaskUpdate: (log, event) => {
                  handleBackupLog(log, event, { app: this._app, jobName: job.name })
                },
              })

              for await (const log of logsStream) {
                onLogFct(log)
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
            let result
            const onLogFct = app.tasks.createExternalProgressHandler({
              onRootTaskStart: log => {
                jobUpdateFct(log.id).catch(logger.warn) // is async, but makeOnProgress doesn't await onRootTaskXXX functions
              },
              onRootTaskEnd: log => {
                result = forwardResult(log)
              },
              onTaskUpdate: (log, event) => {
                handleBackupLog(log, event, { app: this._app, jobName: job.name })
              },
            })

            await runBackupWorker(
              {
                config: backupsConfig,
                jobData,
                remoteOptions: app.config.get('remoteOptions'),
                resourceCacheDelay: app.config.getDuration('resourceCacheDelay'),
                xapiOptions: app.config.get('xapiOptions'),
                ...params,
              },
              onLogFct
            )
            return result
          }
        } finally {
          targetRemoteIds.forEach(id => this.invalidateVmBackupsListing(id))
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

      this.invalidateVmBackupsListing(remoteId)
    })
  }

  async importVmBackupNg(id, srId, settings) {
    const app = this._app
    const xapi = app.getXapi(srId)
    const sr = xapi.getObject(srId)

    const { metadataFilename, remoteId } = parseVmBackupId(id)
    const remote = await app.getRemoteWithCredentials(remoteId)

    let rootTaskId
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

          const onLogFct = app.tasks.createExternalProgressHandler({
            onRootTaskStart: log => {
              this._runningRestores.add(log.id)
              rootTaskId = log.id
            },
            onRootTaskEnd: log => {
              result = forwardResult(log)
            },
            onTaskUpdate: (log, event) => {
              handleBackupLog(log, event)
            },
          })

          for await (const log of logsStream) {
            onLogFct(log)
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

          const onLogFct = app.tasks.createExternalProgressHandler({
            onRootTaskStart: log => {
              this._runningRestores.add(log.id)
              rootTaskId = log.id
            },
            onTaskUpdate: (log, event) => {
              handleBackupLog(log, event)
            },
          })

          return Task.run(
            {
              properties: {
                name: 'restore',
                backupId: id,
                jobId: metadata.jobId,
                srId,
                time: metadata.timestamp,
              },
              onProgress: onLogFct,
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
  /**
   * rejects when the listing failed, `_listVmBackupsWithBackoff()` is in charge of handling it
   *
   * the timeout must be *inside* the debounced call: a listing which never settles (it can happen
   * on NFS/SMB) would otherwise stay cached forever and each caller would pay `LISTING_TIMEOUT`
   * again
   *
   * @param {XoBackupRepository['id']} remoteId
   * @param {{ vmId?: XoVm['id'] }} [opts]
   * @returns {Promise<BackupsByVm>}
   */
  _listVmBackupsOnRemote(remoteId, opts) {
    return timeout.call(this._listVmBackupsOnRemoteUncached(remoteId, opts), LISTING_TIMEOUT)
  }

  /**
   * @param {XoBackupRepository['id']} remoteId
   * @param {{ vmId?: XoVm['id'] }} [opts]
   * @returns {Promise<BackupsByVm>}
   */
  async _listVmBackupsOnRemoteUncached(remoteId, { vmId } = {}) {
    const app = this._app
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
        vmId,
      }))
    } else {
      backupsByVm = await Disposable.use(app.getBackupsRemoteAdapter(remote), async adapter => {
        let vmBackups
        if (vmId !== undefined) {
          vmBackups = { [vmId]: await adapter.listVmBackups(vmId) }
        } else {
          vmBackups = await adapter.listAllVmBackups()
        }

        return formatVmBackups(vmBackups, remote.id)
      })
    }

    // inject the remote id on the backup which is needed for importVmBackupNg()
    forOwn(backupsByVm, backups =>
      backups.forEach(backup => {
        backup.id = `${remoteId}/${backup.id}`
      })
    )
    return backupsByVm
  }

  /**
   * @param {XoBackupRepository['id']} remoteId
   * @param {Error} error
   */
  _scheduleVmBackupsListingRetry(remoteId, error) {
    const retries = this._backupsListingRetry
    let state = retries[remoteId]
    if (state === undefined) {
      state = retries[remoteId] = { attempt: 0 }
    }

    const attempt = state.attempt++
    const delay = backupsListingRetryDelay(attempt)
    state.error = error
    state.nextAttemptAt = Date.now() + delay

    // warn on the first failure so that an unreachable backup repository is visible in the
    // logs, then debug to avoid flooding them while it keeps failing
    const log = attempt === 0 ? logger.warn : logger.debug
    log(`listVmBackups for remote ${remoteId} failed, not retrying before ${delay}ms`, { error })
  }

  /**
   * never rejects: a failed listing is reported as `error` so that a caller can tell it apart
   * from a remote which has no backups
   *
   * @param {XoBackupRepository['id']} remoteId
   * @param {{ vmId?: XoVm['id'] }} [opts]
   * @returns {Promise<RemoteListingResult>} `error` is set when the listing failed, took longer
   * than `LISTING_TIMEOUT`, or was skipped because the remote is in its retry delay
   */
  _listVmBackupsWithBackoff(remoteId, { vmId } = {}) {
    const state = this._backupsListingRetry[remoteId]
    if (state !== undefined && state.nextAttemptAt > Date.now()) {
      // report the failure which put this remote in its retry delay
      return Promise.resolve({ error: state.error })
    }

    const promise = this._listVmBackupsOnRemote(remoteId, { vmId })

    // this promise is returned to every caller of the debounce window, even after it has settled:
    // only track its outcome once, and keep tracking it after it settles or a late caller would
    // count it a second time
    if (this._trackedBackupsListings[remoteId] !== promise) {
      this._trackedBackupsListings[remoteId] = promise
      promise.then(
        () => {
          // ignore the outcome of a listing which has been invalidated in the meantime
          if (this._trackedBackupsListings[remoteId] === promise) {
            delete this._backupsListingRetry[remoteId]
          }
        },
        error => {
          if (this._trackedBackupsListings[remoteId] === promise) {
            this._scheduleVmBackupsListingRetry(remoteId, error)
          }
        }
      )
    }

    return promise.then(
      backupsByVm => ({ backupsByVm }),
      error => ({ error })
    )
  }

  /**
   * a backup repository whose listing failed is reported as `null` so that a slow or unreachable
   * one does not prevent the others from being listed
   *
   * @param {XoBackupRepository['id'][]} remotes
   * @param {ListVmBackupsOpts} [opts]
   * @returns {Promise<Record<XoBackupRepository['id'], BackupsByVm | null>>}
   */
  async listVmBackupsNg(remotes, { _forceRefresh = false, vmId } = {}) {
    /** @type {Record<XoBackupRepository['id'], BackupsByVm | null>} */
    const backupsByVmByRemote = {}

    await asyncEach(remotes, async remoteId => {
      if (_forceRefresh) {
        this.invalidateVmBackupsListing(remoteId)
      }

      const { backupsByVm, error } = await this._listVmBackupsWithBackoff(remoteId, { vmId })

      // `null` = the listing failed, an empty object = this repository has no backups
      backupsByVmByRemote[remoteId] = error === undefined ? backupsByVm : null
    })

    return backupsByVmByRemote
  }

  async checkVmBackupNg(backupId, srId, settings) {
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
          additionalVmTag: 'xo:no-bak=Health Check',
          vmNamePrefix: '[Health Check] ',
        })

        const restoredVm = xapi.getObject(restoredId)
        try {
          await new HealthCheckVmBackup({
            restoredVm,
            xapi,
          }).run()
        } finally {
          await xapi.VM_destroy(restoredVm.$ref, { bypassBlockedOperation: true })
        }
      })
  }
  /**
   * drops the cached listing of a backup repository and its retry state, so that it is listed
   * again on the next call instead of waiting for the current backoff delay
   *
   * the outcome of a listing which is still running is ignored: it no longer represents the
   * current state of the repository
   *
   * public because it is also called by the remotes mixin when a backup repository is updated
   * or removed
   *
   * @param {XoBackupRepository['id']} remoteId
   */
  invalidateVmBackupsListing(remoteId) {
    this._listVmBackupsOnRemote(REMOVE_CACHE_ENTRY, remoteId)
    delete this._trackedBackupsListings[remoteId]
    delete this._backupsListingRetry[remoteId]
  }
}
