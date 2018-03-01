// @flow

import type { Pattern } from 'value-matcher'

// $FlowFixMe
import { assign } from 'lodash'
import { noSuchObject } from 'xo-common/api-errors'

import { Jobs as JobsDb } from '../../models/job'
import { mapToArray, serializeError } from '../../utils'

import type Logger from '../logs/loggers/abstract'

import executeCall from './execute-call'

// ===================================================================

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

export type Job = {
  id: string,
  name: string,
  type: string,
  userId: string
}

export type CallJob = {|
  ...$Exact<Job>,
  method: string,
  paramsVector: ParamsVector,
  timeout?: number,
  type: 'call'
|}

type Executor = ({|
  data: Object,
  job: Job,
  runJobId: string,
  session: Object
|}) => Promise<void>

export default class Jobs {
  _app: any
  _executors: { __proto__: null, [string]: Executor }
  _jobs: JobsDb
  _logger: Logger
  _runningJobs: { __proto__: null, [string]: boolean }

  constructor (xo: any) {
    this._app = xo
    const executors = (this._executors = Object.create(null))
    const jobsDb = (this._jobs = new JobsDb({
      connection: xo._redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key'],
    }))
    this._logger = undefined
    this._runningJobs = Object.create(null)

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

  async getJob (id: string, type: string = 'call'): Promise<Job> {
    const job = await this._jobs.first(id)
    if (job === null || job.type !== type) {
      throw noSuchObject(id, 'job')
    }

    return job.properties
  }

  async createJob (job: $Diff<Job, {| id: string |}>): Promise<Job> {
    // TODO: use plain objects
    const job_ = await this._jobs.create(job)
    return job_.properties
  }

  async updateJob ({ id, ...props }: $Shape<Job>) {
    const job = await this.getJob(id)

    assign(job, props)
    if (job.timeout === null) {
      delete job.timeout
    }

    return /* await */ this._jobs.save(job)
  }

  registerJobExecutor (type: string, executor: Executor): void {
    const executors = this._executors
    if (type in executor) {
      throw new Error(`there is already a job executor for type ${type}`)
    }
    executors[type] = executor
  }

  async removeJob (id: string) {
    return /* await */ this._jobs.remove(id)
  }

  async _runJob (job: Job, data: {}) {
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
        data,
        job,
        runJobId,
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

  async runJobSequence (idSequence: Array<string>, data: {}) {
    const jobs = await Promise.all(
      mapToArray(idSequence, id => this.getJob(id))
    )

    for (const job of jobs) {
      await this._runJob(job, data)
    }
  }
}
