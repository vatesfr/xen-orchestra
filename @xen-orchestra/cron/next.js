'use strict'

const moment = require('moment-timezone')
const sortedIndex = require('lodash/sortedIndex')

const NEXT_MAPPING = {
  month: { year: 1 },
  date: { month: 1 },
  day: { week: 1 },
  hour: { day: 1 },
  minute: { hour: 1 },
}

const getFirst = values => (values !== undefined ? values[0] : 0)

const setFirstAvailable = (date, unit, values) => {
  if (values === undefined) {
    return
  }

  const curr = date.get(unit)
  const next = values[sortedIndex(values, curr) % values.length]
  if (curr === next) {
    return
  }

  const timestamp = +date
  date.set(unit, next)
  if (timestamp > +date) {
    date.add(NEXT_MAPPING[unit])
  }
  return true
}

// returns the next run, after the passed date
module.exports = (schedule, fromDate) => {
  let date = moment(fromDate)
    .set({
      second: 0,
      millisecond: 0,
    })
    .add({ minute: 1 })

  const { minute, hour, dayOfMonth, month, dayOfWeek } = schedule
  setFirstAvailable(date, 'minute', minute)

  if (setFirstAvailable(date, 'hour', hour)) {
    date.set('minute', getFirst(minute))
  }

  let loop
  let i = 0
  do {
    loop = false

    if (setFirstAvailable(date, 'month', month)) {
      date.set({
        date: 1,
        hour: getFirst(hour),
        minute: getFirst(minute),
      })
    }

    let newDate = date.clone()
    if (dayOfMonth === undefined) {
      if (dayOfWeek !== undefined) {
        setFirstAvailable(newDate, 'day', dayOfWeek)
      }
    } else if (dayOfWeek === undefined) {
      setFirstAvailable(newDate, 'date', dayOfMonth)
    } else {
      const dateDay = newDate.clone()
      setFirstAvailable(dateDay, 'date', dayOfMonth)
      setFirstAvailable(newDate, 'day', dayOfWeek)
      newDate = moment.min(dateDay, newDate)
    }
    if (+date !== +newDate) {
      loop = date.month() !== newDate.month()
      date = newDate.set({
        hour: getFirst(hour),
        minute: getFirst(minute),
      })
    }
  } while (loop && ++i < 5)

  if (loop) {
    throw new Error('no solutions found for this schedule')
  }

  return date
}
