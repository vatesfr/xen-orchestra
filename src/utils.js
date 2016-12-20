import base64url from 'base64url'
import eventToPromise from 'event-to-promise'
import forEach from 'lodash/forEach'
import has from 'lodash/has'
import highland from 'highland'
import humanFormat from 'human-format'
import invert from 'lodash/invert'
import isArray from 'lodash/isArray'
import isString from 'lodash/isString'
import keys from 'lodash/keys'
import kindOf from 'kindof'
import multiKeyHashInt from 'multikey-hash'
import pick from 'lodash/pick'
import tmp from 'tmp'
import xml2js from 'xml2js'
import { resolve } from 'path'

// Moment timezone can be loaded only one time, it's a workaround to load
// the latest version because cron module uses an old version of moment which
// does not implement `guess` function for example.
import 'moment-timezone'

import through2 from 'through2'
import { CronJob } from 'cron'
import { Readable } from 'stream'
import { utcFormat, utcParse } from 'd3-time-format'
import {
  all as pAll,
  defer,
  fromCallback,
  promisify,
  reflect as pReflect
} from 'promise-toolbox'
import {
  createHash,
  randomBytes
} from 'crypto'

// ===================================================================

export function bufferToStream (buf) {
  const stream = new Readable()

  let i = 0
  const { length } = buf
  stream._read = function (size) {
    if (i === length) {
      return this.push(null)
    }

    const newI = Math.min(i + size, length)
    this.push(buf.slice(i, newI))
    i = newI
  }

  return stream
}

export streamToBuffer from './stream-to-new-buffer'

// -------------------------------------------------------------------

export function camelToSnakeCase (string) {
  return string.replace(
    /([a-z0-9])([A-Z])/g,
    (_, prevChar, currChar) => `${prevChar}_${currChar.toLowerCase()}`
  )
}

// -------------------------------------------------------------------

// Returns an empty object without prototype (if possible).
export const createRawObject = Object.create
  ? (createObject => () => createObject(null))(Object.create)
  : () => ({})

// -------------------------------------------------------------------

// Only works with string items!
export const diffItems = (coll1, coll2) => {
  const removed = createRawObject()
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

  return [ added, keys(removed) ]
}

// -------------------------------------------------------------------

const ALGORITHM_TO_ID = {
  md5: '1',
  sha256: '5',
  sha512: '6'
}

const ID_TO_ALGORITHM = invert(ALGORITHM_TO_ID)

// Wrap a readable stream in a stream with a checksum promise
// attribute which is resolved at the end of an input stream.
// (Finally .checksum contains the checksum of the input stream)
//
// Example:
// const sourceStream = ...
// const targetStream = ...
// const checksumStream = addChecksumToReadStream(sourceStream)
// await Promise.all([
//   eventToPromise(checksumStream.pipe(targetStream), 'finish'),
//   checksumStream.checksum.then(console.log)
// ])
export const addChecksumToReadStream = (stream, algorithm = 'md5') => {
  const algorithmId = ALGORITHM_TO_ID[algorithm]

  if (!algorithmId) {
    throw new Error(`unknown algorithm: ${algorithm}`)
  }

  const hash = createHash(algorithm)
  const { promise, resolve } = defer()

  const wrapper = stream.pipe(through2(
    (chunk, enc, callback) => {
      hash.update(chunk)
      callback(null, chunk)
    },
    callback => {
      resolve(hash.digest('hex'))
      callback()
    }
  ))

  stream.on('error', error => wrapper.emit('error', error))
  wrapper.checksum = promise.then(hash => `$${algorithmId}$$${hash}`)

  return wrapper
}

