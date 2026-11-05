'use strict'

const wrapCall = (fn, arg, thisArg) => {
  try {
    return Promise.resolve(fn.call(thisArg, arg))
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * Similar to Promise.all + Array#map but supports all iterables and does not trigger ESLint array-callback-return
 *
 * WARNING: Does not handle plain objects
 *
 * @template Item, Result, [This=Iterable<Item>]
 * @param {Iterable<Item>} iterable
 * @param {(this: This, item: Item) => (Result | PromiseLike<Result>)} mapFn
 * @param {This} [thisArg] defaults to `iterable`
 * @returns {Promise<Result[]>}
 */
exports.asyncMap = function asyncMap(iterable, mapFn, thisArg = iterable) {
  return Promise.all(Array.from(iterable, mapFn, thisArg))
}

/**
 * Like `asyncMap` but wait for all promises to settle before rejecting
 *
 * @template Item, Result, [This=Iterable<Item>]
 * @param {Iterable<Item>} iterable
 * @param {(this: This, item: Item) => (Result | PromiseLike<Result>)} mapFn
 * @param {This} [thisArg] defaults to `iterable`
 * @returns {Promise<Result[]>}
 */
exports.asyncMapSettled = function asyncMapSettled(iterable, mapFn, thisArg = iterable) {
  return new Promise((resolve, reject) => {
    const onError = e => {
      if (result !== undefined) {
        error = e
        result = undefined
      }
      if (--n === 0) {
        reject(error)
      }
    }
    const onValue = (i, value) => {
      const hasError = result === undefined
      if (!hasError) {
        result[i] = value
      }
      if (--n === 0) {
        if (hasError) {
          reject(error)
        } else {
          resolve(result)
        }
      }
    }

    let n = 0
    for (const item of iterable) {
      const i = n++
      wrapCall(mapFn, item, thisArg).then(value => onValue(i, value), onError)
    }

    if (n === 0) {
      return resolve([])
    }

    let error
    let result = new Array(n)
  })
}
