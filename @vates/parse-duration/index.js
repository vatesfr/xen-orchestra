'use strict'

const ms = require('ms')

exports.parseDuration = value => {
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'string' && value !== '') {
    const duration = ms(value)
    if (duration !== undefined) {
      return duration
    }
  }
  throw new TypeError(`not a valid duration: ${value}`)
}
