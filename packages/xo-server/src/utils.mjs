import base64url from 'base64url'
import { XMLParser } from 'fast-xml-parser'
import forEach from 'lodash/forEach.js'
import has from 'lodash/has.js'
import highland from 'highland'
import humanFormat from 'human-format'
import keys from 'lodash/keys.js'
import multiKeyHashInt from 'multikey-hash'
import pick from 'lodash/pick.js'
import tmp from 'tmp'
import { createLogger } from '@xen-orchestra/log'
import { randomBytes } from 'crypto'
import { resolve } from 'path'
import { utcFormat, utcParse } from 'd3-time-format'
import { fromCallback, promisify } from 'promise-toolbox'

const log = createLogger('xo:server:utils')

// ===================================================================

export function camelToSnakeCase(string) {
  return string.replace(/([a-z0-9])([A-Z])/g, (_, prevChar, currChar) => `${prevChar}_${currChar.toLowerCase()}`)
}

// -------------------------------------------------------------------

// Only works with string items!
export const diffItems = (coll1, coll2) => {
  const removed = { __proto__: null }
  forEach(coll2, value => {
    removed[value] = true
  })

  const added = []
  forEach(coll1, value => {
    if (value in removed) {
      delete removed[value]
    } else {
      added.push(value)
    }
  })

  return [added, keys(removed)]
}

// -------------------------------------------------------------------

// Returns the value of a property and removes it from the object.
export function extractProperty(obj, prop) {
  const value = obj[prop]
  delete obj[prop]
  return value
}

// -------------------------------------------------------------------

export const getUserPublicProperties = user =>
  pick(user, 'authProviders', 'id', 'email', 'groups', 'permission', 'preferences')

// -------------------------------------------------------------------

export const getPseudoRandomBytes = n => {
  const bytes = Buffer.allocUnsafe(n)

  const odd = n & 1
  for (let i = 0, m = n - odd; i < m; i += 2) {
    bytes.writeUInt16BE((Math.random() * 65536) | 0, i)
  }

  if (odd) {
    bytes.writeUInt8((Math.random() * 256) | 0, n - 1)
  }

  return bytes
}

export const generateUnsecureToken = (n = 32) => base64url(getPseudoRandomBytes(n))

// Generate a secure random Base64 string.
export const generateToken = (randomBytes => {
  return (n = 32) => randomBytes(n).then(base64url)
})(promisify(randomBytes))

// -------------------------------------------------------------------

export const parseXml = (function () {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    parseAttributeValue: false,
  })

  return xml => {
    try {
      return parser.parse(Buffer.isBuffer(xml) ? xml.toString() : xml)
    } catch (error) {
      log.warn('parseXml', { error, xml })
      return ''
    }
  }
})()

// -------------------------------------------------------------------

// Very light and fast set.
//
// - works only with strings
// - methods are already bound and chainable
export const lightSet = collection => {
  let data = { __proto__: null }
  if (collection) {
    forEach(collection, value => {
      data[value] = true
    })
    collection = null
  }

  const set = {
    add: value => {
      data[value] = true
      return set
    },
    clear: () => {
      data = { __proto__: null }
      return set
    },
    delete: value => {
      delete data[value]
      return set
    },
    has: value => data[value],
    toArray: () => keys(data),
  }
  return set
}

// -------------------------------------------------------------------

// This function does nothing and returns undefined.
//
// It is often used to swallow promise's errors.
export const noop = () => {}

// -------------------------------------------------------------------

export { pDelay, pFromCallback, pReflect, promisify, promisifyAll } from 'promise-toolbox'

// -------------------------------------------------------------------

