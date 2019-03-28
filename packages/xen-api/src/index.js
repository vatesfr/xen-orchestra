import Collection from 'xo-collection'
import kindOf from 'kindof'
import ms from 'ms'
import httpRequest from 'http-request-plus'
import { EventEmitter } from 'events'
import { fibonacci } from 'iterable-backoff'
import {
  forEach,
  forOwn,
  isArray,
  map,
  noop,
  omit,
  reduce,
  startsWith,
} from 'lodash'
import {
  cancelable,
  defer,
  fromEvents,
  ignoreErrors,
  pCatch,
  pDelay,
  pFinally,
  pTimeout,
  TimeoutError,
} from 'promise-toolbox'

import autoTransport from './transports/auto'
import debug from './_debug'
import getTaskResult from './_getTaskResult'
import isGetAllRecordsMethod from './_isGetAllRecordsMethod'
import isOpaqueRef from './_isOpaqueRef'
import isReadOnlyCall from './_isReadOnlyCall'
import makeCallSetting from './_makeCallSetting'
import parseUrl from './_parseUrl'
import replaceSensitiveValues from './_replaceSensitiveValues'
import XapiError from './_XapiError'

// ===================================================================

export { XapiError }
export const wrapError = XapiError.wrap

// ===================================================================

// in seconds!
const EVENT_TIMEOUT = 60

// http://www.gnu.org/software/libc/manual/html_node/Error-Codes.html
const NETWORK_ERRORS = {
  // Connection has been closed outside of our control.
  ECONNRESET: true,

  // Connection has been aborted locally.
  ECONNABORTED: true,

  // Host is up but refuses connection (typically: no such service).
  ECONNREFUSED: true,

  // TODO: ??
  EINVAL: true,

  // Host is not reachable (does not respond).
  EHOSTUNREACH: true,

  // network is unreachable
  ENETUNREACH: true,

  // Connection configured timed out has been reach.
  ETIMEDOUT: true,
}

const isNetworkError = ({ code }) => NETWORK_ERRORS[code]

// -------------------------------------------------------------------

const XAPI_NETWORK_ERRORS = {
  HOST_STILL_BOOTING: true,
  HOST_HAS_NO_MANAGEMENT_IP: true,
}

const isXapiNetworkError = ({ code }) => XAPI_NETWORK_ERRORS[code]

// -------------------------------------------------------------------

const areEventsLost = ({ code }) => code === 'EVENTS_LOST'

const isHostSlave = ({ code }) => code === 'HOST_IS_SLAVE'

const isMethodUnknown = ({ code }) => code === 'MESSAGE_METHOD_UNKNOWN'

const isSessionInvalid = ({ code }) => code === 'SESSION_INVALID'

// ===================================================================

const {
  create: createObject,
  defineProperties,
  freeze: freezeObject,
  keys: getKeys,
} = Object

// -------------------------------------------------------------------

export const NULL_REF = 'OpaqueRef:NULL'

// -------------------------------------------------------------------

const getKey = o => o.$id

// -------------------------------------------------------------------

// TODO: find a better name
// TODO: merge into promise-toolbox?
const dontWait = promise => {
  // https://github.com/JsCommunity/promise-toolbox#promiseignoreerrors
  ignoreErrors.call(promise)

  // http://bluebirdjs.com/docs/warning-explanations.html#warning-a-promise-was-created-in-a-handler-but-was-not-returned-from-it
  return null
}

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

// timeout of XenAPI HTTP connections
const HTTP_TIMEOUT = 24 * 3600 * 1e3

// -------------------------------------------------------------------

export class Xapi extends EventEmitter {
  constructor(opts) {
    super()

    this._allowUnauthorized = opts.allowUnauthorized
    this._callTimeout = makeCallSetting(opts.callTimeout, 0)
    this._pool = null
    this._readOnly = Boolean(opts.readOnly)
    this._RecordsByType = createObject(null)
    this._sessionId = null

    this._auth = opts.auth
    const url = (this._url = parseUrl(opts.url))
    if (this._auth === undefined) {
      const user = url.username
      if (user !== undefined) {
        this._auth = {
          user,
          password: url.password,
        }
        delete url.username
        delete url.password
      }
    }

    ;(this._objects = new Collection()).getKey = getKey
    this._debounce = opts.debounce == null ? 200 : opts.debounce
    this._watchedTypes = undefined
    this._watching = false

    this.on(DISCONNECTED, this._clearObjects)
    this._clearObjects()

    const { watchEvents } = opts
    if (watchEvents !== false) {
      if (Array.isArray(watchEvents)) {
        this._watchedTypes = watchEvents
      }
      this.watchEvents()
    }
  }

