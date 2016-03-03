import { BaseError } from 'make-error'
import { NoSuchObject } from '../api-errors.js'
import { Schedules } from '../models/schedule'

import {
  forEach,
  scheduleFn
} from '../utils'

// ===================================================================

const _resolveId = scheduleOrId => scheduleOrId.id || scheduleOrId

export class SchedulerError extends BaseError {}

export class ScheduleOverride extends SchedulerError {
  constructor (scheduleOrId) {
    super('Schedule ID ' + _resolveId(scheduleOrId) + ' is already added')
  }
}

export class NoSuchSchedule extends NoSuchObject {
  constructor (scheduleOrId) {
    super(scheduleOrId, 'schedule')
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

// ===================================================================

export default class {
  constructor (xo) {
    this.xo = xo
    this._redisSchedules = new Schedules({
      connection: xo._redis,
      prefix: 'xo:schedule',
      indexes: ['user_id', 'job']
    })
    this._scheduleTable = undefined

    xo.on('start', () => this._loadSchedules())
    xo.on('stop', () => this._disableAll())
  }

  _add (schedule) {
    const id = _resolveId(schedule)
    this._schedules[id] = schedule
    this._scheduleTable[id] = false
    if (schedule.enabled) {
      this._enable(schedule)
    }
  }

  _exists (scheduleOrId) {
    const id_ = _resolveId(scheduleOrId)
    return id_ in this._schedules
  }

  _isEnabled (scheduleOrId) {
    return this._scheduleTable[_resolveId(scheduleOrId)]
  }

  _enable (schedule) {
    const { id } = schedule

    const stopSchedule = scheduleFn(schedule.cron, () =>
      this.xo.runJobSequence([ schedule.job ])
    )

    this._cronJobs[id] = stopSchedule
    this._scheduleTable[id] = true
  }

  _disable (scheduleOrId) {
    if (!this._exists(scheduleOrId)) {
      throw new NoSuchSchedule(scheduleOrId)
    }
    if (!this._isEnabled(scheduleOrId)) {
      throw new ScheduleNotEnabled(scheduleOrId)
    }
    const id = _resolveId(scheduleOrId)
    this._cronJobs[id]() // Stop cron job.
    delete this._cronJobs[id]
    this._scheduleTable[id] = false
  }

  _disableAll () {
    forEach(this._scheduleTable, (enabled, id) => {
      if (enabled) {
        this._disable(id)
      }
    })
  }

  get scheduleTable () {
    return this._scheduleTable
  }

  async _loadSchedules () {
    this._schedules = {}
    this._scheduleTable = {}
    this._cronJobs = {}

    const schedules = await this.xo.getAllSchedules()

    forEach(schedules, schedule => {
      this._add(schedule)
    })
  }

  async _getSchedule (id) {
    const schedule = await this._redisSchedules.first(id)

    if (!schedule) {
      throw new NoSuchSchedule(id)
    }

    return schedule
  }

  async getSchedule (id) {
    return (await this._getSchedule(id)).properties
  }

  async getAllSchedules () {
    return /* await */ this._redisSchedules.get()
  }

  async createSchedule (userId, {job, cron, enabled, name}) {
    const schedule_ = await this._redisSchedules.create(userId, job, cron, enabled, name)
    const schedule = schedule_.properties

    this._add(schedule)

    return schedule
  }

  async updateSchedule (id, {job, cron, enabled, name}) {
    const schedule = await this._getSchedule(id)

    if (job) schedule.set('job', job)
    if (cron) schedule.set('cron', cron)
    if (enabled !== undefined) schedule.set('enabled', enabled)
    if (name !== undefined) schedule.set('name', name)

    await this._redisSchedules.save(schedule)

    const { properties } = schedule

    if (!this._exists(properties)) {
      throw new NoSuchSchedule(properties)
    }

    if (this._isEnabled(properties)) {
      await this._disable(properties)
    }

    this._add(properties)
  }

  async removeSchedule (id) {
    await this._redisSchedules.remove(id)

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
}
