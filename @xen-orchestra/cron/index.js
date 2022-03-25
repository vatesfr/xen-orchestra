'use strict'

const moment = require('moment-timezone')

const next = require('./next')
const parse = require('./parse')

const MAX_DELAY = 2 ** 31 - 1

class Job {
  constructor(schedule, fn) {
    let scheduledDate
    const wrapper = () => {
      const now = Date.now()
      if (scheduledDate > now) {
        // we're early, delay
        //
        // no need to check _isEnabled, we're just delaying the existing timeout
        //
        // see https://github.com/vatesfr/xen-orchestra/issues/4625
        this._timeout = setTimeout(wrapper, scheduledDate - now)
        return
      }

      this._isRunning = true

      let result
      try {
        result = fn()
      } catch (_) {
        // catch any thrown value to ensure it does not break the job
      }
      let then
      if (result != null && typeof (then = result.then) === 'function') {
        then.call(result, scheduleNext, scheduleNext)
      } else {
        scheduleNext()
      }
    }
    const scheduleNext = () => {
      this._isRunning = false

      if (this._isEnabled) {
        const now = schedule._createDate()
        scheduledDate = +next(schedule._schedule, now)
        const delay = scheduledDate - now
        this._timeout = delay < MAX_DELAY ? setTimeout(wrapper, delay) : setTimeout(scheduleNext, MAX_DELAY)
      }
    }

    this._isEnabled = false
    this._isRunning = false
    this._scheduleNext = scheduleNext
    this._timeout = undefined
  }

  start() {
    this.stop()

    this._isEnabled = true
    if (!this._isRunning) {
      this._scheduleNext()
    }
  }

  stop() {
    this._isEnabled = false
    clearTimeout(this._timeout)
  }
}

class Schedule {
  constructor(pattern, zone = 'utc') {
    this._schedule = parse(pattern)
    this._createDate = zone.toLowerCase() === 'utc' ? moment.utc : zone === 'local' ? moment : () => moment.tz(zone)
  }

  createJob(fn) {
    return new Job(this, fn)
  }

  next(n) {
    const dates = new Array(n)
    const schedule = this._schedule
    let date = this._createDate()
    for (let i = 0; i < n; ++i) {
      dates[i] = (date = next(schedule, date)).toDate()
    }
    return dates
  }

  startJob(fn) {
    const job = this.createJob(fn)
    job.start()
    return job.stop.bind(job)
  }
}

const createSchedule = (...args) => new Schedule(...args)
exports.createSchedule = createSchedule