  watchEvents() {
    this._eventWatchers = createObject(null)

    this._taskWatchers = Object.create(null)

    if (this.status === CONNECTED) {
      this._watchEventsWrapper()
    }

    this.on('connected', this._watchEventsWrapper)
    this.on('disconnected', () => {
      this._objects.clear()
    })
  }

  get _url() {
    return this.__url
  }

  set _url(url) {
    this.__url = url
    this._call = autoTransport({
      allowUnauthorized: this._allowUnauthorized,
      url,
    })
  }

  get readOnly() {
    return this._readOnly
  }

  set readOnly(ro) {
    this._readOnly = Boolean(ro)
  }

  get sessionId() {
    const id = this._sessionId

    if (!id || id === CONNECTING) {
      throw new Error('sessionId is only available when connected')
    }

    return id
  }

  get status() {
    const id = this._sessionId

    return id ? (id === CONNECTING ? CONNECTING : CONNECTED) : DISCONNECTED
  }

  get _humanId() {
    return `${this._auth.user}@${this._url.hostname}`
  }

  // ensure we have received all events up to this call
  //
  // optionally returns the up to date object for the given ref
  barrier(ref) {
    const eventWatchers = this._eventWatchers
    if (eventWatchers === undefined) {
      return Promise.reject(
        new Error('Xapi#barrier() requires events watching')
      )
    }

    const key = `xo:barrier:${Math.random()
      .toString(36)
      .slice(2)}`
    const poolRef = this._pool.$ref

    const { promise, resolve } = defer()
    eventWatchers[key] = resolve

    return this._sessionCall('pool.add_to_other_config', [
      poolRef,
      key,
      '',
    ]).then(() =>
      promise.then(() => {
        this._sessionCall('pool.remove_from_other_config', [
          poolRef,
          key,
        ]).catch(noop)

        if (ref === undefined) {
          return
        }

        // support legacy params (type, ref)
        if (arguments.length === 2) {
          ref = arguments[1]
        }

        return this.getObjectByRef(ref)
      })
    )
  }

  async connect() {
    const { status } = this

    if (status === CONNECTED) {
      throw new Error('already connected')
    }

    if (status === CONNECTING) {
      throw new Error('already connecting')
    }

    const auth = this._auth
    if (auth === undefined) {
      throw new Error('missing credentials')
    }

    this._sessionId = CONNECTING

    try {
      const [methods, sessionId] = await Promise.all([
        this._transportCall('system.listMethods', []),
        this._transportCall('session.login_with_password', [
          auth.user,
          auth.password,
        ]),
      ])

      // Uses introspection to list available types.
      const types = (this._types = methods
        .filter(isGetAllRecordsMethod)
        .map(method => method.slice(0, method.indexOf('.'))))
      this._lcToTypes = { __proto__: null }
      types.forEach(type => {
        const lcType = type.toLowerCase()
        if (lcType !== type) {
          this._lcToTypes[lcType] = type
        }
      })

      this._sessionId = sessionId
      this._pool = (await this.getAllRecords('pool'))[0]

      debug('%s: connected', this._humanId)
      this.emit(CONNECTED)
    } catch (error) {
      this._sessionId = null

      throw error
    }
  }

  disconnect() {
    return Promise.resolve().then(() => {
      const { status } = this

      if (status === DISCONNECTED) {
        return Promise.reject(new Error('already disconnected'))
      }

      this._transportCall('session.logout', [this._sessionId]).catch(noop)

      this._sessionId = null

      debug('%s: disconnected', this._humanId)

      this.emit(DISCONNECTED)
    })
  }

  // High level calls.
  call(method, ...args) {
    return this._readOnly && !isReadOnlyCall(method, args)
      ? Promise.reject(new Error(`cannot call ${method}() in read only mode`))
      : this._sessionCall(method, args)
  }

