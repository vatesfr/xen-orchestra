import { assign } from 'lodash'
import { lastly } from 'promise-toolbox'
import { noSuchObject } from 'xo-common/api-errors'

import JobExecutor from '../job-executor'
import { Jobs as JobsDb } from '../models/job'
import { mapToArray } from '../utils'

// ===================================================================

export default class Jobs {
  constructor (xo) {
    this._executor = new JobExecutor(xo)
    const jobsDb = this._jobs = new JobsDb({
      connection: xo._redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key']
    })
    this._runningJobs = Object.create(null)

    xo.on('start', () => {
      xo.addConfigManager('jobs',
        () => jobsDb.get(),
        jobs => Promise.all(mapToArray(jobs, job =>
          jobsDb.save(job)
        )),
        [ 'users' ]
      )
    })
  }

  async getAllJobs () {
    return /* await */ this._jobs.get()
  }

  async getJob (id) {
    const job = await this._jobs.first(id)
    if (!job) {
      throw noSuchObject(id, 'job')
    }

    return job.properties
  }

  async createJob (job) {
    // TODO: use plain objects
    const job_ = await this._jobs.create(job)
    return job_.properties
  }

  async updateJob ({id, ...props}) {
    const job = await this.getJob(id)

    assign(job, props)
    if (job.timeout === null) {
      delete job.timeout
    }

    return /* await */ this._jobs.save(job)
  }

  async removeJob (id) {
    return /* await */ this._jobs.remove(id)
  }

  _runJob (job) {
    const { id } = job
    const runningJobs = this._runningJobs
    if (runningJobs[id]) {
      throw new Error(`job ${id} is already running`)
    }
    runningJobs[id] = true
    return this._executor.exec(job)::lastly(() => {
      delete runningJobs[id]
    })
  }

  async runJobSequence (idSequence) {
    const jobs = await Promise.all(mapToArray(idSequence, id => this.getJob(id)))

    for (const job of jobs) {
      await this._runJob(job)
    }
  }
}
