import { pipeline } from 'node:stream'
import { ThrottleGroup } from '@kldzj/stream-throttle'
import identity from 'lodash/identity.js'

const noop = Function.prototype

export default function createStreamThrottle(rate) {
  if (rate === 0) {
    return identity
  }
  const group = new ThrottleGroup({ rate })
  return function throttleStream(stream) {
    return pipeline(stream, group.createThrottle(), noop)
  }
}