  @cancelable
  callAsync($cancelToken, method, ...args) {
    return this._readOnly && !isReadOnlyCall(method, args)
      ? Promise.reject(new Error(`cannot call ${method}() in read only mode`))
      : this._sessionCall(`Async.${method}`, args).then(taskRef => {
          $cancelToken.promise.then(() =>
            // TODO: do not trigger if the task is already over
            dontWait(this._sessionCall('task.cancel', [taskRef]))
          )

          return pFinally.call(this.watchTask(taskRef), () =>
            dontWait(this._sessionCall('task.destroy', [taskRef]))
          )
        })
  }

  // create a task and automatically destroy it when settled
  //
  //  allowed even in read-only mode because it does not have impact on the
  //  XenServer and it's necessary for getResource()
  createTask(nameLabel, nameDescription = '') {
    const promise = this._sessionCall('task.create', [
      nameLabel,
      nameDescription,
    ])

    promise.then(taskRef => {
      const destroy = () =>
        this._sessionCall('task.destroy', [taskRef]).catch(noop)
      this.watchTask(taskRef).then(destroy, destroy)
    })

    return promise
  }

  getField(type, ref, field) {
    return this._sessionCall(`${type}.get_${field}`, [ref])
  }

  // Nice getter which returns the object for a given $id (internal to
  // this lib), UUID (unique identifier that some objects have) or
  // opaque reference (internal to XAPI).
  getObject(idOrUuidOrRef, defaultValue) {
    if (typeof idOrUuidOrRef === 'object') {
      idOrUuidOrRef = idOrUuidOrRef.$id
    }

    const object =
      this._objects.all[idOrUuidOrRef] || this._objectsByRef[idOrUuidOrRef]

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

    if (object) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('no object with UUID: ' + uuid)
  }

  async getRecord(type, ref) {
    return this._wrapRecord(
      type,
      ref,
      await this._sessionCall(`${type}.get_record`, [ref])
    )
  }

  getRecords(type, refs) {
    return Promise.all(refs.map(ref => this.getRecord(type, ref)))
  }

  async getAllRecords(type) {
    return map(
      await this._sessionCall(`${type}.get_all_records`),
      (record, ref) => this._wrapRecord(type, ref, record)
    )
  }

  async getRecordByUuid(type, uuid) {
    return this.getRecord(
      type,
      await this._sessionCall(`${type}.get_by_uuid`, [uuid])
    )
  }

  @cancelable
  getResource($cancelToken, pathname, { host, query, task } = {}) {
    return this._autoTask(task, `Xapi#getResource ${pathname}`).then(
      taskRef => {
        query = { ...query, session_id: this.sessionId }
        let taskResult
        if (taskRef !== undefined) {
          query.task_id = taskRef
          taskResult = this.watchTask(taskRef)

          if (typeof $cancelToken.addHandler === 'function') {
            $cancelToken.addHandler(() => taskResult)
          }
        }

        let promise = pTimeout.call(
          httpRequest(
            $cancelToken,
            this._url,
            host && {
              hostname: this.getObject(host).address,
            },
            {
              pathname,
              query,
              rejectUnauthorized: !this._allowUnauthorized,
            }
          ),
          HTTP_TIMEOUT
        )

        if (taskResult !== undefined) {
          promise = promise.then(response => {
            response.task = taskResult
            return response
          })
        }

        return promise
      }
    )
  }

