import {delay} from 'bluebird'

// ===================================================================

export function wait ({duration, returnValue}) {
  return delay(returnValue, +duration)
}

wait.params = {
  duration: {
    type: 'string'
  }
}
