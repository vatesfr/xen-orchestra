'use strict'

const ms = require('ms')

exports.parseDuration = (value: number | string): number => {
  const throwError = () => {
    throw new TypeError(`not a valid duration: ${value}`)
  }

  if (typeof value === 'number') {
    return value
  }
  try {
    const duration: number | undefined = ms(value)
    if (typeof duration !== 'number') {
      return throwError()
    }
    return duration
  } catch (err) {
    return throwError()
  }
}
