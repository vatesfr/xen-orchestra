import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

// ===================================================================

export default class Job extends Model {}

export class Jobs extends Collection {
  get Model () {
    return Job
  }

  get idPrefix () {
    return 'job:'
  }

  async create (userId, job) {
    job.userId = userId
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
      const {paramsVector} = job
      try {
        job.paramsVector = JSON.parse(paramsVector)
      } catch (error) {
        console.warn('cannot parse job.paramsVector:', paramsVector) // FIXME this is a warning as I copy/paste acl.js, but...
        job.paramsVector = {}
      }
    })

    return jobs
  }
}
