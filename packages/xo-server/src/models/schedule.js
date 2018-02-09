import Collection from '../collection/redis'
import Model from '../model'
import { forEach } from '../utils'

// ===================================================================

export default class Schedule extends Model {}

export class Schedules extends Collection {
  get Model () {
    return Schedule
  }

  create (userId, job, cron, enabled, name = undefined, timezone = undefined) {
    return this.add(
      new Schedule({
        userId,
        job,
        cron,
        enabled,
        name,
        timezone,
      })
    )
  }

  async save (schedule) {
    return /* await */ this.update(schedule)
  }

  async get (properties) {
    const schedules = await super.get(properties)
    forEach(schedules, schedule => {
      schedule.enabled = schedule.enabled === 'true'
    })
    return schedules
  }
}
