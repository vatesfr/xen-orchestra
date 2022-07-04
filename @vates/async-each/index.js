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
 * @param {Iterable<Item>} iterable
 * @param {(item: Item, index: number, iterable: Iterable<Item>) => Promise<void>} iteratee
 * @returns {Promise<void>}
 */
exports.pEach = function pEach(iterable, iteratee, { concurrency = 10, signal, stopOnError = true } = {}) {
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
        onRejectedWrapper(new Error('pEach aborted'))
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

    let onFulfilled = () => {
      --running
      next()
    }

    let onRejected = stopOnError
      ? reject
      : error => {
          --running
          errors.push(error)
          next()
        }
    const onRejectedWrapper = reason => onRejected(reason)

    const run = async (value, index) => {
      try {
        onFulfilled(await iteratee.call(this, value, index++))
      } catch (error) {
        onRejected(error)
      }
    }

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
          run(cursor.value, index++, iterable)
        }
        nextIsRunning = false
        return next()
      }
      nextIsRunning = false
    }
    next()
  })
}
