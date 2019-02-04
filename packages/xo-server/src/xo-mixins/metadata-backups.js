// @flow
import asyncMap from '@xen-orchestra/async-map'
import deferrable from 'golike-defer'

import { type SimpleIdPattern, unboxIdsFromPattern } from '../utils'
import { type Xapi } from '../xapi'

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
    const poolIds = unboxIdsFromPattern(job.pools)
    const isEmptyPools = poolIds.length === 0
    if (!job.xoMetadata && isEmptyPools) {
      throw new Error('no pools match this pattern')
    }

    const app = this._app
    const timestamp = new Date().toISOString()
    const filePromise = {}
    if (job.xoMetadata) {
      filePromise[`xo-metadata-${timestamp}.json`] = app.exportConfig()
    }
    if (!isEmptyPools) {
      for (const id of poolIds) {
        filePromise[`pool-metadata-${id}-${timestamp}.json`] = app
          .getXapi(id)
          .getPoolMetadata(cancelToken)
      }
    }

    cancelToken.throwIfRequested()
    const data = await asyncMap(filePromise, async (promise, fileName) => ({
      fileName,
      data: await promise,
    }))

    return asyncMap(unboxIdsFromPattern(job.remotes), async id => {
      const handler = await app.getRemoteHandler(id)
      return data.map(({ fileName, data }) => {
        $defer.onFailure(() => handler.unlink(fileName))
        return handler.outputFile(fileName, JSON.stringify(data, null, 2))
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

    const { id, settings } = job
    await asyncMap(schedules, async (schedule, tmpId) => {
      const { id: scheduleId } = await app.createSchedule({
        ...schedule,
        jobId: job.id,
      })
      settings[scheduleId] = settings[tmpId]
      delete settings[tmpId]
    })
    await app.updateJob({ id, settings })

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
          app.deleteSchedule(id)
        }
      }),
    ])
  }
}
