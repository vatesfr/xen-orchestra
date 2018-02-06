import { DateTime } from 'luxon'

import next from './next'
import parse from './parse'

const MAX_DELAY = 2 ** 31 - 1

class Job {
  constructor (schedule, fn) {
    const wrapper = scheduledRun => {
      if (scheduledRun) {
        fn()
      }
      const delay = schedule._nextDelay()
      this._timeout = delay < MAX_DELAY
        ? setTimeout(wrapper, delay, true)
        : setTimeout(wrapper, MAX_DELAY)
    }
    this._fn = wrapper
    this._timeout = undefined
  }

  start () {
    this.stop()
    this._fn()
  }

  stop () {
    clearTimeout(this._timeout)
  }
}

class Schedule {
  constructor (pattern, zone = 'utc') {
    this._schedule = parse(pattern)
    this._dateTimeOpts = { zone }
  }

  createJob (fn) {
    return new Job(this, fn)
  }

  next (n) {
    const dates = new Array(n)
    const schedule = this._schedule
    let date = DateTime.fromObject(this._dateTimeOpts)
    for (let i = 0; i < n; ++i) {
      dates[i] = (date = next(schedule, date)).toJSDate()
    }
    return dates
  }

  _nextDelay () {
    const now = DateTime.fromObject(this._dateTimeOpts)
    return next(this._schedule, now) - now
  }
}

export const createSchedule = (...args) => new Schedule(...args)
