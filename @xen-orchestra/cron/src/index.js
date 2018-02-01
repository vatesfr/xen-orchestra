import { DateTime } from 'luxon'

import nextDate from './next'
import parse from './parse'

const autoParse = pattern =>
  typeof pattern === 'string' ? parse(pattern) : schedule

export const next = (cronPattern, n = 1, zone = 'utc') => {
  const schedule = autoParse(cronPattern)

  let date = DateTime.fromObject({ zone })
  const dates = []
  for (let i = 0; i < n; ++i) {
    dates.push((date = nextDate(schedule, date)).toJSDate())
  }
  return dates
}

export { parse }

export const schedule = (cronPattern, fn, zone = 'utc') => {
  const wrapper = () => {
    fn()
    scheduleNextRun()
  }

  let handle
  const schedule = autoParse(cronPattern)
  const scheduleNextRun = () => {
    const now = DateTime.fromObject({ zone })
    const nextRun = next(schedule, now)
    handle = setTimeout(wrapper, nextRun - now)
  }

  scheduleNextRun()
  return () => {
    clearTimeout(handle)
  }
}
