// @flow
import asyncMap from '@xen-orchestra/async-map'
import createLogger from '@xen-orchestra/log'
import defer from 'golike-defer'
import { fromEvent, ignoreErrors } from 'promise-toolbox'

import debounceWithKey from '../_pDebounceWithKey'
import parseDuration from '../_parseDuration'
import { type Xapi } from '../xapi'
import {
  safeDateFormat,
  serializeError,
  type SimpleIdPattern,
  unboxIdsFromPattern,
} from '../utils'

import { type Executor, type Job } from './jobs'
import { type Schedule } from './scheduling'

const log = createLogger('xo:xo-mixins:metadata-backups')

const DIR_XO_CONFIG_BACKUPS = 'xo-config-backups'
const DIR_XO_POOL_METADATA_BACKUPS = 'xo-pool-metadata-backups'
const METADATA_BACKUP_JOB_TYPE = 'metadataBackup'

const compareTimestamp = (a, b) => a.timestamp - b.timestamp

type Settings = {|
  retentionXoMetadata?: number,
  retentionPoolMetadata?: number,
|}

type MetadataBackupJob = {
  ...$Exact<Job>,
  pools?: SimpleIdPattern,
  remotes: SimpleIdPattern,
  settings: $Dict<Settings>,
  type: METADATA_BACKUP_JOB_TYPE,
  xoMetadata?: boolean,
}

const createSafeReaddir = (handler, methodName) => (path, options) =>
  handler.list(path, options).catch(error => {
    if (error?.code !== 'ENOENT') {
      log.warn(`${methodName} ${path}`, { error })
    }
    return []
  })

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
export default class metadataBackup {
  _app: {
    createJob: (
      $Diff<MetadataBackupJob, {| id: string |}>
    ) => Promise<MetadataBackupJob>,
    createSchedule: ($Diff<Schedule, {| id: string |}>) => Promise<Schedule>,
    deleteSchedule: (id: string) => Promise<void>,
    getXapi: (id: string) => Xapi,
    getJob: (
      id: string,
      ?METADATA_BACKUP_JOB_TYPE
    ) => Promise<MetadataBackupJob>,
    updateJob: (
      $Shape<MetadataBackupJob>,
      ?boolean
    ) => Promise<MetadataBackupJob>,
    removeJob: (id: string) => Promise<void>,
  }

  get runningMetadataRestores() {
    return this._runningMetadataRestores
  }

  constructor(app: any, { backup }) {
    this._app = app
    this._logger = undefined
    this._runningMetadataRestores = new Set()

    const debounceDelay = parseDuration(backup.listingDebounce)
    this._listXoMetadataBackups = debounceWithKey(
      this._listXoMetadataBackups,
      debounceDelay,
      remoteId => remoteId
    )
    this.__listPoolMetadataBackups = debounceWithKey(
      this._listPoolMetadataBackups,
      debounceDelay,
      remoteId => remoteId
    )

    app.on('start', async () => {
      this._logger = await app.getLogger('metadataRestore')

      app.registerJobExecutor(
        METADATA_BACKUP_JOB_TYPE,
        this._executor.bind(this)
      )
    })
  }

