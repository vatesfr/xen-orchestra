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

/**
 * Formats a timeout value (in milliseconds) into a human-readable format using locale-aware formatting
 * @param timeout - Timeout value in milliseconds
 * @param locale - Locale string for formatting (e.g., 'en', 'fr')
 * @returns Human-readable timeout string (e.g., "5 minutes", "2 heures", "1 jour")
 */
export function formatTimeout(timeout: number, locale: string): string
export function formatTimeout(timeout: undefined, locale: string): undefined
export function formatTimeout(timeout: number | undefined, locale: string): string | undefined
export function formatTimeout(timeout: number | undefined, locale: string): string | undefined {
  if (timeout === undefined) {
    return undefined
  }

  const secondFormatter = new Intl.NumberFormat(locale, { style: 'unit', unit: 'second' })

  if (timeout === 0) {
    return secondFormatter.format(0)
  }

  const seconds = Math.floor(timeout / 1000)

  if (seconds < 60) {
    return secondFormatter.format(seconds)
  }

  const minuteFormatter = new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute' })

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return minuteFormatter.format(minutes)
  }

  const hourFormatter = new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour' })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) {
      return hourFormatter.format(hours)
    }

    return `${hourFormatter.format(hours)} ${minuteFormatter.format(remainingMinutes)}`
  }

  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24

  const dayFormatter = new Intl.NumberFormat(locale, { style: 'unit', unit: 'day' })

  if (remainingHours === 0) {
    return dayFormatter.format(days)
  }

  return `${dayFormatter.format(days)} ${hourFormatter.format(remainingHours)}`
}
