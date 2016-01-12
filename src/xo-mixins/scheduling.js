import Scheduler from '../scheduler'
import { Schedules } from '../models/schedule'
import {
  NoSuchObject
} from '../api-errors'

// ===================================================================

class NoSuchSchedule extends NoSuchObject {
  constructor (id) {
    super(id, 'schedule')
  }
}

// ===================================================================

export default class {
  constructor (xo) {
    this._schedules = new Schedules({
      connection: xo._redis,
      prefix: 'xo:schedule',
      indexes: ['user_id', 'job']
    })
    const scheduler = this._scheduler = new Scheduler(xo)

    xo.on('stop', () => scheduler.disableAll())
  }

  async _getSchedule (id) {
    const schedule = await this._schedules.first(id)
    if (!schedule) {
      throw new NoSuchSchedule(id)
    }

    return schedule
  }

  async getSchedule (id) {
    return (await this._getSchedule(id)).properties
  }

  async getAllSchedules () {
    return await this._schedules.get()
  }

  async createSchedule (userId, {job, cron, enabled, name}) {
    const schedule_ = await this._schedules.create(userId, job, cron, enabled, name)
    const schedule = schedule_.properties
    if (this.scheduler) {
      this.scheduler.add(schedule)
    }
    return schedule
  }

  async updateSchedule (id, {job, cron, enabled, name}) {
    const schedule = await this._getSchedule(id)

    if (job) schedule.set('job', job)
    if (cron) schedule.set('cron', cron)
    if (enabled !== undefined) schedule.set('enabled', enabled)
    if (name !== undefined) schedule.set('name', name)

    await this._schedules.save(schedule)
    if (this.scheduler) {
      this.scheduler.update(schedule.properties)
    }
  }

  async removeSchedule (id) {
    await this._schedules.remove(id)
    if (this.scheduler) {
      this.scheduler.remove(id)
    }
  }
}
