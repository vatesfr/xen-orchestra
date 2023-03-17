'use strict'

const { pipeline } = require('node:stream')
const { ThrottleGroup } = require('@kldzj/stream-throttle')
const identity = require('lodash/identity.js')

const noop = Function.prototype

module.exports = function createStreamThrottle(rate) {
  if (rate === 0) {
    return identity
  }
  const group = new ThrottleGroup({ rate })
  return function throttleStream(stream) {
    return pipeline(stream, group.createThrottle(), noop)
  }
}
