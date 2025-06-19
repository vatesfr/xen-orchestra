import { createLogger } from '@xen-orchestra/log'
import { TimeoutError } from 'promise-toolbox'

const { info, warn } = createLogger('xo:fs:abstract')

export function withTimeout(fn, timeout, { onSuccessAfterTimeout, onFailureAfterTimeout } = {}) {
  return function (...args) {
    let timeoutHandle
    let didTimeout = false
    const timeoutError = new TimeoutError('Async call timeout limit reached')

    return new Promise((resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        didTimeout = true
        reject(timeoutError)
      }, timeout)
      const promise = fn.apply(this, args)
      if (promise?.then === undefined) {
        throw new Error('Function needs to be asynchronous.')
      }
      promise.then(
        result => {
          clearTimeout(timeoutHandle)
          if (didTimeout) {
            info('Success after timeout:\n', result)
            onSuccessAfterTimeout?.(result)
          } else {
            resolve(result)
          }
        },
        error => {
          clearTimeout(timeoutHandle)
          if (didTimeout) {
            warn('Failure after timeout:\n', error)
            onFailureAfterTimeout?.(error)
          } else {
            reject(error)
          }
        }
      )
    })
  }
}
