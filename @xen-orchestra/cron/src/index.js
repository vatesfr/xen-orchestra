import moment from 'moment-timezone'

import next from './next'
import parse from './parse'

const MAX_DELAY = 2 ** 31 - 1

class Job {
  constructor (schedule, fn) {
    const wrapper = () => {
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
      const delay = schedule._nextDelay()
      this._timeout =
        delay < MAX_DELAY
          ? setTimeout(wrapper, delay)
          : setTimeout(scheduleNext, MAX_DELAY)
    }

    this._scheduleNext = scheduleNext
    this._timeout = undefined
  }

  start () {
    this.stop()
    this._scheduleNext()
  }

  stop () {
    clearTimeout(this._timeout)
  }
}

class Schedule {
  constructor (pattern, zone = 'utc') {
    this._schedule = parse(pattern)
    this._createDate =
      zone.toLowerCase() === 'utc'
        ? moment.utc
        : zone === 'local'
          ? moment
          : () => moment.tz(zone)
  }

  createJob (fn) {
    return new Job(this, fn)
  }

  next (n) {
    const dates = new Array(n)
    const schedule = this._schedule
    let date = this._createDate()
    for (let i = 0; i < n; ++i) {
      dates[i] = (date = next(schedule, date)).toDate()
    }
    return dates
  }

  _nextDelay () {
    const now = this._createDate()
    return next(this._schedule, now) - now
  }

  startJob (fn) {
    const job = this.createJob(fn)
    job.start()
    return job.stop.bind(job)
  }
}

export const createSchedule = (...args) => new Schedule(...args)
