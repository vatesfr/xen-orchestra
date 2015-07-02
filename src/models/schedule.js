import Collection from '../collection/redis'
import forEach from 'lodash.foreach'
import Model from '../model'

// ===================================================================

export default class Schedule extends Model {}

export class Schedules extends Collection {
  get Model () {
    return Schedule
  }

  get idPrefix () {
    return 'schedule:'
  }

  create (userId, job, cron, enabled) {
    return this.add(new Schedule({
      userId,
      job,
      cron,
      enabled
    }))
  }

  async save (schedule) {
    return await this.update(schedule)
  }

  async get (properties) {
    const schedules = await super.get(properties)
    forEach(schedules, schedule => {schedule.enabled = (schedule.enabled === 'true')})
    return schedules
  }
}
