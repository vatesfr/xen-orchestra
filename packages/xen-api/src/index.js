import assert from 'assert'
import dns from 'dns'
import kindOf from 'kindof'
import ms from 'ms'
import httpRequest from 'http-request-plus'
import map from 'lodash/map'
import noop from 'lodash/noop'
import omit from 'lodash/omit'
import ProxyAgent from 'proxy-agent'
import { coalesceCalls } from '@vates/coalesce-calls'
import { synchronized } from 'decorator-synchronized'
import { Collection } from 'xo-collection'
import { EventEmitter } from 'events'
import { Index } from 'xo-collection/index'
import {
  cancelable,
  defer,
  fromCallback,
  fromEvents,
  ignoreErrors,
  pDelay,
  pRetry,
  pTimeout,
  TimeoutError,
} from 'promise-toolbox'
import { limitConcurrency } from 'limit-concurrency-decorator'

import autoTransport from './transports/auto'
import debug from './_debug'
import getTaskResult from './_getTaskResult'
import isGetAllRecordsMethod from './_isGetAllRecordsMethod'
import isReadOnlyCall from './_isReadOnlyCall'
import makeCallSetting from './_makeCallSetting'
import parseUrl from './_parseUrl'
import Ref from './_Ref'
import replaceSensitiveValues from './_replaceSensitiveValues'

// ===================================================================

// in seconds!
const EVENT_TIMEOUT = 60

// ===================================================================

const { defineProperties, defineProperty, freeze, keys: getKeys } = Object

// -------------------------------------------------------------------

export { Ref }

// -------------------------------------------------------------------

const RESERVED_FIELDS = {
  id: true,
  pool: true,
  ref: true,
  type: true,
  xapi: true,
}

function getPool() {
  return this.$xapi.pool
}

// -------------------------------------------------------------------

const CONNECTED = 'connected'
const CONNECTING = 'connecting'
const DISCONNECTED = 'disconnected'

const BARRIER_PREFIX = 'xo:barrier:'
const BARRIER_MAX_AGE = 60 * 60 * 1e3

// -------------------------------------------------------------------

const identity = value => value

// save current stack trace and add it to any rejected error
//
// This is especially useful when the resolution is separate from the initial
// call, which is often the case with RPC libs.
//
// There is a perf impact and it should be avoided in production.
const addSyncStackTrace = async promise => {
  const stackContainer = new Error()
  try {
    return await promise
  } catch (error) {
    error.stack = stackContainer.stack
    throw error
  }
}

// -------------------------------------------------------------------

export class Xapi extends EventEmitter {
  constructor(opts) {
    super()

    this._addSyncStackTrace =
      opts.syncStackTraces ?? process.env.NODE_ENV === 'development' ? addSyncStackTrace : identity
    this._callTimeout = makeCallSetting(opts.callTimeout, 60 * 60 * 1e3) // 1 hour but will be reduced in the future
    this._httpInactivityTimeout = opts.httpInactivityTimeout ?? 5 * 60 * 1e3 // 5 mins
    this._eventPollDelay = opts.eventPollDelay ?? 60 * 1e3 // 1 min
    this._pool = null
    this._readOnly = Boolean(opts.readOnly)
    this._RecordsByType = { __proto__: null }
    this._reverseHostIpAddresses = opts.reverseHostIpAddresses ?? false

    this._call = limitConcurrency(opts.callConcurrency ?? 20)(this._call)

    this._roCallRetryOptions = {
      delay: 1e3,
      tries: 10,
      ...opts.roCallRetryOptions,
      when: { code: 'ECONNRESET' },
    }

    this._auth = opts.auth
    const url = parseUrl(opts.url)
    if (this._auth === undefined) {
      const user = url.username
      if (user === undefined) {
        throw new TypeError('missing credentials')
      }

      this._auth = {
        user,
        password: url.password,
      }
      delete url.username
      delete url.password
    }
    this._fallBackAddresses = opts.fallBackAddresses ?? []
    this._allowUnauthorized = opts.allowUnauthorized
    if (opts.httpProxy !== undefined) {
      this._httpAgent = new ProxyAgent(this._httpProxy)
    }
    this._setUrl(url)

    this._connected = new Promise(resolve => {
      this._resolveConnected = resolve
    })
    this._disconnected = Promise.resolve()
    this._sessionId = undefined
    this._status = DISCONNECTED

    this._watchEventsError = undefined
    this._lastEventFetchedTimestamp = undefined

    const objects = new Collection()
    objects.createIndex('type', new Index('$type'))
    this._objects = objects

    this._debounce = opts.debounce ?? 200
    this._objectsByRef = { __proto__: null }
    this._objectsFetched = new Promise(resolve => {
      this._resolveObjectsFetched = resolve
    })
    this._eventWatchers = { __proto__: null }
    this._taskWatchers = { __proto__: null }
    this._watchedTypes = undefined
    const { watchEvents } = opts
    if (watchEvents !== false) {
      if (Array.isArray(watchEvents)) {
        this._watchedTypes = watchEvents
      }
      this.watchEvents()
    }
  }

  get httpAgent() {
    return this._httpAgent
  }

  get readOnly() {
    return this._readOnly
  }

