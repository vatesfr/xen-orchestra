// @flow

import type { Pattern } from 'value-matcher'

import { assign } from 'lodash'
import { finally as pFinally } from 'promise-toolbox'
import { noSuchObject } from 'xo-common/api-errors'

import JobExecutor from '../job-executor'
import { Jobs as JobsDb } from '../models/job'
import { mapToArray } from '../utils'

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
  userId: string
}

export type CallJob = $Exact<{
  ...Job,
  method: string,
  paramsVector: ParamsVector,
  timeout?: number,
  type: 'call'
}>

export default class Jobs {
  _executor: JobExecutor
  _jobs: JobsDb
  _runningJobs: { __proto__: null, [string]: boolean }

  constructor (xo: any) {
    this._executor = new JobExecutor(xo)
    const jobsDb = (this._jobs = new JobsDb({
      connection: xo._redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key'],
    }))
    this._runningJobs = Object.create(null)

    xo.on('clean', () => jobsDb.rebuildIndexes())
    xo.on('start', () => {
      xo.addConfigManager(
        'jobs',
        () => jobsDb.get(),
        jobs => Promise.all(mapToArray(jobs, job => jobsDb.save(job))),
        ['users']
      )
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

  async removeJob (id: string) {
    return /* await */ this._jobs.remove(id)
  }

  _runJob (job: Job, extraParams: {}) {
    const { id } = job
    const runningJobs = this._runningJobs
    if (id in runningJobs) {
      throw new Error(`job ${id} is already running`)
    }
    runningJobs[id] = true
    return pFinally.call(
      this._executor.exec(
        job,
        runJobId => {
          runningJobs[id] = runJobId
        },
        extraParams
      ),
      () => {
        delete runningJobs[id]
      }
    )
  }

  async runJobSequence (idSequence: Array<string>, extraParams: {}) {
    const jobs = await Promise.all(
      mapToArray(idSequence, id => this.getJob(id))
    )

    for (const job of jobs) {
      await this._runJob(job, extraParams)
    }
  }
}
