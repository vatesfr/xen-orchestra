// @flow

import type { Pattern } from 'value-matcher'

import asyncMap from '@xen-orchestra/async-map'
import { CancelToken, ignoreErrors } from 'promise-toolbox'
import { map as mapToArray } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'

import Collection from '../../collection/redis'
import patch from '../../patch'
import { serializeError } from '../../utils'

import type Logger from '../logs/loggers/abstract'
import { type Schedule } from '../scheduling'

import executeCall from './execute-call'

// ===================================================================

export type Job = {
  id: string,
  name: string,
  type: string,
  userId: string,
}

type ParamsVector =
  | {|
      items: Array<Object>,
      type: 'crossProduct',
    |}
  | {|
      mapping: Object,
      type: 'extractProperties',
      value: Object,
    |}
  | {|
      pattern: Pattern,
      type: 'fetchObjects',
    |}
  | {|
      collection: Object,
      iteratee: Function,
      paramName?: string,
      type: 'map',
    |}
  | {|
      type: 'set',
      values: any,
    |}

export type CallJob = {|
  ...$Exact<Job>,
  method: string,
  paramsVector: ParamsVector,
  timeout?: number,
  type: 'call',
|}

export type Executor = ({|
  app: Object,
  cancelToken: any,
  data: any,
  job: Job,
  logger: Logger,
  runJobId: string,
  schedule?: Schedule,
  session: Object,
|}) => Promise<any>

// -----------------------------------------------------------------------------

const normalize = job => {
  Object.keys(job).forEach(key => {
    try {
      const value = (job[key] = JSON.parse(job[key]))

      // userId are always strings, even if the value is numeric, which might to
      // them being parsed as numbers.
      //
      // The issue has been introduced by
      // 48b2297bc151df582160be7c1bf1e8ee160320b8.
      if (key === 'userId' && typeof value === 'number') {
        job[key] = String(value)
      }
    } catch (_) {}
  })
  return job
}

const serialize = (job: {| [string]: any |}) => {
  Object.keys(job).forEach(key => {
    const value = job[key]
    if (typeof value !== 'string') {
      job[key] = JSON.stringify(job[key])
    }
  })
  return job
}

class JobsDb extends Collection {
  async create(job): Promise<Job> {
    return normalize((await this.add(serialize((job: any)))).properties)
  }

  async save(job): Promise<void> {
    await this.update(serialize((job: any)))
  }

  async get(properties): Promise<Array<Job>> {
    const jobs = await super.get(properties)
    jobs.forEach(normalize)
    return jobs
  }
}

// -----------------------------------------------------------------------------

export default class Jobs {
  _app: any
  _executors: { __proto__: null, [string]: Executor }
  _jobs: JobsDb
  _logger: Logger
  _runningJobs: { __proto__: null, [string]: string }
  _runs: { __proto__: null, [string]: () => void }

  get runningJobs() {
    return this._runningJobs
  }

  constructor(xo: any) {
    this._app = xo
    const executors = (this._executors = { __proto__: null })
    const jobsDb = (this._jobs = new JobsDb({
      connection: xo._redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key'],
    }))
    this._logger = undefined
    this._runningJobs = { __proto__: null }
    this._runs = { __proto__: null }

    executors.call = executeCall

    xo.on('clean', () => jobsDb.rebuildIndexes())
    xo.on('start', async () => {
      this._logger = await xo.getLogger('jobs')

      xo.addConfigManager(
        'jobs',
        () => jobsDb.get(),
        jobs => Promise.all(mapToArray(jobs, job => jobsDb.save(job))),
        ['users']
      )
    })
    // it sends a report for the interrupted backup jobs
    xo.on('plugins:registered', () =>
      asyncMap(this._jobs.get(), job => {
        // only the interrupted backup jobs have the runId property
        if (job.runId === undefined) {
          return
        }

        xo.emit(
          'job:terminated',
          // This cast can be removed after merging the PR: https://github.com/vatesfr/xen-orchestra/pull/3209
          String(job.runId),
          {
            type: job.type,
          }
        )
        return this.updateJob({ id: job.id, runId: null })
      })
    )
  }

  cancelJobRun(id: string) {
    const run = this._runs[id]
    if (run !== undefined) {
      return run.cancel()
    }
  }

  async getAllJobs(type?: string): Promise<Array<Job>> {
    // $FlowFixMe don't know what is the problem (JFT)
    const jobs = await this._jobs.get()
    const runningJobs = this._runningJobs
    const result = []
    jobs.forEach(job => {
      if (type === undefined || job.type === type) {
        job.runId = runningJobs[job.id]
        result.push(job)
      }
    })
    return result
  }

