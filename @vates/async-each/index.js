'use strict'

const noop = Function.prototype

class AggregateError extends Error {
  constructor(errors, message) {
    super(message)
    this.errors = errors
  }
}

/**
 * @template Item
 * @param {Iterable<Item>|AsyncIterable<Item>} iterable
 * @param {(item: Item, index: number, iterable: Iterable<Item>|AsyncIterable<Item>) => Promise<void>} iteratee
 * @returns {Promise<void>}
 */
exports.asyncEach = function asyncEach(iterable, iteratee, { concurrency = 10, signal, stopOnError = true } = {}) {
  if (concurrency === 0) {
    concurrency = Infinity
  }
  return new Promise((resolve, reject) => {
    const it = (iterable[Symbol.iterator] || iterable[Symbol.asyncIterator]).call(iterable)
    const errors = []
    let running = 0
    let index = 0

    let onAbort
    if (signal !== undefined) {
      onAbort = () => {
        onRejectedWrapper(new Error('asyncEach aborted'))
      }
      signal.addEventListener('abort', onAbort)
    }

    const clean = () => {
      onFulfilled = onRejected = noop
      if (onAbort !== undefined) {
        signal.removeEventListener('abort', onAbort)
      }
    }

    resolve = (resolve =>
      function resolveAndClean(value) {
        resolve(value)
        clean()
      })(resolve)
    reject = (reject =>
      function rejectAndClean(reason) {
        reject(reason)
        clean()
      })(reject)

    let onFulfilled = value => {
      --running
      next()
    }
    const onFulfilledWrapper = value => onFulfilled(value)

    let onRejected = stopOnError
      ? reject
      : error => {
          --running
          errors.push(error)
          next()
        }
    const onRejectedWrapper = reason => onRejected(reason)

    let nextIsRunning = false
    let next = async () => {
      if (nextIsRunning) {
        return
      }
      nextIsRunning = true
      if (running < concurrency) {
        const cursor = await it.next()
        if (cursor.done) {
          next = () => {
            if (running === 0) {
              if (errors.length === 0) {
                resolve()
              } else {
                reject(new AggregateError(errors))
              }
            }
          }
        } else {
          ++running
          try {
            const result = iteratee.call(this, cursor.value, index++, iterable)
            let then
            if (result != null && typeof result === 'object' && typeof (then = result.then) === 'function') {
              then.call(result, onFulfilledWrapper, onRejectedWrapper)
            } else {
              onFulfilled(result)
            }
          } catch (error) {
            onRejected(error)
          }
        }
        nextIsRunning = false
        return next()
      }
      nextIsRunning = false
    }
    next()
  })
}