  async _executor({ cancelToken, job: job_, schedule }): Executor {
    if (schedule === undefined) {
      throw new Error('backup job cannot run without a schedule')
    }

    const job: MetadataBackupJob = (job_: any)
    const remoteIds = unboxIdsFromPattern(job.remotes)
    if (remoteIds.length === 0) {
      throw new Error('metadata backup job cannot run without remotes')
    }

    const poolIds = unboxIdsFromPattern(job.pools)
    const isEmptyPools = poolIds.length === 0
    if (!job.xoMetadata && isEmptyPools) {
      throw new Error('no metadata mode found')
    }

    const app = this._app
    const { retentionXoMetadata, retentionPoolMetadata } =
      job?.settings[schedule.id] || {}

    const timestamp = Date.now()
    const formattedTimestamp = safeDateFormat(timestamp)
    const commonMetadata = {
      jobId: job.id,
      jobName: job.name,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      timestamp,
    }

    const files = []
    if (job.xoMetadata && retentionXoMetadata > 0) {
      const xoMetadataDir = `${DIR_XO_CONFIG_BACKUPS}/${schedule.id}`
      const dir = `${xoMetadataDir}/${formattedTimestamp}`

      const data = JSON.stringify(await app.exportConfig(), null, 2)
      const fileName = `${dir}/data.json`

      const metadata = JSON.stringify(commonMetadata, null, 2)
      const metaDataFileName = `${dir}/metadata.json`

      files.push({
        executeBackup: defer(($defer, handler) => {
          $defer.onFailure(() => handler.rmtree(dir))
          return Promise.all([
            handler.outputFile(fileName, data),
            handler.outputFile(metaDataFileName, metadata),
          ])
        }),
        dir: xoMetadataDir,
        retention: retentionXoMetadata,
      })
    }
    if (!isEmptyPools && retentionPoolMetadata > 0) {
      files.push(
        ...(await Promise.all(
          poolIds.map(async id => {
            const poolMetadataDir = `${DIR_XO_POOL_METADATA_BACKUPS}/${
              schedule.id
            }/${id}`
            const dir = `${poolMetadataDir}/${formattedTimestamp}`

            // TODO: export the metadata only once then split the stream between remotes
            const stream = await app.getXapi(id).exportPoolMetadata(cancelToken)
            const fileName = `${dir}/data`

            const xapi = this._app.getXapi(id)
            const metadata = JSON.stringify(
              {
                ...commonMetadata,
                pool: xapi.pool,
                poolMaster: await xapi.getRecord('host', xapi.pool.master),
              },
              null,
              2
            )
            const metaDataFileName = `${dir}/metadata.json`

            return {
              executeBackup: defer(($defer, handler) => {
                $defer.onFailure(() => handler.rmtree(dir))
                return Promise.all([
                  (async () => {
                    const outputStream = await handler.createOutputStream(
                      fileName
                    )
                    $defer.onFailure(() => outputStream.destroy())

                    // 'readable-stream/pipeline' not call the callback when an error throws
                    // from the readable stream
                    stream.pipe(outputStream)
                    return fromEvent(stream, 'end').catch(error => {
                      if (error.message !== 'aborted') {
                        throw error
                      }
                    })
                  })(),
                  handler.outputFile(metaDataFileName, metadata),
                ])
              }),
              dir: poolMetadataDir,
              retention: retentionPoolMetadata,
            }
          })
        ))
      )
    }

    if (files.length === 0) {
      throw new Error('no retentions corresponding to the metadata modes found')
    }

    cancelToken.throwIfRequested()

    const timestampReg = /^\d{8}T\d{6}Z$/
    return asyncMap(
      // TODO: emit a warning task if a remote is broken
      asyncMap(remoteIds, id => app.getRemoteHandler(id)::ignoreErrors()),
      async handler => {
        if (handler === undefined) {
          return
        }

        await Promise.all(
          files.map(async ({ executeBackup, dir, retention }) => {
            await executeBackup(handler)

            // deleting old backups
            await handler.list(dir).then(list => {
              list.sort()
              list = list
                .filter(timestampDir => timestampReg.test(timestampDir))
                .slice(0, -retention)
              return Promise.all(
                list.map(timestampDir =>
                  handler.rmtree(`${dir}/${timestampDir}`)
                )
              )
            })
          })
        )
      }
    )
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
    await asyncMap(schedules, async (schedule, tmpId) => {
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
      asyncMap(schedules, schedule => {
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
  async _listXoMetadataBackups(remoteId, handler) {
    const safeReaddir = createSafeReaddir(handler, 'listXoMetadataBackups')

    const backups = []
    await asyncMap(
      safeReaddir(DIR_XO_CONFIG_BACKUPS, { prependDir: true }),
      scheduleDir =>
        asyncMap(
          safeReaddir(scheduleDir, { prependDir: true }),
          async backupDir => {
            try {
              backups.push({
                id: `${remoteId}${backupDir}`,
                ...JSON.parse(
                  String(await handler.readFile(`${backupDir}/metadata.json`))
                ),
              })
            } catch (error) {
              log.warn(`listXoMetadataBackups ${backupDir}`, { error })
            }
          }
        )
    )

    return backups.sort(compareTimestamp)
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
  async _listPoolMetadataBackups(remoteId, handler) {
    const safeReaddir = createSafeReaddir(handler, 'listXoMetadataBackups')

    const backupsByPool = {}
    await asyncMap(
      safeReaddir(DIR_XO_POOL_METADATA_BACKUPS, { prependDir: true }),
      scheduleDir =>
        asyncMap(safeReaddir(scheduleDir), poolId => {
          const backups = backupsByPool[poolId] ?? (backupsByPool[poolId] = [])
          return asyncMap(
            safeReaddir(`${scheduleDir}/${poolId}`, { prependDir: true }),
            async backupDir => {
              try {
                backups.push({
                  id: `${remoteId}${backupDir}`,
                  ...JSON.parse(
                    String(await handler.readFile(`${backupDir}/metadata.json`))
                  ),
                })
              } catch (error) {
                log.warn(`listPoolMetadataBackups ${backupDir}`, {
                  error,
                })
              }
            }
          )
        })
    )

    // delete empty entries and sort backups
    Object.keys(backupsByPool).forEach(poolId => {
      const backups = backupsByPool[poolId]
      if (backups.length === 0) {
        delete backupsByPool[poolId]
      } else {
        backups.sort(compareTimestamp)
      }
    })

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
    const app = this._app

    const xo = {}
    const pool = {}
    await Promise.all(
      remoteIds.map(async remoteId => {
        try {
          const handler = await app.getRemoteHandler(remoteId)

          const [xoList, poolList] = await Promise.all([
            this._listXoMetadataBackups(remoteId, handler),
            this._listPoolMetadataBackups(remoteId, handler),
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
    const message = 'metadataRestore'
    const [remoteId, dir, ...path] = id.split('/')
    const handler = await app.getRemoteHandler(remoteId)
    const metadataFolder = `${dir}/${path.join('/')}`

    const taskId = logger.notice(message, {
      event: 'task.start',
      data: JSON.parse(
        String(await handler.readFile(`${metadataFolder}/metadata.json`))
      ),
    })
    try {
      this._runningMetadataRestores.add(taskId)

      let result
      if (dir === DIR_XO_CONFIG_BACKUPS) {
        result = await app.importConfig(
          JSON.parse(
            String(await handler.readFile(`${metadataFolder}/data.json`))
          )
        )
      } else {
        result = await app
          .getXapi(path[1])
          .importPoolMetadata(
            await handler.createReadStream(`${metadataFolder}/data`),
            true
          )
      }

      logger.notice(message, {
        event: 'task.end',
        result,
        status: 'success',
        taskId,
      })
    } catch (error) {
      logger.error(message, {
        event: 'task.end',
        result: serializeError(error),
        status: 'failure',
        taskId,
      })
      throw error
    } finally {
      this._runningMetadataRestores.delete(taskId)
    }
  }

  async deleteMetadataBackup(id: string) {
    const uuidReg = '\\w{8}(-\\w{4}){3}-\\w{12}'
    const metadataDirReg = 'xo-(config|pool-metadata)-backups'
    const timestampReg = '\\d{8}T\\d{6}Z'

    const regexp = new RegExp(
      `^/?${uuidReg}/${metadataDirReg}/${uuidReg}(/${uuidReg})?/${timestampReg}`
    )

    if (!regexp.test(id)) {
      throw new Error(`The id (${id}) not correspond to a metadata folder`)
    }
    const app = this._app
    const [remoteId, ...path] = id.split('/')

    const handler = await app.getRemoteHandler(remoteId)
    return handler.rmtree(path.join('/'))
  }
}
