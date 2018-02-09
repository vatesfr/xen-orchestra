import sortedIndex from 'lodash/sortedIndex'
import { DateTime } from 'luxon'

const NEXT_MAPPING = {
  month: { year: 1 },
  day: { month: 1 },
  weekday: { week: 1 },
  hour: { day: 1 },
  minute: { hour: 1 },
}

const getFirst = values => (values !== undefined ? values[0] : 0)

const setFirstAvailable = (date, unit, values) => {
  if (values === undefined) {
    return date
  }

  const curr = date.get(unit)
  const next = values[sortedIndex(values, curr) % values.length]
  if (curr === next) {
    return date
  }

  const newDate = date.set({ [unit]: next })
  return newDate > date ? newDate : newDate.plus(NEXT_MAPPING[unit])
}

// returns the next run, after the passed date
export default (schedule, fromDate) => {
  let date = fromDate
    .set({
      second: 0,
      millisecond: 0,
    })
    .plus({ minute: 1 })

  const { minute, hour, dayOfMonth, month, dayOfWeek } = schedule
  date = setFirstAvailable(date, 'minute', minute)

  let tmp

  tmp = setFirstAvailable(date, 'hour', hour)
  if (tmp !== date) {
    date = tmp.set({
      minute: getFirst(minute),
    })
  }

  let loop
  let i = 0
  do {
    loop = false

    tmp = setFirstAvailable(date, 'month', month)
    if (tmp !== date) {
      date = tmp.set({
        day: 1,
        hour: getFirst(hour),
        minute: getFirst(minute),
      })
    }

    if (dayOfMonth === undefined) {
      if (dayOfWeek !== undefined) {
        tmp = setFirstAvailable(date, 'weekday', dayOfWeek)
      }
    } else if (dayOfWeek === undefined) {
      tmp = setFirstAvailable(date, 'day', dayOfMonth)
    } else {
      tmp = DateTime.min(
        setFirstAvailable(date, 'day', dayOfMonth),
        setFirstAvailable(date, 'weekday', dayOfWeek)
      )
    }
    if (tmp !== date) {
      loop = tmp.month !== date.month
      date = tmp.set({
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
