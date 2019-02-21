// @flow
import asyncMap from '@xen-orchestra/async-map'
import deferrable from 'golike-defer'

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
//    │ ├─ <YYYYMMDD>T<HHmmss>.metadata.json
//    │ └─ <YYYYMMDD>T<HHmmss>.json
//    └─ <pool UUID>
//      ├─ <YYYYMMDD>T<HHmmss>.metadata.json
//      └─ <YYYYMMDD>T<HHmmss>.xml
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
      const dir = `${scheduleDir}/xo`
      const fileName = `${dir}/${timestamp}.json`
      const metaDataFileName = `${dir}/${timestamp}.metadata.json`

      const data = await app.exportConfig()

      files.push({
        executeBackup: async handler => {
          await Promise.all([
            handler.outputFile(fileName, JSON.stringify(data, null, 2)),
            handler.outputFile(
              metaDataFileName,
              JSON.stringify(
                {
                  jobId: job.id,
                  scheduleId: schedule.id,
                  timestamp,
                },
                null,
                2
              )
            ),
          ])
          $defer.onFailure(async () => {
            await Promise.all([
              handler.unlink(fileName),
              handler.unlink(metaDataFileName),
            ])
          })
        },
        dir,
        retention: retentionXoMetadata - 1,
      })
    }
    if (!isEmptyPools && retentionPoolMetadata > 0) {
      const retention = retentionPoolMetadata - 1
      files.push(
        ...(await Promise.all(
          poolIds.map(async id => {
            const dir = `${scheduleDir}/${id}`
            const fileName = `${dir}/${timestamp}.xml`
            const metaDataFileName = `${dir}/${timestamp}.metadata.json`

            const stream = await app.getXapi(id).getPoolMetadata(cancelToken)

            return {
              executeBackup: async handler => {
                const [outputStream] = await Promise.all([
                  handler.createOutputStream(fileName),
                  handler.outputFile(
                    metaDataFileName,
                    JSON.stringify(
                      {
                        jobId: job.id,
                        scheduleId: schedule.id,
                        poolId: id,
                        timestamp,
                      },
                      null,
                      2
                    )
                  ),
                ])
                stream.pipe(outputStream)
                $defer.onFailure(async () => {
                  await Promise.all([
                    handler.unlink(fileName),
                    handler.unlink(metaDataFileName),
                  ])
                })
              },
              dir,
              retention,
            }
          })
        ))
      )
    }

    if (files.length === 0) {
      throw new Error('no retentions corresponding to the metadata modes found')
    }

    cancelToken.throwIfRequested()

    return asyncMap(remoteIds, async id => {
      const handler = await app.getRemoteHandler(id)
      return files.map(async ({ executeBackup, dir, retention }) => {
        // deleting old backups
        await handler.list(dir).then(
          list => {
            if (retention > 0) {
              list = list.slice(0, -retention)
            }
            return Promise.all(
              list.map(fileToDelete => handler.unlink(`${dir}/${fileToDelete}`))
            )
          },
          () => {}
        )

        await executeBackup(handler)
      })
    })
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
    await app.updateJob({ jobId, settings })

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
