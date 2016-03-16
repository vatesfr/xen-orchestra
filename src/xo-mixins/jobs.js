import JobExecutor from '../job-executor'
import { Jobs } from '../models/job'
import {
  GenericError,
  NoSuchObject
} from '../api-errors'

// ===================================================================

class NoSuchJob extends NoSuchObject {
  constructor (id) {
    super(id, 'job')
  }
}

// ===================================================================

export default class {
  constructor (xo) {
    this._executor = new JobExecutor(xo)
    this._jobs = new Jobs({
      connection: xo._redis,
      prefix: 'xo:job',
      indexes: ['user_id', 'key']
    })
  }

  async getAllJobs () {
    return /* await */ this._jobs.get()
  }

  async getJob (id) {
    const job = await this._jobs.first(id)
    if (!job) {
      throw new NoSuchJob(id)
    }

    return job.properties
  }

  async createJob (userId, job) {
    // TODO: use plain objects
    const job_ = await this._jobs.create(userId, job)
    return job_.properties
  }

  async updateJob (job) {
    return /* await */ this._jobs.save(job)
  }

  async removeJob (id) {
    return /* await */ this._jobs.remove(id)
  }

  async runJobSequence (idSequence) {
    const notFound = []
    for (const id of idSequence) {
      let job
      try {
        job = await this.getJob(id)
      } catch (error) {
        if (error instanceof NoSuchJob) {
          notFound.push(id)
        } else {
          throw error
        }
      }
      if (job) {
        await this._executor.exec(job)
      }
    }
    if (notFound.length > 0) {
      throw new GenericError(`The following jobs were not found: ${notFound.join()}`)
    }
  }
}
