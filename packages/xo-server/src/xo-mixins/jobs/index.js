// @flow

import type { Pattern } from 'value-matcher'

// $FlowFixMe
import { cancelable } from 'promise-toolbox'
import { noSuchObject } from 'xo-common/api-errors'

import Collection from '../../collection/redis'
import patch from '../../patch'
import { mapToArray, serializeError } from '../../utils'

import type Logger from '../logs/loggers/abstract'
import { type Schedule } from '../scheduling'

import executeCall from './execute-call'

// ===================================================================

export type Job = {
  id: string,
  name: string,
  type: string,
  userId: string
}

type ParamsVector =
  | {|
      items: Array<Object>,
      type: 'crossProduct'
    |}
  | {|
      mapping: Object,
      type: 'extractProperties',
      value: Object
    |}
  | {|
      pattern: Pattern,
      type: 'fetchObjects'
    |}
  | {|
      collection: Object,
      iteratee: Function,
      paramName?: string,
      type: 'map'
    |}
  | {|
      type: 'set',
      values: any
    |}

export type CallJob = {|
  ...$Exact<Job>,
  method: string,
  paramsVector: ParamsVector,
  timeout?: number,
  type: 'call'
|}

export type Executor = ({|
  app: Object,
  cancelToken: any,
  job: Job,
  logger: Logger,
  runJobId: string,
  schedule?: Schedule,
  session: Object
|}) => Promise<any>

// -----------------------------------------------------------------------------

const normalize = job => {
  Object.keys(job).forEach(key => {
    try {
      job[key] = JSON.parse(job[key])
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
  async create (job): Promise<Job> {
    return normalize((await this.add(serialize((job: any)))).properties)
  }

  async save (job): Promise<void> {
    await this.update(serialize((job: any)))
  }

  async get (properties): Promise<Array<Job>> {
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
  _runningJobs: { __proto__: null, [string]: boolean }

  constructor (xo: any) {
    this._app = xo
    const executors = (this._executors = { __proto__: null })
    const jobsDb = (this._jobs = new JobsDb({
      connection: xo._redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key'],
    }))
    this._logger = undefined
    this._runningJobs = { __proto__: null }

    executors.call = executeCall

    xo.on('clean', () => jobsDb.rebuildIndexes())
    xo.on('start', () => {
      xo.addConfigManager(
        'jobs',
        () => jobsDb.get(),
        jobs => Promise.all(mapToArray(jobs, job => jobsDb.save(job))),
        ['users']
      )

      xo.getLogger('jobs').then(logger => {
        this._logger = logger
      })
    })
  }

  async getAllJobs (type: string = 'call'): Promise<Array<Job>> {
    // $FlowFixMe don't know what is the problem (JFT)
    const jobs = await this._jobs.get()
    const runningJobs = this._runningJobs
    const result = []
    jobs.forEach(job => {
      if (job.type === type) {
        job.runId = runningJobs[job.id]
        result.push(job)
      }
    })
    return result
  }

  async getJob (id: string, type?: string): Promise<Job> {
    const job = await this._jobs.first(id)
    if (job === null || (type !== undefined && job.properties.type !== type)) {
      throw noSuchObject(id, 'job')
    }

    return job.properties
  }

  createJob (job: $Diff<Job, {| id: string |}>): Promise<Job> {
    return this._jobs.create(job)
  }

  async updateJob ({ id, ...props }: $Shape<Job>) {
    const job = await this.getJob(id)
    patch(job, props)
    return /* await */ this._jobs.save(job)
  }

  registerJobExecutor (type: string, executor: Executor): void {
    const executors = this._executors
    if (type in executors) {
      throw new Error(`there is already a job executor for type ${type}`)
    }
    executors[type] = executor
  }

  async removeJob (id: string) {
    return /* await */ this._jobs.remove(id)
  }

  async _runJob (cancelToken: any, job: Job, schedule?: Schedule) {
    const { id } = job

    const runningJobs = this._runningJobs
    if (id in runningJobs) {
      throw new Error(`job ${id} is already running`)
    }

    const executor = this._executors[job.type]
    if (executor === undefined) {
      throw new Error(`cannot run job ${id}: no executor for type ${job.type}`)
    }

    const logger = this._logger
    const runJobId = logger.notice(`Starting execution of ${id}.`, {
      event: 'job.start',
      userId: job.userId,
      jobId: id,
      // $FlowFixMe only defined for CallJob
      key: job.key,
    })

    runningJobs[id] = runJobId

    try {
      const app = this._app
      const session = app.createUserConnection()
      session.set('user_id', job.userId)

      const status = await executor({
        app,
        cancelToken,
        job,
        logger,
        runJobId,
        schedule,
        session,
      })
      logger.notice(`Execution terminated for ${job.id}.`, {
        event: 'job.end',
        runJobId,
      })

      session.close()
      app.emit('job:terminated', status)
    } catch (error) {
      logger.error(`The execution of ${id} has failed.`, {
        event: 'job.end',
        runJobId,
        error: serializeError(error),
      })
      throw error
    } finally {
      delete runningJobs[id]
    }
  }

  @cancelable
  async runJobSequence (
    $cancelToken: any,
    idSequence: Array<string>,
    schedule?: Schedule
  ) {
    const jobs = await Promise.all(
      mapToArray(idSequence, id => this.getJob(id))
    )

    for (const job of jobs) {
      if ($cancelToken.requested) {
        break
      }
      await this._runJob($cancelToken, job, schedule)
    }
  }
}
