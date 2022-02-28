'use strict'

const ms = require('ms')

exports.parseDuration = value => {
  if (typeof value === 'number') {
    return value
  }
  const duration = ms(value)
  if (duration === undefined) {
    throw new TypeError(`not a valid duration: ${value}`)
  }
  return duration
}
