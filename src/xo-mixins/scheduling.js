import { BaseError } from 'make-error'
import { noSuchObject } from 'xo-common/api-errors.js'

import { Schedules } from '../models/schedule'
import {
  forEach,
  mapToArray,
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

export class ScheduleNotEnabled extends SchedulerError {
  constructor (scheduleOrId) {
    super('Schedule ' + _resolveId(scheduleOrId) + ' is not enabled')
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
    const schedules = this._redisSchedules = new Schedules({
      connection: xo._redis,
      prefix: 'xo:schedule',
      indexes: ['user_id', 'job']
    })
    this._scheduleTable = undefined

    xo.on('clean', () => schedules.rebuildIndexes())
    xo.on('start', () => {
      xo.addConfigManager('schedules',
        () => schedules.get(),
        schedules_ => Promise.all(mapToArray(schedules_, schedule =>
          schedules.save(schedule)
        )),
        [ 'jobs' ]
      )

      return this._loadSchedules()
    })
    xo.on('stop', () => this._disableAll())
  }

  _add (schedule) {
    const { id } = schedule
    this._schedules[id] = schedule
    this._scheduleTable[id] = false
    try {
      if (schedule.enabled) {
        this._enable(schedule)
      }
    } catch (error) {
      console.warn('Scheduling#_add(%s)', id, error)
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

    const stopSchedule = scheduleFn(
      schedule.cron,
      () => this.xo.runJobSequence([ schedule.job ]),
      schedule.timezone
    )

    this._cronJobs[id] = stopSchedule
    this._scheduleTable[id] = true
  }

  _disable (scheduleOrId) {
    if (!this._exists(scheduleOrId)) {
      throw noSuchObject(scheduleOrId, 'schedule')
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
      throw noSuchObject(id, 'schedule')
    }

    return schedule
  }

  async getSchedule (id) {
    return (await this._getSchedule(id)).properties
  }

  async getAllSchedules () {
    return /* await */ this._redisSchedules.get()
  }

  async createSchedule (userId, { job, cron, enabled, name, timezone }) {
    const schedule_ = await this._redisSchedules.create(userId, job, cron, enabled, name, timezone)
    const schedule = schedule_.properties

    this._add(schedule)

    return schedule
  }

  async updateSchedule (id, { job, cron, enabled, name, timezone }) {
    const schedule = await this._getSchedule(id)

    if (job !== undefined) schedule.set('job', job)
    if (cron !== undefined) schedule.set('cron', cron)
    if (enabled !== undefined) schedule.set('enabled', enabled)
    if (name !== undefined) schedule.set('name', name)
    if (timezone === null) {
      schedule.set('timezone', undefined) // Remove current timezone
    } else if (timezone !== undefined) {
      schedule.set('timezone', timezone)
    }

    await this._redisSchedules.save(schedule)

    const { properties } = schedule

    if (!this._exists(id)) {
      throw noSuchObject(id, 'schedule')
    }

    // disable the schedule, _add() will enable it if necessary
    if (this._isEnabled(id)) {
      this._disable(id)
    }

    this._add(properties)
  }

  async removeSchedule (id) {
    await this._redisSchedules.remove(id)

    try {
      this._disable(id)
    } catch (exc) {
      if (!(exc instanceof SchedulerError)) {
        throw exc
      }
    } finally {
      delete this._schedules[id]
      delete this._scheduleTable[id]
    }
  }
}
