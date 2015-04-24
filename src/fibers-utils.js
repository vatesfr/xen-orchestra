import Bluebird from 'bluebird'
import Fiber from 'fibers'
import forEach from 'lodash.foreach'
import isArray from 'lodash.isarray'
import isFunction from 'lodash.isfunction'
import isObject from 'lodash.isobject'

// ===================================================================

export const isPromise = (obj) => obj && isFunction(obj.then)

// The value is guarantee to resolve asynchronously.
const runAsync = (value, resolve, reject) => {
  if (isPromise(value)) {
    return value.then(resolve, reject)
  }

  if (isFunction(value)) { // Continuable
    throw new Error('continuable are no longer supported')
  }

  if (!isObject(value)) {
    return process.nextTick(() => {
      resolve(value)
    })
  }

  let left = 0
  let results = isArray(value) ?
    new Array(value.length) :
    Object.create(null)

  forEach(value, (value, index) => {
    ++left
    runAsync(
      value,
      (result) => {
        // Returns if already rejected.
        if (!results) {
          return
        }

        results[index] = result
        if (!--left) {
          resolve(results)
        }
      },
      (error) => {
        // Returns if already rejected.
        if (!results) {
          return
        }

        // Frees the reference ASAP.
        results = null

        reject(error)
      }
    )
  })

  if (!left) {
    process.nextTick(() => {
      resolve(value)
    })
  }
}

// ===================================================================

// Makes a function run in its own fiber and returns a promise.
export function coroutine (fn) {
  return function (...args) {
    return new Bluebird((resolve, reject) => {
      new Fiber(() => {
        try {
          resolve(fn.apply(this, args))
        } catch (error) {
          reject(error)
        }
      }).run()
    })
  }
}

// Waits for a promise or a continuable to end.
//
// If value is composed (array or map), every asynchronous value is
// resolved before returning (parallelization).
export const wait = (value) => {
  const fiber = Fiber.current
  if (!fiber) {
    throw new Error('not running in a fiber')
  }

  runAsync(
    value,
    (value) => {
      fiber.run(value)
    },
    (error) => {
      fiber.throwInto(error)
    }
  )

  return Fiber.yield()
}

// ===================================================================

// Compatibility.
export {
  coroutine as $coroutine,
  wait as $wait
}
