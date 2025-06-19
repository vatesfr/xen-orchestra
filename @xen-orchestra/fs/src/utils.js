import { createLogger } from '@xen-orchestra/log'
import { TimeoutError } from 'promise-toolbox'

const { info, warn } = createLogger('xo:fs:abstract')

/**
 * Wraps an asynchronous function with timeout functionality.
 *
 * @template T
 * @param {(...args: any[]) => Promise<T>} fn - The asynchronous function to wrap
 * @param {Object} [options] - Configuration options
 * @param {(result: T) => void} [options.onSuccessAfterTimeout] - Callback invoked if original promise resolves after timeout
 * @param {(error: any) => void} [options.onFailureAfterTimeout] - Callback invoked if original promise rejects after timeout
 * @returns {(...args: any[]) => Promise<T>} A new function that will enforce the timeout
 * @throws {TypeError} If fn is not a function or timeout is not a positive number
 *
 * @example
 * // Basic usage
 * const fnWithTimeout = withTimeout(asyncFunc, 1000)
 * try {
 *   const result = await fnWithTimeout()
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     // Handle timeout
 *   }
 * }
 *
 * @example
 * // With callbacks
 * const fnWithTimeout = withTimeout(asyncFunc, 1000, {
 *   onSuccessAfterTimeout: (result) => console.log('Late success', result),
 *   onFailureAfterTimeout: (error) => console.log('Late failure', error)
 * })
 */
export function withTimeout(fn, timeout, { onSuccessAfterTimeout, onFailureAfterTimeout } = {}) {
  return function (...args) {
    let timeoutHandle
    let didTimeout = false
    if (typeof fn !== 'function') {
      throw new TypeError('First argument must be a function')
    }
    const timeoutError = new TimeoutError('Async call timeout limit reached')

    return new Promise((resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        didTimeout = true
        reject(timeoutError)
      }, timeout)

      // if fn is synchronous and throw an error, it will throws it here
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
