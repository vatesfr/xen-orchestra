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
//    │ └─ <YYYYMMDD>T<HHmmss>.json
//    └─ <pool UUID>
//      └─ <YYYYMMDD>T<HHmmss>.json
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
    const files = []
    if (job.xoMetadata && retentionXoMetadata > 0) {
      files.push({
        data: await app.exportConfig(),
        dir: `${scheduleDir}/xo`,
        retention: retentionXoMetadata - 1,
      })
    }
    if (!isEmptyPools && retentionPoolMetadata > 0) {
      files.push(
        ...(await Promise.all(
          poolIds.map(async id => ({
            data: await app.getXapi(id).getPoolMetadata(cancelToken),
            dir: `${scheduleDir}/${id}`,
            retention: retentionPoolMetadata - 1,
          }))
        ))
      )
    }

    if (files.length === 0) {
      throw new Error('no retentions corresponding to the metadata modes found')
    }

    cancelToken.throwIfRequested()

    const timestamp = safeDateFormat(Date.now())
    return asyncMap(remoteIds, async id => {
      const handler = await app.getRemoteHandler(id)
      return files.map(async ({ data, dir, retention }) => {
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

        const fileName = `${dir}/${timestamp}.json`
        await handler.outputFile(fileName, JSON.stringify(data, null, 2))
        $defer.onFailure(() => handler.unlink(fileName))
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