  @cancelable
  putResource($cancelToken, body, pathname, { host, query, task } = {}) {
    if (this._readOnly) {
      return Promise.reject(
        new Error(new Error('cannot put resource in read only mode'))
      )
    }

    return this._autoTask(task, `Xapi#putResource ${pathname}`).then(
      taskRef => {
        query = { ...query, session_id: this.sessionId }

        let taskResult
        if (taskRef !== undefined) {
          query.task_id = taskRef
          taskResult = this.watchTask(taskRef)

          if (typeof $cancelToken.addHandler === 'function') {
            $cancelToken.addHandler(() => taskResult)
          }
        }

        const headers = {}

        // Xen API does not support chunk encoding.
        const isStream = typeof body.pipe === 'function'
        const { length } = body
        if (isStream && length === undefined) {
          // add a fake huge content length (1 PiB)
          headers['content-length'] = '1125899906842624'
        }

        const doRequest = (...opts) =>
          pTimeout.call(
            httpRequest.put(
              $cancelToken,
              this._url,
              host && {
                hostname: this.getObject(host).address,
              },
              {
                body,
                headers,
                query,
                pathname,
                rejectUnauthorized: !this._allowUnauthorized,
              },
              ...opts
            ),
            HTTP_TIMEOUT
          )

        // if a stream, sends a dummy request to probe for a
        // redirection before consuming body
        const promise = isStream
          ? doRequest({
              body: '',

              // omit task_id because this request will fail on purpose
              query: 'task_id' in query ? omit(query, 'task_id') : query,

              maxRedirects: 0,
            }).then(
              response => {
                response.cancel()
                return doRequest()
              },
              error => {
                let response
                if (error != null && (response = error.response) != null) {
                  response.cancel()

                  const {
                    headers: { location },
                    statusCode,
                  } = response
                  if (statusCode === 302 && location !== undefined) {
                    // ensure the original query is sent
                    return doRequest(location, { query })
                  }
                }

                throw error
              }
            )
          : doRequest()

        return promise.then(response => {
          const { req } = response

          if (taskResult !== undefined) {
            taskResult = taskResult.catch(error => {
              error.url = response.url
              throw error
            })
          }

          if (req.finished) {
            response.cancel()
            return taskResult
          }

          return fromEvents(req, ['close', 'finish']).then(() => {
            response.cancel()
            return taskResult
          })
        })
      }
    )
  }

  setField(type, ref, field, value) {
    return this.call(`${type}.set_${field}`, ref, value).then(noop)
  }