  async getJob(id: string, type?: string): Promise<Job> {
    let job = await this._jobs.first(id)
    if (job === undefined || (type !== undefined && job.properties.type !== type)) {
      throw noSuchObject(id, 'job')
    }

    job = job.properties
    job.runId = this._runningJobs[id]

    return job
  }

  createJob(job: $Diff<Job, {| id: string |}>): Promise<Job> {
    return this._jobs.create(job)
  }

  async updateJob(job: $Shape<Job>, merge: boolean = true) {
    if (merge) {
      const { id, ...props } = job
      job = await this.getJob(id)
      patch(job, props)
    }
    return /* await */ this._jobs.save(job)
  }

  registerJobExecutor(type: string, executor: Executor): void {
    const executors = this._executors
    if (type in executors) {
      throw new Error(`there is already a job executor for type ${type}`)
    }
    executors[type] = executor
  }

  async removeJob(id: string) {
    const promises = [this._jobs.remove(id)]
    ;(await this._app.getAllSchedules()).forEach(schedule => {
      if (schedule.jobId === id) {
        promises.push(this._app.deleteSchedule(schedule.id))
      }
    })
    return Promise.all(promises)
  }

  async _runJob(job: Job, schedule?: Schedule, data_?: any) {
    const logger = this._logger
    const { id, type } = job
    const runJobId = logger.notice(`Starting execution of ${id}.`, {
      data:
        type === 'backup' || type === 'metadataBackup'
          ? {
              // $FlowFixMe only defined for BackupJob
              mode: job.mode,
              reportWhen: job.settings['']?.reportWhen ?? 'failure',
            }
          : undefined,
      event: 'job.start',
      userId: job.userId,
      jobId: id,
      jobName: job.name,
      proxyId: job.proxy,
      scheduleId: schedule?.id,
      // $FlowFixMe only defined for CallJob
      key: job.key,
      type,
    })

    const app = this._app
    const user = await app.getUser(job.userId).catch(error => {
      if (!noSuchObject.is(error)) {
        throw error
      }
    })
    const data = {
      callId: Math.random().toString(36).slice(2),
      method: 'backupNg.runJob',
      params: {
        id: job.id,
        schedule: schedule?.id,
        settings: job.settings,
        vms: job.vms,
      },
      timestamp: Date.now(),
      userId: job.userId,
      userName: user?.name ?? '(unknown user)',
    }
    try {
      const runningJobs = this._runningJobs

      if (id in runningJobs) {
        throw new Error(`the job (${id}) is already running`)
      }

      const executor = this._executors[type]
      if (executor === undefined) {
        throw new Error(`cannot run job (${id}): no executor for type ${type}`)
      }

      // runId is a temporary property used to check if the report is sent after the server interruption
      this.updateJob({ id, runId: runJobId })::ignoreErrors()
      runningJobs[id] = runJobId

      const runs = this._runs
      let session
      try {
        const { cancel, token } = CancelToken.source()
        runs[runJobId] = { cancel }

        session = app.createUserConnection()
        session.set('user_id', job.userId)

        type === 'backup' && app.emit('backup:preCall', data)

        const status = await executor({
          app,
          cancelToken: token,
          data: data_,
          job,
          logger,
          runJobId,
          schedule,
          session,
        })

        await logger.notice(
          `Execution terminated for ${job.id}.`,
          {
            event: 'job.end',
            runJobId,
          },
          true
        )

        const now = Date.now()
        type === 'backup' &&
          app.emit('backup:postCall', {
            ...data,
            duration: now - data.timestamp,
            // Result of runJobSequence()
            result: true,
            timestamp: now,
          })

        app.emit('job:terminated', runJobId, {
          type: job.type,
          status,
        })
      } finally {
        this.updateJob({ id, runId: null })::ignoreErrors()
        delete runningJobs[id]
        delete runs[runJobId]
        if (session !== undefined) {
          session.close()
        }
      }
    } catch (error) {
      await logger.error(
        `The execution of ${id} has failed.`,
        {
          event: 'job.end',
          runJobId,
          error: serializeError(error),
        },
        true
      )
      const now = Date.now()
      type === 'backup' &&
        app.emit('backup:postCall', {
          ...data,
          duration: now - data.timestamp,
          error: serializeError(error),
          timestamp: now,
        })
      app.emit('job:terminated', runJobId, {
        type: job.type,
      })
      throw error
    }
  }

  async runJobSequence(idSequence: Array<string>, schedule?: Schedule, data?: any) {
    const jobs = await Promise.all(mapToArray(idSequence, id => this.getJob(id)))

    for (const job of jobs) {
      await this._runJob(job, schedule, data)
    }
  }
}
