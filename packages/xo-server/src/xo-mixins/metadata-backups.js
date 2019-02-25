// @flow
import asyncMap from '@xen-orchestra/async-map'
import deferrable from 'golike-defer'
import { ignoreErrors } from 'promise-toolbox'
import { pipeline } from 'readable-stream'

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

const METADATA_BACKUP_DIR = 'xo-metadata-backups'

// File structure on remotes:
//
// <remote>
// └─ xo-metadata-backups
//   └─ <schedule ID>
//    ├─ xo
//    │ └─ <YYYYMMDD>T<HHmmss>
//    │   ├─ metadata.json
//    │   └─ data.json
//    └─ <pool UUID>
//      └─ <YYYYMMDD>T<HHmmss>
//        ├─ metadata.json
//        └─ data
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

  @deferrable
  async _executor($defer, { cancelToken, job: job_, schedule }): Executor {
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

    const scheduleDir = `${METADATA_BACKUP_DIR}/${schedule.id}`
    const timestamp = safeDateFormat(Date.now())
    const files = []
    if (job.xoMetadata && retentionXoMetadata > 0) {
      const xoDir = `${scheduleDir}/xo`
      const dir = `${xoDir}/${timestamp}`

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
        executeBackup: async handler => {
          await Promise.all([
            handler.outputFile(fileName, data),
            handler.outputFile(metaDataFileName, metadata),
          ])
          $defer.onFailure(() => handler.rmtree(dir))
        },
        dir: xoDir,
        retention: retentionXoMetadata,
      })
    }
    if (!isEmptyPools && retentionPoolMetadata > 0) {
      files.push(
        ...(await Promise.all(
          poolIds.map(async id => {
            const metadataDir = `${scheduleDir}/${id}`
            const dir = `${metadataDir}/${timestamp}`

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
              executeBackup: async handler => {
                const [outputStream] = await Promise.all([
                  handler.createOutputStream(fileName),
                  handler.outputFile(metaDataFileName, metadata),
                ])
                pipeline(stream, outputStream)
                $defer.onFailure(() => handler.rmtree(dir))
              },
              dir: metadataDir,
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

    return asyncMap(
      // TODO: emit a warning task if a remote is broken
      asyncMap(remoteIds, id => app.getRemoteHandler(id)::ignoreErrors()),
      async handler => {
        if (handler === undefined) {
          return
        }

        for (const { executeBackup, dir, retention } of files) {
          await executeBackup(handler)

          // deleting old backups
          await handler.list(dir).then(list => {
            list.sort()
            list = list.slice(0, -retention)
            return Promise.all(
              list.map(timestampDir =>
                handler.rmtree(`${dir}/${timestampDir}`)::ignoreErrors()
              )
            )
          })
        }
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
