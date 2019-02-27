// @flow
import asyncMap from '@xen-orchestra/async-map'
import defer from 'golike-defer'
import { fromEvent, ignoreErrors } from 'promise-toolbox'

import { type Xapi } from '../xapi'
import {
  safeDateFormat,
  type SimpleIdPattern,
  unboxIdsFromPattern,
} from '../utils'

import { type Executor, type Job } from './jobs'
import { type Schedule } from './scheduling'

const METADATA_BACKUP_JOB_TYPE = 'metadataBackup'

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

  constructor(app: any) {
    this._app = app
    app.on('start', () => {
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

    const timestamp = safeDateFormat(Date.now())
    const files = []
    if (job.xoMetadata && retentionXoMetadata > 0) {
      const xoMetadataDir = `xo-config-backups/${schedule.id}`
      const dir = `${xoMetadataDir}/${timestamp}`

      const data = JSON.stringify(await app.exportConfig(), null, 2)
      const fileName = `${dir}/data.json`

      const metadata = JSON.stringify(
        {
          jobId: job.id,
          scheduleId: schedule.id,
          timestamp,
        },
        null,
        2
      )
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
            const poolMetadataDir = `xo-pool-metadata-backups/${
              schedule.id
            }/${id}`
            const dir = `${poolMetadataDir}/${timestamp}`

            // TODO: export the metadata only once then split the stream between remotes
            const stream = await app.getXapi(id).exportPoolMetadata(cancelToken)
            const fileName = `${dir}/data`

            const metadata = JSON.stringify(
              {
                jobId: job.id,
                scheduleId: schedule.id,
                poolId: id,
                timestamp,
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
}