  setFieldEntries(type, ref, field, entries) {
    return Promise.all(
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
        if (error == null || error.code !== 'MAP_DUPLICATE_KEY') {
          throw error
        }
      }
      await this.call(`${type}.remove_from_${field}`, ref, entry)
    }
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
    return watcher.promise
  }

  get pool() {
    return this._pool
  }

  get objects() {
    return this._objects
  }

  _clearObjects() {
    ;(this._objectsByRef = createObject(null))[NULL_REF] = undefined
    this._nTasks = 0
    this._objects.clear()
    this.objectsFetched = new Promise(resolve => {
      this._resolveObjectsFetched = resolve
    })
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

  // Medium level call: handle session errors.
  _sessionCall(method, args, timeout = this._callTimeout(method, args)) {
    try {
      if (startsWith(method, 'session.')) {
        throw new Error('session.*() methods are disabled from this interface')
      }

      const newArgs = [this.sessionId]
      if (args !== undefined) {
        newArgs.push.apply(newArgs, args)
      }

      return pTimeout.call(
        pCatch.call(
          this._transportCall(method, newArgs),
          isSessionInvalid,
          () => {
            // XAPI is sometimes reinitialized and sessions are lost.
            // Try to login again.
            debug('%s: the session has been reinitialized', this._humanId)

            this._sessionId = null
            return this.connect().then(() => this._sessionCall(method, args))
          }
        ),
        timeout
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }

  _addObject(type, ref, object) {
    object = this._wrapRecord(type, ref, object)

    // Finally freezes the object.
    freezeObject(object)

    const objects = this._objects
    const objectsByRef = this._objectsByRef

    // An object's UUID can change during its life.
    const prev = objectsByRef[ref]
    let prevUuid
    if (prev && (prevUuid = prev.uuid) && prevUuid !== object.uuid) {
      objects.remove(prevUuid)
    }

    this._objects.set(object)
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

  _removeObject(type, ref) {
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

  _processEvents(events) {
    forEach(events, event => {
      let type = event.class
      const lcToTypes = this._lcToTypes
      if (type in lcToTypes) {
        type = lcToTypes[type]
      }
      const { ref } = event
      if (event.operation === 'del') {
        this._removeObject(type, ref)
      } else {
        this._addObject(type, ref, event.snapshot)
      }
    })
  }

  // - prevent multiple watches
  // - swallow errors
  async _watchEventsWrapper() {
    if (!this._watching) {
      this._watching = true
      try {
        await this._watchEvents()
      } catch (error) {
        console.error('_watchEventsWrapper', error)
      }
      this._watching = false
    }
  }

  // TODO: cancelation
  async _watchEvents() {
    this._clearObjects()

    // compute the initial token for the event loop
    //
    // we need to do this before the initial fetch to avoid losing events
    let fromToken
    try {
      fromToken = await this._sessionCall('event.inject', [
        'pool',
        this._pool.$ref,
      ])
    } catch (error) {
      if (isMethodUnknown(error)) {
        return this._watchEventsLegacy()
      }
    }

    const types = this._watchedTypes || this._types

    // initial fetch
    const flush = this.objects.bufferEvents()
    try {
      await Promise.all(
        types.map(async type => {
          try {
            // FIXME: use _transportCall to avoid auto-reconnection
            forOwn(
              await this._sessionCall(`${type}.get_all_records`),
              (record, ref) => {
                // we can bypass _processEvents here because they are all *add*
                // event and all objects are of the same type
                this._addObject(type, ref, record)
              }
            )
          } catch (error) {
            // there is nothing ideal to do here, do not interrupt event
            // handling
            if (error != null && error.code !== 'MESSAGE_REMOVED') {
              console.warn('_watchEvents', 'initial fetch', type, error)
            }
          }
        })
      )
    } finally {
      flush()
    }
    this._resolveObjectsFetched()

    // event loop
    const debounce = this._debounce
    while (true) {
      if (debounce != null) {
        await pDelay(debounce)
      }

      let result
      try {
        result = await this._sessionCall(
          'event.from',
          [
            types,
            fromToken,
            EVENT_TIMEOUT + 0.1, // must be float for XML-RPC transport
          ],
          EVENT_TIMEOUT * 1e3 * 1.1
        )
      } catch (error) {
        if (error instanceof TimeoutError) {
          continue
        }
        if (areEventsLost(error)) {
          return this._watchEvents()
        }
        throw error
      }

      fromToken = result.token
      this._processEvents(result.events)

      // detect and fix disappearing tasks (e.g. when toolstack restarts)
      if (result.valid_ref_counts.task !== this._nTasks) {
        await ignoreErrors.call(
          this._sessionCall('task.get_all_records').then(tasks => {
            const toRemove = new Set()
            forOwn(this.objects.all, object => {
              if (object.$type === 'task') {
                toRemove.add(object.$ref)
              }
            })
            forOwn(tasks, (task, ref) => {
              toRemove.delete(ref)
              this._addObject('task', ref, task)
            })
            toRemove.forEach(ref => {
              this._removeObject('task', ref)
            })
          })
        )
      }
    }
  }

  // This method watches events using the legacy `event.next` XAPI
  // methods.
  //
  // It also has to manually get all objects first.
  _watchEventsLegacy() {
    const getAllObjects = async () => {
      const flush = this.objects.bufferEvents()
      try {
        await Promise.all(
          this._types.map(type =>
            this._sessionCall(`${type}.get_all_records`).then(
              objects => {
                forEach(objects, (object, ref) => {
                  this._addObject(type, ref, object)
                })
              },
              error => {
                if (error.code !== 'MESSAGE_REMOVED') {
                  throw error
                }
              }
            )
          )
        )
      } finally {
        flush()
      }
      this._resolveObjectsFetched()
    }

    const watchEvents = () =>
      this._sessionCall('event.register', [['*']]).then(loop)

    const loop = () =>
      this.status === CONNECTED &&
      this._sessionCall('event.next').then(onSuccess, onFailure)

    const onSuccess = events => {
      this._processEvents(events)

      const debounce = this._debounce
      return debounce == null ? loop() : pDelay(debounce).then(loop)
    }

    const onFailure = error => {
      if (areEventsLost(error)) {
        return this._sessionCall('event.unregister', [['*']]).then(watchEvents)
      }

      throw error
    }

    return getAllObjects().then(watchEvents)
  }

  _wrapRecord(type, ref, data) {
    const RecordsByType = this._RecordsByType
    let Record = RecordsByType[type]
    if (Record === undefined) {
      const fields = getKeys(data)
      const nFields = fields.length
      const xapi = this

      const getObjectByRef = ref => this._objectsByRef[ref]

      Record = function(ref, data) {
        defineProperties(this, {
          $id: { value: data.uuid || ref },
          $ref: { value: ref },
          $xapi: { value: xapi },
        })
        for (let i = 0; i < nFields; ++i) {
          const field = fields[i]
          this[field] = data[field]
        }
      }

      const getters = { $pool: getPool }
      const props = { $type: type }
      fields.forEach(field => {
        props[`set_${field}`] = function(value) {
          return xapi.setField(this.$type, this.$ref, field, value)
        }

        const $field = (field in RESERVED_FIELDS ? '$$' : '$') + field

        const value = data[field]
        if (isArray(value)) {
          if (value.length === 0 || isOpaqueRef(value[0])) {
            getters[$field] = function() {
              const value = this[field]
              return value.length === 0 ? value : value.map(getObjectByRef)
            }
          }

          props[`add_to_${field}`] = function(...values) {
            return xapi
              .call(`${type}.add_${field}`, this.$ref, values)
              .then(noop)
          }
        } else if (value !== null && typeof value === 'object') {
          getters[$field] = function() {
            const value = this[field]
            const result = {}
            getKeys(value).forEach(key => {
              result[key] = xapi._objectsByRef[value[key]]
            })
            return result
          }
          props[`update_${field}`] = function(entries, value) {
            return typeof entries === 'string'
              ? xapi.setFieldEntry(this.$type, this.$ref, field, entries, value)
              : xapi.setFieldEntries(this.$type, this.$ref, field, entries)
          }
        } else if (value === '' || isOpaqueRef(value)) {
          // 2019-02-07 - JFT: even if `value` should not be an empty string for
          // a ref property, an user had the case on XenServer 7.0 on the CD VBD
          // of a VM created by XenCenter
          getters[$field] = function() {
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

Xapi.prototype._transportCall = reduce(
  [
    function(method, args) {
      return pTimeout
        .call(this._call(method, args), HTTP_TIMEOUT)
        .catch(error => {
          if (!(error instanceof Error)) {
            error = XapiError.wrap(error)
          }

          // do not log the session ID
          //
          // TODO: should log at the session level to avoid logging sensitive
          // values?
          const params = args[0] === this._sessionId ? args.slice(1) : args

          error.call = {
            method,
            params: replaceSensitiveValues(params, '* obfuscated *'),
          }
          throw error
        })
    },
    call =>
      function() {
        let iterator // lazily created
        const loop = () =>
          pCatch.call(
            call.apply(this, arguments),
            isNetworkError,
            isXapiNetworkError,
            error => {
              if (iterator === undefined) {
                iterator = fibonacci()
                  .clamp(undefined, 60)
                  .take(10)
                  .toMs()
              }

              const cursor = iterator.next()
              if (!cursor.done) {
                // TODO: ability to cancel the connection
                // TODO: ability to force immediate reconnection

                const delay = cursor.value
                debug(
                  '%s: network error %s, next try in %s ms',
                  this._humanId,
                  error.code,
                  delay
                )
                return pDelay(delay).then(loop)
              }

              debug('%s: network error %s, aborting', this._humanId, error.code)

              // mark as disconnected
              pCatch.call(this.disconnect(), noop)

              throw error
            }
          )
        return loop()
      },
    call =>
      function loop() {
        return pCatch.call(
          call.apply(this, arguments),
          isHostSlave,
          ({ params: [master] }) => {
            debug(
              '%s: host is slave, attempting to connect at %s',
              this._humanId,
              master
            )

            const newUrl = {
              ...this._url,
              hostname: master,
            }
            this.emit('redirect', newUrl)
            this._url = newUrl

            return loop.apply(this, arguments)
          }
        )
      },
    call =>
      function(method) {
        const startTime = Date.now()
        return call.apply(this, arguments).then(
          result => {
            debug(
              '%s: %s(...) [%s] ==> %s',
              this._humanId,
              method,
              ms(Date.now() - startTime),
              kindOf(result)
            )
            return result
          },
          error => {
            debug(
              '%s: %s(...) [%s] =!> %s',
              this._humanId,
              method,
              ms(Date.now() - startTime),
              error
            )
            throw error
          }
        )
      },
  ],
  (call, decorator) => decorator(call)
)

// ===================================================================

// The default value is a factory function.
export const createClient = opts => new Xapi(opts)
