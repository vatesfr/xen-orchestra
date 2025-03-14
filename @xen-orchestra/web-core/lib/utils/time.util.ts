import { utcParse } from 'd3-time-format'

export function parseDateTime(dateTime: Date | string | number): number {
  if (typeof dateTime === 'number') {
    return dateTime
  }

  if (dateTime instanceof Date) {
    return dateTime.getTime()
  }

  dateTime = dateTime.replace(/(-|\.\d{3})/g, '') // Allow toISOString() date-time format
  const date = utcParse('%Y%m%dT%H:%M:%SZ')(dateTime)
  if (date === null) {
    throw new RangeError(`unable to parse XAPI datetime ${JSON.stringify(dateTime)}`)
  }
  return date.getTime()
}
