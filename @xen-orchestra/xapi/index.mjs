import assert from 'assert'
import pRetry from 'promise-toolbox/retry'
import { parseDuration } from '@vates/parse-duration'
import { utcFormat, utcParse } from 'd3-time-format'
import { Xapi as Base } from 'xen-api'
import { createLogger } from '@xen-orchestra/log'

import * as Mixins from './_Mixins.mjs'

const { warn } = createLogger('xo:xapi')

export { default as isDefaultTemplate } from './isDefaultTemplate.mjs'
export { XapiDiskSource } from './disks/Xapi.mjs'

// VDI formats. (Raw is not available for delta vdi.)
export const VDI_FORMAT_RAW = 'raw'
export const VDI_FORMAT_VHD = 'vhd'
export const VDI_FORMAT_QCOW2 = 'qcow2'
export const SUPPORTED_VDI_FORMAT = [VDI_FORMAT_RAW, VDI_FORMAT_VHD, VDI_FORMAT_QCOW2]

// Format a date (pseudo ISO 8601) from one XenServer get by
// xapi.call('host.get_servertime', host.$ref) for example
export const formatDateTime = utcFormat('%Y%m%dT%H:%M:%SZ')

const parseDateTimeHelper = utcParse('%Y%m%dT%H:%M:%S%Z')

/**
 * Parses a date and time input and returns a Unix timestamp in seconds.
 *
 * @param {string|number|Date} input - The input to parse.
 * @returns {number|null} A Unix timestamp in seconds, or null if the field is empty (as encoded by XAPI).
 * @throws {TypeError} If the input is not a string, number or Date object.
 */
export function parseDateTime(input) {
  const type = typeof input

  // If the value is a number, it is assumed to be a timestamp in seconds
  if (type === 'number') {
    return input || null
  }

  if (typeof input === 'string') {
    let date

    // Some dates like host.other_config.{agent_start_time,boot_time,rpm_patch_installation_time}
    // are already timestamps
    date = +input
    if (!Number.isNaN(date)) {
      return date || null
    }

    // This is the case when the date has been retrieved via the JSON-RPC or JSON in XML-RPC APIs.
    date = parseDateTimeHelper(input)
    if (date === null) {
      throw new RangeError(`unable to parse XAPI datetime ${JSON.stringify(input)}`)
    }
    input = date
  }

  // This is the case when the date has been retrieved using the XML-RPC API or parsed by the block above.
  if (input instanceof Date) {
    const msTimestamp = input.getTime()
    return msTimestamp === 0 ? null : Math.floor(msTimestamp / 1e3)
  }

  throw new TypeError('unsupported input ' + input)
}

const hasProps = o => {
  // eslint-disable-next-line no-unreachable-loop
  for (const key in o) {
    return true
  }
  return false
}

const getPoolInfo = ({ pool } = {}) =>
  pool && {
    uuid: pool.uuid,
    name_label: pool.name_label,
  }

function logErrorBeforeRetry(error) {
  try {
    warn('retry', {
      attemptNumber: this.attemptNumber,
      delay: this.delay,
      error,
      fn: this.fn.name,
      arguments: this.arguments,
      pool: getPoolInfo(this.this),
    })
  } catch (error) {}
}
function disconnectBeforeRetry() {
  logErrorBeforeRetry.apply(this, arguments)
  const { arguments: args, this: self } = this
  const vdiRef = args[0]
  return self.VDI_disconnectFromControlDomain(vdiRef).catch(error =>
    warn('VDI_disconnectFromControlDomain failed while retrying', {
      arguments,
      error,
    })
  )
}

const logWatcherError = error => warn('error in watcher', { error })

function callWatcher(watcher) {
  try {
    const result = watcher(this)
    let then
    if (result != null && typeof (then = result.then) === 'function') {
      then.call(result, null, logWatcherError)
    }
  } catch (error) {
    logWatcherError(error)
  }
}

function callWatchers(watchers, object) {
  if (watchers !== undefined) {
    if (Array.isArray(watchers)) {
      watchers.forEach(callWatcher, object)
    } else {
      callWatcher.call(object, watchers)
    }
  }
}

function removeWatcher(predicate, cb) {
  const watcher = this[predicate]
  if (watcher !== undefined) {
    if (watcher === cb) {
      delete this[predicate]
    } else if (Array.isArray(watcher)) {
      const i = watcher.indexOf(cb)
      if (i !== -1) {
        if (watcher.length === 1) {
          delete this[predicate]
        } else {
          watcher.splice(i, 1)
        }
      }
    }
  }
}