export function parseSize(size) {
  if (typeof size !== 'string') {
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

const _has = Object.prototype.hasOwnProperty

// Removes an own property from an object and returns its value.
export const popProperty = obj => {
  for (const prop in obj) {
    if (_has.call(obj, prop)) {
      return extractProperty(obj, prop)
    }
  }
}

// -------------------------------------------------------------------

// Format a date in ISO 8601 in a safe way to be used in filenames
// (even on Windows).
export const safeDateFormat = utcFormat('%Y%m%dT%H%M%SZ')

export const safeDateParse = utcParse('%Y%m%dT%H%M%SZ')

// -------------------------------------------------------------------

// This functions are often used throughout xo-server.
//
// Exports them from here to avoid direct dependencies on lodash/
export { default as forEach } from 'lodash/forEach.js'
export { default as isEmpty } from 'lodash/isEmpty.js'
export { default as isInteger } from 'lodash/isInteger.js'
export { default as isObject } from 'lodash/isObject.js'

// -------------------------------------------------------------------

// Special value which can be returned to stop an iteration in map()
// and mapInPlace().
export const DONE = {}

// Fill `target` by running each element in `collection` through
// `iteratee`.
//
// If `target` is undefined, it defaults to a new array if
// `collection` is array-like (has a `length` property), otherwise an
// object.
//
// The context of `iteratee` can be specified via `thisArg`.
//
// Note: the Mapping can be interrupted by returning the special value
// `DONE` provided as the fourth argument.
//
// Usage: map(collection, item => item + 1)
export function map(collection, iteratee, target = has(collection, 'length') ? [] : {}) {
  forEach(collection, (item, i) => {
    const value = iteratee(item, i, collection, DONE)
    if (value === DONE) {
      return false
    }

    target[i] = value
  })

  return target
}

// -------------------------------------------------------------------

// Create a hash from multiple values.
export const multiKeyHash = (...args) =>
  new Promise(resolve => {
    const hash = multiKeyHashInt(...args)

    const buf = Buffer.allocUnsafe(4)
    buf.writeUInt32LE(hash, 0)

    resolve(base64url(buf))
  })

// -------------------------------------------------------------------

export const resolveSubpath = (root, path) => resolve(root, `./${resolve('/', path)}`)

// -------------------------------------------------------------------

export const streamToArray = (stream, { filter, mapper } = {}) =>
  new Promise((resolve, reject) => {
    stream = highland(stream).stopOnError(reject)
    if (filter) {
      stream = stream.filter(filter)
    }
    if (mapper) {
      stream = stream.map(mapper)
    }
    stream.toArray(resolve)
  })

// -------------------------------------------------------------------

// Create a serializable object from an error.
export const serializeError = error => ({
  ...error, // Copy enumerable properties.
  code: error.code,
  message: error.message,
  name: error.name,
  stack: error.stack,
})

// -------------------------------------------------------------------

// Create an array which contains the results of one thunk function.
// Only works with synchronous thunks.
export const thunkToArray = thunk => {
  const values = []
  thunk(::values.push)
  return values
}

// -------------------------------------------------------------------

// Creates a new function which throws an error.
//
// ```js
// promise.catch(throwFn('an error has occurred'))
//
// function foo (param = throwFn('param is required')()) {}
// ```
export const throwFn = error => () => {
  throw typeof error === 'string' ? new Error(error) : error
}

// -------------------------------------------------------------------

export const tmpDir = () => fromCallback(tmp.dir)

// -------------------------------------------------------------------

export const mapFilter = (collection, iteratee) => {
  const result = []
  forEach(collection, (...args) => {
    const value = iteratee(...args)
    if (value) {
      result.push(value)
    }
  })
  return result
}

// -------------------------------------------------------------------

export const splitFirst = (string, separator) => {
  const i = string.indexOf(separator)
  return i === -1 ? null : [string.slice(0, i), string.slice(i + separator.length)]
}

// -------------------------------------------------------------------

export const getFirstPropertyName = object => {
  for (const key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      return key
    }
  }
}

// -------------------------------------------------------------------

export const unboxIdsFromPattern = pattern => {
  if (pattern === undefined) {
    return []
  }
  const { id } = pattern
  return typeof id === 'string' ? [id] : id.__or
}

// -------------------------------------------------------------------

export const isSrWritable = sr => sr && sr.content_type !== 'iso' && sr.size > 0