// Check if the checksum of a readable stream is equals to an expected checksum.
// The given stream is wrapped in a stream which emits an error event
// if the computed checksum is not equals to the expected checksum.
export const validChecksumOfReadStream = (stream, expectedChecksum) => {
  const algorithmId = expectedChecksum.slice(1, expectedChecksum.indexOf('$', 1))

  if (!algorithmId) {
    throw new Error(`unknown algorithm: ${algorithmId}`)
  }

  const hash = createHash(ID_TO_ALGORITHM[algorithmId])

  const wrapper = stream.pipe(through2(
    { highWaterMark: 0 },
    (chunk, enc, callback) => {
      hash.update(chunk)
      callback(null, chunk)
    },
    callback => {
      const checksum = `$${algorithmId}$$${hash.digest('hex')}`

      callback(
        checksum.trim() !== expectedChecksum.trim()
          ? new Error(`Bad checksum (${checksum}), expected: ${expectedChecksum}`)
          : null
      )
    }
  ))

  stream.on('error', error => wrapper.emit('error', error))
  wrapper.checksumVerified = eventToPromise(wrapper, 'end')

  return wrapper
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

export const getUserPublicProperties = user => pick(
  user.properties || user,
  'id', 'email', 'groups', 'permission', 'preferences', 'provider'
)

// -------------------------------------------------------------------

export const getPseudoRandomBytes = n => {
  const bytes = new Buffer(n)

  const odd = n & 1
  for (let i = 0, m = n - odd; i < m; i += 2) {
    bytes.writeUInt16BE(Math.random() * 65536 | 0, i)
  }

  if (odd) {
    bytes.writeUInt8(Math.random() * 256 | 0, n - 1)
  }

  return bytes
}

export const generateUnsecureToken = (n = 32) => base64url(getPseudoRandomBytes(n))

// Generate a secure random Base64 string.
export const generateToken = (randomBytes => {
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

// Very light and fast set.
//
// - works only with strings
// - methods are already bound and chainable
export const lightSet = collection => {
  const data = createRawObject()
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
      for (const value in data) {
        delete data[value]
      }
      return set
    },
    delete: value => {
      delete data[value]
      return set
    },
    has: value => data[value],
    toArray: () => keys(data)
  }
  return set
}

// -------------------------------------------------------------------

// This function does nothing and returns undefined.
//
// It is often used to swallow promise's errors.
export const noop = () => {}

// -------------------------------------------------------------------

// Usage: pDebug(promise, name) or promise::pDebug(name)
export function pDebug (promise, name) {
  if (arguments.length === 1) {
    name = promise
    promise = this
  }

  Promise.resolve(promise).then(
    value => {
      console.log(
        '%s',
        `Promise ${name} resolved${value !== undefined ? ` with ${kindOf(value)}` : ''}`
      )
    },
    reason => {
      console.log(
        '%s',
        `Promise ${name} rejected${reason !== undefined ? ` with ${kindOf(reason)}` : ''}`
      )
    }
  )

  return promise
}

// Given a collection (array or object) which contains promises,
// return a promise that is fulfilled when all the items in the
// collection are either fulfilled or rejected.
//
// This promise will be fulfilled with a collection (of the same type,
// array or object) containing promise inspections.
//
// Usage: pSettle(promises) or promises::pSettle()
export function pSettle (promises) {
  return (this || promises)::pAll(p => p::pReflect())
}

// -------------------------------------------------------------------

export { // eslint-disable-line no-duplicate-imports
  all as pAll,
  catchPlus as pCatch,
  delay as pDelay,
  fromCallback as pFromCallback,
  isPromise,
  lastly as pFinally,
  promisify,
  promisifyAll,
  reflect as pReflect
} from 'promise-toolbox'

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
export { default as forEach } from 'lodash/forEach' // eslint-disable-line no-duplicate-imports
export { default as isArray } from 'lodash/isArray' // eslint-disable-line no-duplicate-imports
export { default as isBoolean } from 'lodash/isBoolean'
export { default as isEmpty } from 'lodash/isEmpty'
export { default as isFunction } from 'lodash/isFunction'
export { default as isInteger } from 'lodash/isInteger'
export { default as isObject } from 'lodash/isObject'
export { default as isString } from 'lodash/isString' // eslint-disable-line no-duplicate-imports
export { default as mapToArray } from 'lodash/map'

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
export function map (
  collection,
  iteratee,
  target = has(collection, 'length') ? [] : {}
) {
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
export const multiKeyHash = (...args) => new Promise(resolve => {
  const hash = multiKeyHashInt(...args)

  const buf = new Buffer(4)
  buf.writeUInt32LE(hash, 0)

  resolve(base64url(buf))
})

// -------------------------------------------------------------------

export const resolveSubpath = (root, path) =>
  resolve(root, `./${resolve('/', path)}`)

// -------------------------------------------------------------------

export const streamToArray = (stream, {
  filter,
  mapper
} = {}) => new Promise((resolve, reject) => {
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

export const scheduleFn = (cronTime, fn, timeZone) => {
  let running = false

  const job = new CronJob({
    cronTime,
    onTick: async () => {
      if (running) {
        return
      }

      running = true

      try {
        await fn()
      } catch (error) {
        console.error('[WARN] scheduled function:', error && error.stack || error)
      } finally {
        running = false
      }
    },
    start: true,
    timeZone
  })

  return () => {
    job.stop()
  }
}

// -------------------------------------------------------------------

// Create a serializable object from an error.
export const serializeError = error => ({
  message: error.message,
  stack: error.stack,
  ...error // Copy enumerable properties.
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
// promise.catch(throwFn('an error has occured'))
//
// function foo (param = throwFn('param is required')()) {}
// ```
export const throwFn = error => () => {
  throw (
    isString(error)
      ? new Error(error)
      : error
  )
}

// -------------------------------------------------------------------

export const tmpDir = () => fromCallback(cb => tmp.dir(cb))

// -------------------------------------------------------------------

// Wrap a value in a function.
export const wrap = value => () => value
