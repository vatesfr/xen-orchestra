import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

import { parseProp } from './utils'

// ===================================================================

export default class Job extends Model {}

export class Jobs extends Collection {
  get Model () {
    return Job
  }

  async create (job) {
    // Serializes.
    job.paramsVector = JSON.stringify(job.paramsVector)
    return /* await */ this.add(new Job(job))
  }

  async save (job) {
    // Serializes.
    job.paramsVector = JSON.stringify(job.paramsVector)
    return /* await */ this.update(job)
  }

  async get (properties) {
    const jobs = await super.get(properties)

    // Deserializes.
    forEach(jobs, job => {
      job.paramsVector = parseProp('job', job, 'paramsVector', {})

      const { timeout } = job
      if (timeout !== undefined) {
        job.timeout = +timeout
      }
    })

    return jobs
  }
}
