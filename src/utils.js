import base64url from 'base64url'
import forEach from 'lodash.foreach'
import has from 'lodash.has'
import humanFormat from 'human-format'
import isArray from 'lodash.isarray'
import isString from 'lodash.isstring'
import multiKeyHashInt from 'multikey-hash'
import xml2js from 'xml2js'
import {promisify} from 'bluebird'
import {randomBytes} from 'crypto'

// ===================================================================

export function camelToSnakeCase (string) {
  return string.replace(
    /([a-z])([A-Z])/g,
    (_, prevChar, currChar) => `${prevChar}_${currChar.toLowerCase()}`
  )
}

// -------------------------------------------------------------------

// Ensure the value is an array, wrap it if necessary.
export function ensureArray (value) {
  if (value === undefined) {
    return []
  }

  return isArray(value) ? value : [value]
}

// -------------------------------------------------------------------

// Returns the value of a property and removes it from the object.
export function extractProperty (obj, prop) {
  const value = obj[prop]
  delete obj[prop]
  return value
}

// -------------------------------------------------------------------

// Generate a secure random Base64 string.
export const generateToken = (function (randomBytes) {
  return (n = 32) => randomBytes(n).then(base64url)
})(promisify(randomBytes))

// -------------------------------------------------------------------

export const formatXml = (function () {
  const builder = new xml2js.Builder({
    headless: true
  })

  return (...args) => builder.buildObject(...args)
})()

export const parseXml = (function () {
  const opts = {
    mergeAttrs: true,
    explicitArray: false
  }

  return (xml) => {
    let result

    // xml2js.parseString() use a callback for synchronous code.
    xml2js.parseString(xml, opts, (error, result_) => {
      if (error) {
        throw error
      }

      result = result_
    })

    return result
  }
})()

// -------------------------------------------------------------------

// This function does nothing and returns undefined.
//
// It is often used to swallow promise's errors.
export function noop () {}

// -------------------------------------------------------------------

// Ponyfill for Promise.finally(cb)
export const pFinally = (promise, cb) => {
  return promise.then(
    (value) => constructor.resolve(cb()).then(() => value),
    (reason) => constructor.resolve(cb()).then(() => {
      throw reason
    })
  )
}

// -------------------------------------------------------------------

export {
  // Create a function which returns promises instead of taking a
  // callback.
  promisify,

  // For all enumerable methods of an object, create a new method
  // which name is suffixed with `Async` which return promises instead
  // of taking a callback.
  promisifyAll
} from 'bluebird'

// -------------------------------------------------------------------

export function parseSize (size) {
  if (!isString(size)) {
    return size
  }

  let bytes = humanFormat.parse.raw(size, { scale: 'binary' })
  if (bytes.unit && bytes.unit !== 'B') {
    bytes = humanFormat.parse.raw(size)

    if (bytes.unit && bytes.unit !== 'B') {
      throw new Error('invalid size: ' + size)
    }
  }
  return Math.floor(bytes.value * bytes.factor)
}

// -------------------------------------------------------------------

// Special value which can be returned to stop an iteration in map()
// and mapInPlace().
export const done = {}

// Similar to `lodash.map()` for array and `lodash.mapValues()` for
// objects.
//
// Note: can  be interrupted by returning the special value `done`
// provided as the forth argument.
export function map (col, iterator, thisArg = this) {
  const result = has(col, 'length') ? [] : {}
  forEach(col, (item, i) => {
    const value = iterator.call(thisArg, item, i, done)
    if (value === done) {
      return false
    }

    result[i] = value
  })
  return result
}

// Create a hash from multiple values.
export const multiKeyHash = (...args) => new Promise((resolve, reject) => {
  const hash = multiKeyHashInt(...args)

  const buf = new Buffer(4)
  buf.writeUInt32LE(hash, 0)

  resolve(base64url(buf))
})

// Similar to `map()` but change the current collection.
//
// Note: can  be interrupted by returning the special value `done`
// provided as the forth argument.
export function mapInPlace (col, iterator, thisArg = this) {
  forEach(col, (item, i) => {
    const value = iterator.call(thisArg, item, i, done)
    if (value === done) {
      return false
    }

    col[i] = value
  })

  return col
}

// Wrap a value in a function.
export const wrap = (value) => () => value