export class Xapi extends Base {
  constructor({
    callRetryWhenTooManyPendingTasks = { delay: 5e3, tries: 10 },
    maxUncoalescedVdis,
    preferNbd = false,
    nbdOptions,
    syncHookSecret,
    syncHookTimeout,
    vdiDestroyRetryWhenInUse = { delay: 5e3, tries: 10 },
    vdiDelayBeforeRemovingCloudConfigDrive = '5 min',
    ...opts
  }) {
    super(opts)
    this._callRetryWhenTooManyPendingTasks = {
      ...callRetryWhenTooManyPendingTasks,
      onRetry: logErrorBeforeRetry,
      when: { code: 'TOO_MANY_PENDING_TASKS' },
    }
    this._maxUncoalescedVdis = maxUncoalescedVdis
    this._preferNbd = preferNbd
    this._nbdOptions = nbdOptions
    this._syncHookSecret = syncHookSecret
    this._syncHookTimeout = syncHookTimeout
    this._vdiDestroyRetryWhenInUse = {
      ...vdiDestroyRetryWhenInUse,
      onRetry: disconnectBeforeRetry,
      when: { code: 'VDI_IN_USE' },
    }
    this._vdiDelayBeforeRemovingCloudConfigDrive = parseDuration(vdiDelayBeforeRemovingCloudConfigDrive)

    const genericWatchers = (this._genericWatchers = new Set())
    const objectWatchers = (this._objectWatchers = { __proto__: null })

    const onAddOrUpdate = records => {
      if (genericWatchers.size === 0 && !hasProps(objectWatchers)) {
        // no need to process records
        return
      }

      Object.keys(records).forEach(id => {
        const object = records[id]

        genericWatchers.forEach(callWatcher, object)

        callWatchers(objectWatchers[id], object)
        callWatchers(objectWatchers[object.$ref], object)
      })
    }
    this.objects.on('add', onAddOrUpdate)
    this.objects.on('update', onAddOrUpdate)
  }

  // Wait for an object to appear or to be updated.
  //
  // Predicate can be either an id, a UUID, an opaque reference or a
  // function.
  //
  // TODO: implements a timeout.
  waitObject(predicate, cb) {
    // backward compatibility
    if (cb === undefined) {
      return new Promise(resolve => this.waitObject(predicate, resolve))
    }

    const stopWatch = this.watchObject(predicate, object => {
      stopWatch()
      return cb(object)
    })
    return stopWatch
  }

  // Watch an object for changes.
  //
  // Predicate can be either an id, a UUID, an opaque reference or a
  // function.
  watchObject(predicate, cb) {
    if (typeof predicate === 'function') {
      const genericWatchers = this._genericWatchers

      const watcher = obj => {
        if (predicate(obj)) {
          return cb(obj)
        }
      }
      genericWatchers.add(watcher)
      return () => genericWatchers.delete(watcher)
    }

    const watchers = this._objectWatchers
    const watcher = watchers[predicate]
    if (watcher === undefined) {
      watchers[predicate] = cb
    } else if (Array.isArray(watcher)) {
      watcher.push(cb)
    } else {
      watchers[predicate] = [watcher, cb]
    }
    return removeWatcher.bind(watchers, predicate, cb)
  }

  // wait for an object to be in a specified state

  waitObjectState(
    refOrUuid,
    predicate,
    {
      timeout,
      timeoutMessage = refOrUuid => `waitObjectState: timeout reached before ${refOrUuid} in expected state`,
    } = {}
  ) {
    return new Promise((resolve, reject) => {
      const object = this.getObject(refOrUuid, undefined)
      if (object !== undefined && predicate(object)) {
        return resolve(object)
      }

      let timeoutHandle
      const stop = this.watchObject(refOrUuid, object => {
        if (predicate(object)) {
          clearTimeout(timeoutHandle)
          stop()
          resolve(object)
        }
      })

      if (timeout !== undefined) {
        const error = new Error(timeoutMessage(refOrUuid))
        timeoutHandle = setTimeout(() => {
          stop()
          reject(error)
        }, timeout)
      }
    })
  }
}

function mixin(mixins) {
  const xapiProto = Xapi.prototype
  const { defineProperties, getOwnPropertyDescriptor, getOwnPropertyNames } = Object
  const descriptors = { __proto__: null }
  Object.keys(mixins).forEach(prefix => {
    const mixinProto = mixins[prefix].prototype
    getOwnPropertyNames(mixinProto)
      .filter(_ => _ !== 'constructor')
      .forEach(name => {
        const key = name[0] === '_' ? name : `${prefix}_${name}`

        assert(!(key in descriptors), `${key} is already defined`)

        descriptors[key] = getOwnPropertyDescriptor(mixinProto, name)
      })
  })
  defineProperties(xapiProto, descriptors)
}

mixin(Mixins)

function getCallRetryOpts() {
  return this._callRetryWhenTooManyPendingTasks
}
Xapi.prototype.call = pRetry.wrap(Xapi.prototype.call, getCallRetryOpts)
Xapi.prototype.callAsync = pRetry.wrap(Xapi.prototype.callAsync, getCallRetryOpts)