  set readOnly(ro) {
    this._readOnly = Boolean(ro)
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  get connected() {
    return this._connected
  }

  get disconnected() {
    return this._disconnected
  }

  get pool() {
    return this._pool
  }

  get sessionId() {
    assert.strictEqual(this._status, CONNECTED)
    return this._sessionId
  }

  get status() {
    return this._status
  }

  connect = coalesceCalls(this.connect)
  // eslint-disable-next-line no-dupe-class-members
  async connect() {
    const status = this._status

    if (status === CONNECTED) {
      console.log('already connected')
      return
    }

    assert.strictEqual(status, DISCONNECTED)

    this._status = CONNECTING
    this._disconnected = new Promise(resolve => {
      this._resolveDisconnected = resolve
    })

    try {
      console.log('will open session')
      await this._sessionOpen()

      console.log('session opened')
      debug('%s: connected', this._humanId)
      this._status = CONNECTED
      this._resolveConnected !== undefined && this._resolveConnected()
      this._resolveConnected = undefined
      console.log('_resolveConnected done')
      this.emit(CONNECTED)
      console.log('_emited')
    } catch (error) {
      console.log('connect error', { error })
      await ignoreErrors.call(this.disconnect())

      throw error
    }
  }

  async disconnect() {
    const status = this._status

    if (status === DISCONNECTED) {
      // console.log('disconnect- already disconected')
      return
    }

    if (status === CONNECTED) {
      // console.log('disconnect-already conected')
      this._connected = new Promise(resolve => {
        this._resolveConnected = resolve
      })
    } else {
      // console.log('disconnect-connecting')
      assert.strictEqual(status, CONNECTING)
    }

    const sessionId = this._sessionId
    if (sessionId !== undefined) {
      this._sessionId = undefined
      await ignoreErrors.call(this._call('session.logout', [sessionId]))
    }

    debug('%s: disconnected', this._humanId)

    this._status = DISCONNECTED
    this._resolveDisconnected()
    this._resolveDisconnected = undefined
    this.emit(DISCONNECTED)
  }

  // ===========================================================================
  // RPC calls
  // ===========================================================================

  // this should be used for instantaneous calls, otherwise use `callAsync`
  call(method, ...args) {
    return isReadOnlyCall(method, args)
      ? this._roCall(method, args)
      : this._readOnly
      ? Promise.reject(new Error(`cannot call ${method}() in read only mode`))
      : this._sessionCall(method, args)
  }

  @cancelable
  async callAsync($cancelToken, method, ...args) {
    if (this._readOnly && !isReadOnlyCall(method, args)) {
      throw new Error(`cannot call ${method}() in read only mode`)
    }

    const taskRef = await this._sessionCall(`Async.${method}`, args)
    $cancelToken.promise.then(() =>
      // TODO: do not trigger if the task is already over
      ignoreErrors.call(this._sessionCall('task.cancel', [taskRef]))
    )

    const promise = this.watchTask(taskRef)

    const destroyTask = () => ignoreErrors.call(this._sessionCall('task.destroy', [taskRef]))
    promise.then(destroyTask, destroyTask)

    return promise
  }

  // ===========================================================================
  // Objects handling helpers
  // ===========================================================================

  async getAllRecords(type) {
    return map(await this._roCall(`${type}.get_all_records`), (record, ref) => this._wrapRecord(type, ref, record))
  }

  async getRecord(type, ref) {
    return this._wrapRecord(type, ref, await this._roCall(`${type}.get_record`, [ref]))
  }

  async getRecordByUuid(type, uuid) {
    return this.getRecord(type, await this._roCall(`${type}.get_by_uuid`, [uuid]))
  }

  getRecords(type, refs) {
    return Promise.all(refs.map(ref => this.getRecord(type, ref)))
  }

  getField(type, ref, field) {
    return this._roCall(`${type}.get_${field}`, [ref])
  }

  setField(type, ref, field, value) {
    return this.call(`${type}.set_${field}`, ref, value).then(noop)
  }

  setFields(type, ref, fields) {
    return Promise.all(
      // eslint-disable-next-line array-callback-return
      getKeys(fields).map(field => {
        const value = fields[field]
        if (value !== undefined) {
          return this.call(`${type}.set_${field}`, ref, value)
        }
      })
    ).then(noop)
  }

  setFieldEntries(type, ref, field, entries) {
    return Promise.all(
      // eslint-disable-next-line array-callback-return
      getKeys(entries).map(entry => {
        const value = entries[entry]
        if (value !== undefined) {
          return this.setFieldEntry(type, ref, field, entry, value)
        }
      })
    ).then(noop)
  }

  async setFieldEntry(type, ref, field, entry, value) {
    if (value === null) {
      return this.call(`${type}.remove_from_${field}`, ref, entry).then(noop)
    }
    while (true) {
      try {
        await this.call(`${type}.add_to_${field}`, ref, entry, value)
        return
      } catch (error) {
        if (error?.code !== 'MAP_DUPLICATE_KEY') {
          throw error
        }
      }
      await this.call(`${type}.remove_from_${field}`, ref, entry)
    }
  }

  // ===========================================================================
  // HTTP requests
  // ===========================================================================

  @cancelable
  async getResource($cancelToken, pathname, { host, query, task } = {}) {
    const taskRef = await this._autoTask(task, `Xapi#getResource ${pathname}`)

    query = { ...query, session_id: this.sessionId }

    let pTaskResult
    if (taskRef !== undefined) {
      query.task_id = taskRef
      pTaskResult = this.watchTask(taskRef)

      if (typeof $cancelToken.addHandler === 'function') {
        $cancelToken.addHandler(() => pTaskResult)
      }
    }

    let url = new URL('http://localhost')
    url.protocol = this._url.protocol
    url.pathname = pathname
    url.search = new URLSearchParams(query)
    await this._setHostAddressInUrl(url, host)

    const response = await pRetry(
      async () =>
        httpRequest($cancelToken, url.href, {
          rejectUnauthorized: !this._allowUnauthorized,

          // this is an inactivity timeout (unclear in Node doc)
          timeout: this._httpInactivityTimeout,

          maxRedirects: 0,

          // Support XS <= 6.5 with Node => 12
          minVersion: 'TLSv1',
          agent: this.httpAgent,
        }),
      {
        when: { code: 302 },
        onRetry: async error => {
          const response = error.response
          if (response === undefined) {
            throw error
          }
          response.cancel()
          url = await this._replaceHostAddressInUrl(new URL(response.headers.location, url))
        },
      }
    )

    if (pTaskResult !== undefined) {
      response.task = pTaskResult
    }

    return response
  }

  @cancelable
  async putResource($cancelToken, body, pathname, { host, query, task } = {}) {
    if (this._readOnly) {
      throw new Error('cannot put resource in read only mode')
    }

    const taskRef = await this._autoTask(task, `Xapi#putResource ${pathname}`)

    query = { ...query, session_id: this.sessionId }

    let pTaskResult
    if (taskRef !== undefined) {
      query.task_id = taskRef
      pTaskResult = this.watchTask(taskRef)

      if (typeof $cancelToken.addHandler === 'function') {
        $cancelToken.addHandler(() => pTaskResult)
      }
    }

    const headers = {}

    // XAPI does not support chunk encoding so there is no proper way to send
    // data without knowing its length
    //
    // as a work-around, a huge content length (1PiB) is added (so that the
    // server won't prematurely cut the connection), and the connection will be
    // cut once all the data has been sent without waiting for a response
    const isStream = typeof body.pipe === 'function'
    const useHack = isStream && body.length === undefined
    if (useHack) {
      console.warn(this._humanId, 'Xapi#putResource', pathname, 'missing length')

      headers['content-length'] = '1125899906842624'
    }

    const url = new URL('http://localhost')
    url.protocol = this._url.protocol
    url.pathname = pathname
    url.search = new URLSearchParams(query)
    await this._setHostAddressInUrl(url, host)

    const doRequest = httpRequest.put.bind(undefined, $cancelToken, {
      body,
      headers,
      rejectUnauthorized: !this._allowUnauthorized,

      // this is an inactivity timeout (unclear in Node doc)
      timeout: this._httpInactivityTimeout,

      // Support XS <= 6.5 with Node => 12
      minVersion: 'TLSv1',
    })

    // if body is a stream, sends a dummy request to probe for a redirection
    // before consuming body
    const response = await (isStream
      ? doRequest(url.href, {
          body: '',

          // omit task_id because this request will fail on purpose
          query: 'task_id' in query ? omit(query, 'task_id') : query,

          maxRedirects: 0,
          agent: this.httpAgent,
        }).then(
          response => {
            response.cancel()
            return doRequest(url.href)
          },
          async error => {
            let response
            if (error != null && (response = error.response) != null) {
              response.cancel()

              const {
                headers: { location },
                statusCode,
              } = response
              if (statusCode === 302 && location !== undefined) {
                // ensure the original query is sent
                const newUrl = new URL(location, url)
                newUrl.searchParams.set('task_id', query.task_id)
                return doRequest((await this._replaceHostAddressInUrl(newUrl)).href)
              }
            }

            throw error
          }
        )
      : doRequest(url.href))

    if (pTaskResult !== undefined) {
      pTaskResult = pTaskResult.catch(error => {
        error.url = response.url
        throw error
      })
    }

    if (!useHack) {
      // consume the response
      response.resume()

      return pTaskResult
    }

    const { req } = response
    if (!req.finished) {
      await fromEvents(req, ['close', 'finish'])
    }
    response.cancel()
    return pTaskResult
  }

  // ===========================================================================
  // Events & cached objects
  // ===========================================================================

  get objects() {
    return this._objects
  }

  get objectsFetched() {
    return this._objectsFetched
  }

  get lastEventFetchedTimestamp() {
    return this._lastEventFetchedTimestamp
  }

  get watchEventsError() {
    return this._watchEventsError
  }

  // ensure we have received all events up to this call
  //
  // optionally returns the up to date object for the given ref
  async barrier(ref) {
    const eventWatchers = this._eventWatchers
    if (eventWatchers === undefined) {
      throw new Error('Xapi#barrier() requires events watching')
    }

    const key = BARRIER_PREFIX + Math.random().toString(36).slice(2)
    const { $ref: poolRef, other_config } = this._pool

    const { promise, resolve } = defer()
    eventWatchers[key] = resolve

    const now = Date.now()

    // delete stale entries
    for (const key of Object.keys(other_config)) {
      if (key.startsWith(BARRIER_PREFIX) && now - other_config[key] > BARRIER_MAX_AGE) {
        ignoreErrors.call(this._sessionCall('pool.remove_from_other_config', [poolRef, key]))
      }
    }

    await this._sessionCall('pool.add_to_other_config', [
      poolRef,
      key,

      // use ms timestamp as values to enable identification of stale entries
      String(now),
    ])

    await this._addSyncStackTrace(promise)

    ignoreErrors.call(this._sessionCall('pool.remove_from_other_config', [poolRef, key]))

    if (ref !== undefined) {
      return this.getObjectByRef(ref)
    }
  }

  // create a task and automatically destroy it when settled
  //
  //  allowed even in read-only mode because it does not have impact on the
  //  XenServer and it's necessary for getResource()
  async createTask(nameLabel, nameDescription = '') {
    const taskRef = await this._sessionCall('task.create', [nameLabel, nameDescription])

    const destroyTask = () => ignoreErrors.call(this._sessionCall('task.destroy', [taskRef]))
    this.watchTask(taskRef).then(destroyTask, destroyTask)

    return taskRef
  }

  // Nice getter which returns the object for a given $id (internal to
  // this lib), UUID (unique identifier that some objects have) or
  // opaque reference (internal to XAPI).
  getObject(idOrUuidOrRef, defaultValue) {
    if (typeof idOrUuidOrRef === 'object') {
      idOrUuidOrRef = idOrUuidOrRef.$id
    }

    const object = this._objects.all[idOrUuidOrRef] || this._objectsByRef[idOrUuidOrRef]

    if (object !== undefined) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('no object with UUID or opaque ref: ' + idOrUuidOrRef)
  }

  // Returns the object for a given opaque reference (internal to
  // XAPI).
  getObjectByRef(ref, defaultValue) {
    const object = this._objectsByRef[ref]

    if (object !== undefined) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('no object with opaque ref: ' + ref)
  }

  // Returns the object for a given UUID (unique identifier that some
  // objects have).
  getObjectByUuid(uuid, defaultValue) {
    // Objects ids are already UUIDs if they have one.
    const object = this._objects.all[uuid]

    if (object !== undefined) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('no object with UUID: ' + uuid)
  }

  // manually run events watching if set to `false` in constructor
  watchEvents() {
    ignoreErrors.call(this._watchEvents())
  }

  watchTask(ref) {
    const watchers = this._taskWatchers
    if (watchers === undefined) {
      throw new Error('Xapi#watchTask() requires events watching')
    }

    // allow task object to be passed
    if (ref.$ref !== undefined) ref = ref.$ref

    let watcher = watchers[ref]
    if (watcher === undefined) {
      // sync check if the task is already settled
      const task = this._objectsByRef[ref]
      if (task !== undefined) {
        const result = getTaskResult(task)
        if (result !== undefined) {
          return result
        }
      }

      watcher = watchers[ref] = defer()
    }
    return this._addSyncStackTrace(watcher.promise)
  }

  async _checkIfConnected() {
    try {
      await this._transport('host.get_servertime', ['1', '1'])
      // host is ok but with a broken call ? , nothing to do here
      return true
    } catch (error) {
      if (error.code === 'SESSION_INVALID') {
        return true
      }
      if (
        [
          'EHOSTUNREACH',
          'HOST_IS_SLAVE',
          'ENOTFOUND',
          'ECONNRESET',
          'HOST_OFFLINE',
          'ETIMEDOUT',
          'ECONNRESET',
        ].includes(error.code)
      ) {
        return false
      }
      throw error
    }
  }

  // ===========================================================================
  // Private
  // ===========================================================================

  @synchronized()
  async _updateUrlFromFallbackAdresses(method, args, startTime) {
    console.log('_updateUrlFromFallbackAdresses', method)
    debug('%s: will try to find a new master', this._humanId)
    const hostAddresses = this._fallBackAddresses

    // there can be a master only if there is more than 1 host
    if (hostAddresses.length < 2) {
      return false
    }

    // another call to _updateUrlFromFallbackAdresses has already connected us to the right host
    if ((await this._checkIfConnected()) === true) {
      console.log('already reconnected', method)
      return true
    }

    const checkAndReconnect = async () => {
      try {
        console.log('check and reconnect', this._sessionId, this.status)
        if (!(await this._checkIfConnected())) {
          return false
        }
        //this._status = DISCONNECTED
        //await this.connect()
        // maybe it's in connecting mode and we just need to wait ?
        return true
      } catch (e) {
        console.log(e)
        return false
      }
    }

    for (const hostAdress of hostAddresses) {
      console.log('check ', hostAdress, hostAddresses)
      // we already tested the current master
      /* when retrying it can be a broken url
      if (hostAdress === this._url.hostname) {
        console.log('current master')
        debug(`%s: don't recheck currrent host`, this._humanId)
        continue
      }*/
      // since this method is @synchronized , there can be only on call at once
      this._setUrl({ ...this._url, hostname: hostAdress })

      try {
        await new Promise((resolve, reject) => {
          let timeouted = false

          this._transport('host.get_servertime', ['1', '1'])
            .then(res => {
              if (!timeouted) {
                clearTimeout(timeout)
                resolve(res)
              }
            })
            .catch(e => {
              clearTimeout(timeout)
              reject(e)
            })
          const timeout = setTimeout(() => {
            timeouted = true
            const error = new Error()
            error.code = 'ETIMEDOUT'
            reject(error)
          }, 5000)
        })
        // will not succeed without sessionId, but I only want to know if this host is entitled to answer (he's the master)

        // success
        return true
      } catch (error) {
        console.log(error.code)
        // this host is also down, try the next one
        if (
          ['EHOSTUNREACH', 'ENOTFOUND', 'ECONNRESET', 'HOST_OFFLINE', 'ETIMEDOUT', 'ECONNRESET'].includes(error.code)
        ) {
          debug(`%s: slave %s is also unreachable`, this._humanId, hostAdress)
          continue
        }

        if (error.code === 'HOST_IS_SLAVE') {
          debug('%s: slave %s told us the master is %s', this._humanId, hostAdress, error.params[0])
          this._setUrl({ ...this._url, hostname: hostAdress })
          // check if the master is alive
          if (await checkAndReconnect()) {
            return true
          }
          break
        }

        if (error.code === 'SESSION_INVALID') {
          debug('%s: found new master %s master', this._humanId, hostAdress)
          // lucky : we found the master with the first host answering no need to check for the other slave
          // also , no need to check
          return true
        }

        // any other error should be reported
        throw this._augmentCallError(error, method, args, startTime)
      }
    }
    return false
  }

  _augmentCallError(error, method, args, startTime) {
    // do not log the session ID
    //
    // TODO: should log at the session level to avoid logging sensitive
    // values?
    const params = args[0] === this._sessionId ? args.slice(1) : args

    error.call = {
      method,
      params:
        // it pass server's credentials as param
        method === 'session.login_with_password' ? '* obfuscated *' : replaceSensitiveValues(params, '* obfuscated *'),
    }

    debug('%s: %s(...) [%s] =!> %s', this._humanId, method, ms(Date.now() - startTime), error)
    return error
  }

  async _call(method, args, timeout = this._callTimeout(method, args)) {
    // console.log(method)
    const startTime = Date.now()
    try {
      const result = await pTimeout.call(this._addSyncStackTrace(this._transport(method, args)), timeout)
      debug('%s: %s(...) [%s] ==> %s', this._humanId, method, ms(Date.now() - startTime), kindOf(result))
      // console.log(method, 'success')
      return result
    } catch (error) {
      if (
        this._fallBackAddresses?.length > 1 &&
        (['EHOSTUNREACH', 'HOST_IS_SLAVE', 'ENOTFOUND', 'ECONNRESET', 'HOST_OFFLINE'].includes(error.code) ||
          error instanceof TimeoutError)
      ) {
        const success = await this._updateUrlFromFallbackAdresses(method, args, startTime)
        // try again whether it succeed or fails
        // @todo should we update the first parameter ( session ID ) if we reconnected ?
        // console.log('call again', method)
        // _call is not synchronized
        // that means that the _call order will be changed : we relaunch the method, but any other in the backlog
        // may have been choosen to relaunch , messing the order
        throw error
      }
      // console.log('will escape retry', method, error.code)
      throw this._augmentCallError(error, method, args, startTime)
    }
  }

  // return a promise which resolves to a task ref or undefined
  _autoTask(task = this._taskWatchers !== undefined, name) {
    if (task === false) {
      return Promise.resolve()
    }

    if (task === true) {
      return this.createTask(name)
    }

    // either a reference or a promise to a reference
    return Promise.resolve(task)
  }

  _interruptOnDisconnect(promise) {
    let listener
    const pWrapper = new Promise((resolve, reject) => {
      promise.then(resolve, reject)
      this.on(
        DISCONNECTED,
        (listener = () => {
          reject(new Error('disconnected'))
        })
      )
    })
    const clean = () => {
      this.removeListener(DISCONNECTED, listener)
    }
    pWrapper.then(clean, clean)
    return pWrapper
  }

  _sessionCallRetryOptions = {
    tries: 2,
    when: error =>
      this._status !== DISCONNECTED && error?.code === 'SESSION_INVALID' && this._auth.password !== undefined,
    onRetry: () => this._sessionOpen(),
  }
  async _sessionCall(method, args, timeout) {
    if (method.startsWith('session.')) {
      return Promise.reject(new Error('session.*() methods are disabled from this interface'))
    }

    try {
      return await pRetry(() => {
        const sessionId = this._sessionId
        assert.notStrictEqual(sessionId, undefined)

        const newArgs = [sessionId]
        if (args !== undefined) {
          newArgs.push.apply(newArgs, args)
        }

        return this._call(method, newArgs, timeout)
      }, this._sessionCallRetryOptions)
    } catch (error) {
      if (error?.code === 'SESSION_INVALID') {
        await ignoreErrors.call(this.disconnect())
      }

      throw error
    }
  }

  // FIXME: (probably rare) race condition leading to unnecessary login when:
  // 1. two calls using an invalid session start
  // 2. one fails with SESSION_INVALID and renew the session by calling
  //    `_sessionOpen`
  // 3. the session is renewed
  // 4. the second call fails with SESSION_INVALID which leads to a new
  //    unnecessary renewal
  _sessionOpenRetryOptions = {
    tries: 2,
    when: [{ code: 'HOST_IS_SLAVE' }],
    onRetry: async error => {
      this._setUrl({ ...this._url, hostname: error.params[0] })
    },
  }
  _sessionOpen = coalesceCalls(this._sessionOpen)
  // eslint-disable-next-line no-dupe-class-members
  async _sessionOpen() {
    const { user, password, sessionId } = this._auth

    this._sessionId = sessionId

    if (sessionId === undefined) {
      const params = [user, password]
      this._sessionId = await pRetry(
        () => this._interruptOnDisconnect(this._call('session.login_with_password', params)),
        this._sessionOpenRetryOptions
      )
    }

    const oldPoolRef = this._pool?.$ref

    // Similar to `(await this.getAllRecords('pool'))[0]` but prevents a
    // deadlock in case of error due to a pRetry calling _sessionOpen again
    const pools = await pRetry(
      () => this._call('pool.get_all_records', [this._sessionId]),
      this._sessionOpenRetryOptions
    )
    const poolRef = Object.keys(pools)[0]
    this._pool = this._wrapRecord('pool', poolRef, pools[poolRef])

    this.emit('sessionId', this._sessionId)

    // if the pool ref has changed, it means that the XAPI has been restarted or
    // it's not the same XAPI, we need to refetch the available types and reset
    // the event loop in that case
    if (this._pool.$ref !== oldPoolRef) {
      // console.log('pool ref changed')
      // Uses introspection to list available types.
      const types = (this._types = (await this._interruptOnDisconnect(this._call('system.listMethods')))
        .filter(isGetAllRecordsMethod)
        .map(method => method.slice(0, method.indexOf('.'))))
      this._lcToTypes = { __proto__: null }
      types.forEach(type => {
        const lcType = type.toLowerCase()
        if (lcType !== type) {
          this._lcToTypes[lcType] = type
        }
      })
    }
  }

  async _getHostBackupAddress(host) {
    if (host === undefined) {
      host = await this.getRecord('host', this._pool.master)
    }

    let { address } = host

    const poolBackupNetwork = this._pool.other_config['xo:backupNetwork']
    if (poolBackupNetwork !== undefined) {
      const hostPifs = new Set(host.PIFs)
      try {
        const networkRef = await this._roCall('network.get_by_uuid', [poolBackupNetwork])
        const networkPifs = await this.getField('network', networkRef, 'PIFs')

        const backupNetworkPifRef = networkPifs.find(hostPifs.has, hostPifs)
        address = await this.getField('PIF', backupNetworkPifRef, 'IP')
      } catch (error) {
        console.warn('unable to get the host address linked to the pool backup network', poolBackupNetwork, error)
      }
    }

    if (this._reverseHostIpAddresses) {
      try {
        ;[address] = await fromCallback(dns.reverse, address)
      } catch (error) {
        console.warn('reversing host address', address, error)
      }
    }

    // if this the pool master and the address has not been changed by the conditions above,
    // use the current URL to avoid potential issues with internal addresses and NAT
    if (host.$ref === this._pool.master && address === host.address) {
      return this._url.hostname
    }

    return address
  }

  async getHostBackupUrl(host) {
    return Object.assign(new URL('http://localhost'), {
      ...this._url,
      hostname: await this._getHostBackupAddress(host),
    })
  }

  async _setHostAddressInUrl(url, host) {
    const poolBackupNetwork = this._pool.other_config['xo:backupNetwork']
    if (host === undefined && poolBackupNetwork === undefined) {
      const xapiUrl = this._url
      url.hostname = xapiUrl.hostname
      url.port = xapiUrl.port
      return
    }

    url.hostname = await this._getHostBackupAddress(host)
  }

  _setUrl(url) {
    this._humanId = `${this._auth.user ?? 'unknown'}@${url.hostname}`
    this._transport = autoTransport({
      secureOptions: {
        minVersion: 'TLSv1',
        rejectUnauthorized: !this._allowUnauthorized,
      },
      url,
      agent: this.httpAgent,
    })
    this._url = url
  }

  _addRecordToCache(type, ref, object) {
    object = this._wrapRecord(type, ref, object)

    // Finally freezes the object.
    freeze(object)

    const objects = this._objects
    const objectsByRef = this._objectsByRef

    // An object's UUID can change during its life.
    const prev = objectsByRef[ref]
    let prevUuid
    if (prev !== undefined && (prevUuid = prev.uuid) !== undefined && prevUuid !== object.uuid) {
      objects.remove(prevUuid)
    }

    this._objects.set(object.$id, object)
    objectsByRef[ref] = object

    if (type === 'pool') {
      this._pool = object

      const eventWatchers = this._eventWatchers
      getKeys(object.other_config).forEach(key => {
        const eventWatcher = eventWatchers[key]
        if (eventWatcher !== undefined) {
          delete eventWatchers[key]
          eventWatcher(object)
        }
      })
    } else if (type === 'task') {
      if (prev === undefined) {
        ++this._nTasks
      }

      const taskWatchers = this._taskWatchers
      const taskWatcher = taskWatchers[ref]
      if (taskWatcher !== undefined) {
        const result = getTaskResult(object)
        if (result !== undefined) {
          taskWatcher.resolve(result)
          delete taskWatchers[ref]
        }
      }
    }
  }

  async _replaceHostAddressInUrl(url) {
    try {
      // TODO: look for hostname in all addresses of this host (including all its PIFs)
      const host = (await this.getAllRecords('host')).find(host => host.address === url.hostname)
      if (host !== undefined) {
        await this._setHostAddressInUrl(url, host)
      }
    } catch (error) {
      console.warn('_replaceHostAddressInUrl', url, error)
    }
    return url
  }

  _processEvents(events) {
    const flush = this._objects.bufferEvents()
    events.forEach(event => {
      let type = event.class
      const lcToTypes = this._lcToTypes
      if (type in lcToTypes) {
        type = lcToTypes[type]
      }
      const { ref } = event
      if (event.operation === 'del') {
        this._removeRecordFromCache(type, ref)
      } else {
        this._addRecordToCache(type, ref, event.snapshot)
      }
    })
    flush()
  }

  async _refreshCachedRecords(types) {
    const toRemoveByType = { __proto__: null }
    types.forEach(type => {
      toRemoveByType[type] = new Set()
    })
    const byRefs = this._objectsByRef
    getKeys(byRefs).forEach(ref => {
      const { $type } = byRefs[ref]
      const toRemove = toRemoveByType[$type]
      if (toRemove !== undefined) {
        toRemove.add(ref)
      }
    })

    const flush = this._objects.bufferEvents()
    await Promise.all(
      types.map(async type => {
        try {
          const toRemove = toRemoveByType[type]
          const records = await this._roCall(`${type}.get_all_records`)
          const refs = getKeys(records)
          refs.forEach(ref => {
            toRemove.delete(ref)

            // we can bypass _processEvents here because they are all *add*
            // event and all objects are of the same type
            this._addRecordToCache(type, ref, records[ref])
          })
          toRemove.forEach(ref => {
            this._removeRecordFromCache(type, ref)
          })

          if (type === 'task') {
            this._nTasks = refs.length
          }
        } catch (error) {
          // there is nothing ideal to do here, do not interrupt event
          // handling
          if (error?.code !== 'MESSAGE_REMOVED') {
            console.warn('_refreshCachedRecords', type, error)
          }
        }
      })
    )
    flush()
  }

  _removeRecordFromCache(type, ref) {
    const byRefs = this._objectsByRef
    const object = byRefs[ref]
    if (object !== undefined) {
      this._objects.unset(object.$id)
      delete byRefs[ref]

      if (type === 'task') {
        --this._nTasks
      }
    }

    const taskWatchers = this._taskWatchers
    const taskWatcher = taskWatchers[ref]
    if (taskWatcher !== undefined) {
      const error = new Error('task has been destroyed before completion')
      error.task = object
      error.taskRef = ref
      taskWatcher.reject(error)
      delete taskWatchers[ref]
    }
  }
  // read-only call, automatically retry in case of connection issues
  _roCall(method, args) {
    return pRetry(() => this._sessionCall(method, args), this._roCallRetryOptions)
  }

  _watchEvents = coalesceCalls(this._watchEvents)
  // eslint-disable-next-line no-dupe-class-members
  async _watchEvents() {
    // console.log('_watchEvents')
    // eslint-disable-next-line no-labels
    mainLoop: while (true) {
      // console.log('mainloop')
      if (this._resolveObjectsFetched === undefined) {
        this._objectsFetched = new Promise(resolve => {
          this._resolveObjectsFetched = resolve
        })
      }
      // console.log('will await connection')

      await this._connected
      // console.log('connected')
      // compute the initial token for the event loop
      //
      // we need to do this before the initial fetch to avoid losing events
      let fromToken
      try {
        fromToken = await this._sessionCall('event.inject', ['pool', this._pool.$ref])
      } catch (error) {
        if (error?.code === 'MESSAGE_METHOD_UNKNOWN') {
          return this._watchEventsLegacy()
        }

        console.warn('_watchEvents sessionCall', error)
        await pDelay(this._eventPollDelay)
        continue
      }

      const types = this._watchedTypes ?? this._types

      // initial fetch
      await this._refreshCachedRecords(types)
      this._resolveObjectsFetched()
      this._resolveObjectsFetched = undefined
      this.emit('eventFetchedSuccess')

      // event loop
      const debounce = this._debounce
      while (true) {
        // console.log('loop', this._debounce)
        await pDelay(debounce)

        await this._connected
        // console.log('is connected')
        let result
        try {
          // don't use _sessionCall because a session failure should break the
          // loop and trigger a complete refetch
          // console.log('will call event.from')
          result = await this._call(
            'event.from',
            [
              this._sessionId,
              types,
              fromToken,
              EVENT_TIMEOUT + 0.1, // must be float for XML-RPC transport
            ],
            EVENT_TIMEOUT * 1e3 * 1.1
          )
          // console.log('got response  event.from')
          this._lastEventFetchedTimestamp = Date.now()
          this._watchEventsError = undefined
          this.emit('eventFetchingSuccess')
        } catch (error) {
          const code = error?.code
          console.warn('_watchEvents event.from', error.code)
          if (
            code === 'EVENTS_LOST' ||
            code === 'SESSION_INVALID' ||
            code === 'ECONNRESET' ||
            code === 'ECONNREFUSED'
          ) {
            // eslint-disable-next-line no-labels
            // console.log(' continue main loop')
            continue mainLoop
          }

          this.emit('eventFetchingError', error)
          this._watchEventsError = error
          await pDelay(this._eventPollDelay)
          // console.log('continue  loop')
          continue
        }

        fromToken = result.token
        this._processEvents(result.events)
        // console.log('processed event ')
        // detect and fix disappearing tasks (e.g. when toolstack restarts)
        //
        // FIXME: only if 'task' in 'types
        if (result.valid_ref_counts.task !== this._nTasks) {
          await this._refreshCachedRecords(['task'])
        }
      }
    }
  }

  // This method watches events using the legacy `event.next` XAPI
  // methods.
  //
  // It also has to manually get all objects first.
  async _watchEventsLegacy() {
    if (this._resolveObjectsFetched === undefined) {
      this._objectsFetched = new Promise(resolve => {
        this._resolveObjectsFetched = resolve
      })
    }

    await this._connected

    const types = this._watchedTypes ?? this._types

    // initial fetch
    await this._refreshCachedRecords(types)
    this._resolveObjectsFetched()
    this._resolveObjectsFetched = undefined

    await this._sessionCall('event.register', [types])

    // event loop
    const debounce = this._debounce
    while (true) {
      await pDelay(debounce)

      try {
        await this._connected
        this._processEvents(await this._roCall('event.next', undefined, EVENT_TIMEOUT * 1e3))
      } catch (error) {
        if (error?.code === 'EVENTS_LOST') {
          await ignoreErrors.call(this._sessionCall('event.unregister', [types]))
          return this._watchEventsLegacy()
        }

        console.warn('_watchEventsLegacy', error)
        await pDelay(this._eventPollDelay)
      }
    }
  }

  // Wrap a plain object record into an instance of a dedicated class (e.g. VM)
  //
  // This dedicated class contains the following helpers:
  // - `$<name>` fields: return the cached object(s) pointed by the `<name>` field
  // - `add_<name>(value)` async method: add a value to a set field
  // - `remove_<name>(value)` async method: remove a value from a set field
  // - `set_<name>(value)` async method: assigne a value to a field
  // - `update_<name>(entry, value)` async method: set an entry of a map field to a value (remove if `null`)
  // - `update_<name>(entries)` async method: update entries of a map field
  _wrapRecord(type, ref, data) {
    const RecordsByType = this._RecordsByType
    let Record = RecordsByType[type]
    if (Record === undefined) {
      const fields = getKeys(data)
      const nFields = fields.length
      const xapi = this

      const getObjectByRef = ref => this._objectsByRef[ref]

      Record = defineProperty(
        function (ref, data) {
          defineProperties(this, {
            $id: { value: data.uuid ?? ref },
            $ref: { value: ref },
          })
          for (let i = 0; i < nFields; ++i) {
            const field = fields[i]
            this[field] = data[field]
          }
        },
        'name',
        {
          value: type,
        }
      )

      const getters = { $pool: getPool }
      const props = {
        $call: function (method, ...args) {
          return xapi.call(`${type}.${method}`, this.$ref, ...args)
        },
        $callAsync: function (method, ...args) {
          return xapi.callAsync(`${type}.${method}`, this.$ref, ...args)
        },
        $type: type,
        $xapi: xapi,
      }
      ;(function addMethods(object) {
        Object.getOwnPropertyNames(object).forEach(name => {
          // dont trigger getters (eg sessionId)
          const fn = Object.getOwnPropertyDescriptor(object, name).value
          if (typeof fn === 'function' && name.startsWith(type + '_')) {
            props['$' + name.slice(type.length + 1)] = function (...args) {
              return xapi[name](this.$ref, ...args)
            }
          }
        })
        const proto = Object.getPrototypeOf(object)
        if (proto !== null) {
          addMethods(proto)
        }
      })(xapi)
      fields.forEach(field => {
        props[`set_${field}`] = function (value) {
          return xapi.setField(this.$type, this.$ref, field, value)
        }

        const $field = (field in RESERVED_FIELDS ? '$$' : '$') + field

        const value = data[field]
        if (Array.isArray(value)) {
          if (value.length === 0 || Ref.is(value[0])) {
            getters[$field] = function () {
              const value = this[field]
              return value.length === 0 ? value : value.map(getObjectByRef)
            }
          }

          props[`add_${field}`] = function (value) {
            return xapi.call(`${type}.add_${field}`, this.$ref, value).then(noop)
          }
          props[`remove_${field}`] = function (value) {
            return xapi.call(`${type}.remove_${field}`, this.$ref, value).then(noop)
          }
        } else if (value !== null && typeof value === 'object') {
          getters[$field] = function () {
            const value = this[field]
            const result = {}
            getKeys(value).forEach(key => {
              result[key] = xapi._objectsByRef[value[key]]
            })
            return result
          }
          props[`update_${field}`] = function (entries, value) {
            return typeof entries === 'string'
              ? xapi.setFieldEntry(this.$type, this.$ref, field, entries, value)
              : xapi.setFieldEntries(this.$type, this.$ref, field, entries)
          }
        } else if (Ref.is(value)) {
          getters[$field] = function () {
            return xapi._objectsByRef[this[field]]
          }
        }
      })
      const descriptors = {}
      getKeys(getters).forEach(key => {
        descriptors[key] = {
          configurable: true,
          get: getters[key],
        }
      })
      getKeys(props).forEach(key => {
        descriptors[key] = {
          configurable: true,
          value: props[key],
          writable: true,
        }
      })
      defineProperties(Record.prototype, descriptors)

      RecordsByType[type] = Record
    }
    return new Record(ref, data)
  }
}

// ===================================================================

// The default value is a factory function.
export const createClient = opts => new Xapi(opts)
