import {BaseError} from 'make-error'
import {CronJob} from 'cron'

import { forEach } from './utils'

const _resolveId = scheduleOrId => scheduleOrId.id || scheduleOrId

export class SchedulerError extends BaseError {}
export class ScheduleOverride extends SchedulerError {
  constructor (scheduleOrId) {
    super('Schedule ID ' + _resolveId(scheduleOrId) + ' is already added')
  }
}
export class NoSuchSchedule extends SchedulerError {
  constructor (scheduleOrId) {
    super('No schedule found for ID ' + _resolveId(scheduleOrId))
  }
}
export class ScheduleNotEnabled extends SchedulerError {
  constructor (scheduleOrId) {
    super('Schedule ' + _resolveId(scheduleOrId)) + ' is not enabled'
  }
}
export class ScheduleAlreadyEnabled extends SchedulerError {
  constructor (scheduleOrId) {
    super('Schedule ' + _resolveId(scheduleOrId) + ' is already enabled')
  }
}
export class ScheduleJobNotFound extends SchedulerError {
  constructor (jobId, scheduleId) {
    super('Job ' + jobId + ' not found for Schedule ' + scheduleId)
  }
}

export default class Scheduler {
  constructor (xo) {
    this.xo = xo
    this._scheduleTable = undefined

    this._runningSchedules = {}
  }

  async _loadSchedules () {
    this._schedules = {}
    const schedules = await this.xo.getAllSchedules()
    this._scheduleTable = {}
    this._cronJobs = {}
    forEach(schedules, schedule => {
      this._add(schedule)
    })
  }

  add (schedule) {
    if (this.exists(schedule)) {
      throw new ScheduleOverride(schedule)
    }
    this._add(schedule)
  }

  _add (schedule) {
    const id = _resolveId(schedule)
    this._schedules[id] = schedule
    this._scheduleTable[id] = false
    if (schedule.enabled) {
      this._enable(schedule)
    }
  }

  remove (id) {
    try {
      this._disable(id)
    } catch (exc) {
      if (!exc instanceof SchedulerError) {
        throw exc
      }
    } finally {
      delete this._schedules[id]
      delete this._scheduleTable[id]
    }
  }

  exists (scheduleOrId) {
    const id_ = _resolveId(scheduleOrId)
    return id_ in this._schedules
  }

  async get (id) {
    if (!this.exists(id)) {
      throw new NoSuchSchedule(id)
    }
    return this._schedules[id]
  }

  async _get (id) {
    const schedule = await this.xo.getSchedule(id)
    if (!schedule) {
      throw new NoSuchSchedule(id)
    }
    return schedule
  }

  async update (schedule) {
    if (!this.exists(schedule)) {
      throw new NoSuchSchedule(schedule)
    }
    const enabled = this.isEnabled(schedule)
    if (enabled) {
      await this._disable(schedule)
    }
    this._add(schedule)
  }

  isEnabled (scheduleOrId) {
    return this._scheduleTable[_resolveId(scheduleOrId)]
  }

  _enable (schedule) {
    const running = this._runningSchedules

    const { id } = schedule
    const jobId = schedule.job

    const cronJob = new CronJob(schedule.cron, async () => {
      if (running[id]) {
        return // Simply ignore.
      }

      try {
        running[id] = true
        await this.xo.runJobSequence([ jobId ])
      } catch (error) {
        // FIXME: better error handling
        console.error(error && error.stack || error)
      } finally {
        delete running[id]
      }
    })
    this._cronJobs[id] = cronJob
    cronJob.start()
    this._scheduleTable[id] = true
  }

  _disable (scheduleOrId) {
    if (!this.exists(scheduleOrId)) {
      throw new NoSuchSchedule(scheduleOrId)
    }
    if (!this.isEnabled(scheduleOrId)) {
      throw new ScheduleNotEnabled(scheduleOrId)
    }
    const id = _resolveId(scheduleOrId)
    this._cronJobs[id].stop()
    delete this._cronJobs[id]
    this._scheduleTable[id] = false
  }

  disableAll () {
    forEach(this.scheduleTable, (enabled, id) => {
      if (enabled) {
        this._disable(id)
      }
    })
  }

  get scheduleTable () {
    return this._scheduleTable
  }
}
