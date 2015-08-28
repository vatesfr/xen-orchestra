import Bluebird, {promisify} from 'bluebird'
import Collection from 'xo-collection'
import createDebug from 'debug'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import isArray from 'lodash.isarray'
import isObject from 'lodash.isobject'
import kindOf from 'kindof'
import map from 'lodash.map'
import ms from 'ms'
import startsWith from 'lodash.startswith'
import {BaseError} from 'make-error'
import {
  createClient as createXmlRpcClient,
  createSecureClient as createSecureXmlRpcClient
} from 'xmlrpc'
import {EventEmitter} from 'events'

const debug = createDebug('xen-api')

// ===================================================================

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

  // Connection configured timed out has been reach.
  ETIMEDOUT: true
}

const isNetworkError = ({code}) => NETWORK_ERRORS[code]

// -------------------------------------------------------------------

const XAPI_NETWORK_ERRORS = {
  HOST_STILL_BOOTING: true,
  HOST_HAS_NO_MANAGEMENT_IP: true
}

const isXapiNetworkError = ({code}) => XAPI_NETWORK_ERRORS[code]

// -------------------------------------------------------------------

const areEventsLost = ({code}) => code === 'EVENTS_LOST'

const isHostSlave = ({code}) => code === 'HOST_IS_SLAVE'

const isMethodUnknown = ({code}) => code === 'MESSAGE_METHOD_UNKNOWN'

const isSessionInvalid = ({code}) => code === 'SESSION_INVALID'

// -------------------------------------------------------------------

class XapiError extends BaseError {
  constructor ([code, ...params]) {
    super(`${code}(${params.join(', ')})`)

    this.code = code
    this.params = params
  }
}

export const wrapError = error => new XapiError(error)

// ===================================================================

const URL_RE = /^(?:(http(s)?:)\/*)?([^/]+?)(?::([0-9]+))?\/?$/
function parseUrl (url) {
  const matches = URL_RE.exec(url)
  if (!matches) {
    throw new Error('invalid URL: ' + url)
  }

  let [, protocol, isSecure, hostname, port] = matches
  if (!protocol) {
    protocol = 'https:'
    isSecure = true
  } else {
    isSecure = Boolean(isSecure)
  }

  return {
    isSecure,
    protocol, hostname, port,
    path: '/json',
    pathname: '/json'
  }
}

// -------------------------------------------------------------------

const parseResult = (function (parseJson) {
  return (result) => {
    const {Status: status} = result

    // Return the plain result if it does not have a valid XAPI
    // format.
    if (!status) {
      return result
    }

    if (status === 'Success') {
      let {Value: value} = result

      // XAPI returns an empty string (invalid JSON) for an empty
      // result.
      if (!value) {
        return ''
      }

      // Fix XAPI JSON which sometimes contains a tab instead of
      // \t.
      if (value.indexOf('\t') !== -1) {
        value = value.replace(/\t/g, '\\t')
      }

      return parseJson(value)
    }

    throw wrapError(result.ErrorDescription)
  }
})(JSON.parse)

// -------------------------------------------------------------------

const {
  create: createObject,
  defineProperties,
  defineProperty,
  freeze: freezeObject
} = Object

const noop = () => {}

// -------------------------------------------------------------------

let getNotConnectedPromise = function () {
  const promise = Bluebird.reject(new Error('not connected'))

  // Does nothing but avoid a Bluebird message error.
  promise.catch(noop)

  getNotConnectedPromise = () => promise

  return promise
}

// -------------------------------------------------------------------

const OPAQUE_REF_RE = /^OpaqueRef:/

// -------------------------------------------------------------------

const EMPTY_ARRAY = freezeObject([])

// ===================================================================

const MAX_TRIES = 5

// -------------------------------------------------------------------

export class Xapi extends EventEmitter {
  constructor (opts) {
    super()

    this._url = parseUrl(opts.url)
    this._auth = opts.auth

    this._sessionId = getNotConnectedPromise()

    this._init()

    this._pool = null
    this._objectsByRefs = createObject(null)
    this._objectsByRefs['OpaqueRef:NULL'] = null
    this._objects = new Collection()
    this._objects.getKey = (object) => object.$id

    this._fromToken = ''
    this.on('connected', this._watchEvents)
    this.on('disconnected', () => {
      this._fromToken = ''
      this._objects.clear()
    })
  }

  get sessionId () {
    if (this.status !== 'connected') {
      throw new Error('sessionId is only available when connected')
    }

    return this._sessionId.value()
  }

  get status () {
    const {_sessionId: sessionId} = this

    if (sessionId.isFulfilled()) {
      return 'connected'
    }

    if (sessionId.isPending()) {
      return 'connecting'
    }

    return 'disconnected'
  }

  get _humanId () {
    return `${this._auth.user}@${this._url.hostname}`
  }

  connect () {
    const {status} = this

    if (status === 'connected') {
      return Bluebird.reject(new Error('already connected'))
    }

    if (status === 'connecting') {
      return Bluebird.reject(new Error('already connecting'))
    }

    this._sessionId = this._transportCall('session.login_with_password', [
      this._auth.user,
      this._auth.password
    ])

    return this._sessionId.then(() => {
      debug('%s: connected', this._humanId)

      this.emit('connected')
    })
  }

  disconnect () {
    const {status} = this

    if (status === 'disconnected') {
      return Bluebird.reject('already disconnected')
    }

    if (status === 'connecting') {
      return this._sessionId.cancel().catch(Bluebird.CancellationError, () => {
        debug('%s: disconnected', this._humanId)

        this.emit('disconnected')
      })
    }

    this._sessionId = getNotConnectedPromise()

    return Bluebird.resolve().then(() => {
      debug('%s: disconnected', this._humanId)

      this.emit('disconnected')
    })
  }

  // High level calls.
  call (method, ...args) {
    return this._sessionCall(method, args)
  }

  // Nice getter which returns the object for a given $id (internal to
  // this lib), UUID (unique identifier that some objects have) or
  // opaque reference (internal to XAPI).
  getObject (idOrUuidOrRef, defaultValue) {
    const object = (
      // if there is an UUID, it is also the $id.
      this._objects.all[idOrUuidOrRef] ||
      this._objectsByRefs[idOrUuidOrRef]
    )

    if (object) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('there is not object can be matched to ' + idOrUuidOrRef)
  }

  // Returns the object for a given opaque reference (internal to
  // XAPI).
  getObjectByRef (ref, defaultValue) {
    const object = this._objectsByRefs[ref]

    if (object) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('there is no object with the ref ' + ref)
  }

  // Returns the object for a given UUID (unique identifier that some
  // objects have).
  getObjectByUuid (uuid, defaultValue) {
    // Objects ids are already UUIDs if they have one.
    const object = this._objects.all[uuid]

    if (object) return object

    if (arguments.length > 1) return defaultValue

    throw new Error('there is no object with the UUID ' + uuid)
  }

  get pool () {
    return this._pool
  }

  get objects () {
    return this._objects
  }

  // Medium level call: handle session errors.
  _sessionCall (method, args) {
    if (startsWith(method, 'session.')) {
      return Bluebird.reject(
        new Error('session.*() methods are disabled from this interface')
      )
    }

    return this._sessionId.then((sessionId) => {
      return this._transportCall(method, [sessionId].concat(args))
    }, error => {
      debug('%s: %s(...) =!> NOT CONNECTED', this._humanId, method)
      throw error
    }).catch(isSessionInvalid, () => {
      // XAPI is sometimes reinitialized and sessions are lost.
      // Try to login again.
      debug('%s: the session has been reinitialized', this._humanId)

      this._sessionId = getNotConnectedPromise()
      return this.connect().then(() => this._sessionCall(method, args))
    })
  }

  // Low level call: handle transport errors.
  _transportCall (method, args, startTime = Date.now(), tries = 1) {
    return this._rawCall(method, args)
      .catch(isNetworkError, isXapiNetworkError, error => {
        debug('%s: network error %s', this._humanId, error.code)

        if (!(tries < MAX_TRIES)) {
          debug('%s too many network errors (%s), give up', this._humanId, tries)

          throw error
        }

        // TODO: ability to cancel the connection
        // TODO: ability to force immediate reconnection
        // TODO: implement back-off

        return Bluebird.delay(5e3).then(() => {
          // TODO: handling not responding host.

          return this._transportCall(method, args, startTime, tries + 1)
        })
      })
      .catch(isHostSlave, ({params: [master]}) => {
        debug('%s: host is slave, attempting to connect at %s', this._humanId, master)

        this._url.hostname = master
        this._init()

        return this._transportCall(method, args, startTime)
      }).then(
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
  }

  // Lowest level call: do not handle any errors.
  _rawCall (method, args) {
    return this._xmlRpcCall(method, args)
      .then(
        parseResult,
        error => {
          const {cause} = error

          console.error(
            'XML-RPC Error: %s (response status %s)',
            cause.message,
            cause.statusCode
          )
          console.error('%s', cause.body)

          throw error
        }
      )
      .cancellable()
  }

  _init () {
    const {isSecure, hostname, port, path} = this._url

    const client = (isSecure ?
      createSecureXmlRpcClient :
      createXmlRpcClient
    )({
      hostname,
      port,
      path,
      rejectUnauthorized: false,
      timeout: 10
    })

    this._xmlRpcCall = promisify(client.methodCall, client)
  }

  _addObject (type, ref, object) {
    const {_objectsByRefs: objectsByRefs} = this

    // Creates resolved properties.
    forEach(object, function resolveObject (value, key, object) {
      if (isArray(value)) {
        if (!value.length) {
          // If the array is empty, it isn't possible to be sure that
          // it is not supposed to contain links, therefore, in
          // benefice of the doubt, a resolved property is defined.
          defineProperty(object, '$' + key, {
            value: EMPTY_ARRAY
          })

          // Minor memory optimization, use the same empty array for
          // everyone.
          object[key] = EMPTY_ARRAY
        } else if (OPAQUE_REF_RE.test(value)) {
          // This is an array of refs.
          defineProperty(object, '$' + key, {
            get: () => freezeObject(map(value, (ref) => objectsByRefs[ref]))
          })

          freezeObject(value)
        }
      } else if (isObject(value)) {
        forEach(value, resolveObject)

        freezeObject(value)
      } else if (OPAQUE_REF_RE.test(value)) {
        defineProperty(object, '$' + key, {
          get: () => objectsByRefs[value]
        })
      }
    })

    // All custom properties are read-only and non enumerable.
    defineProperties(object, {
      $id: { value: object.uuid || ref },
      $pool: { get: () => this._pool },
      $ref: { value: ref },
      $type: { value: type }
    })

    // Finally freezes the object.
    freezeObject(object)

    this._objects.set(object)
    objectsByRefs[ref] = object

    if (type === 'pool') {
      this._pool = object
    }
  }

  _removeObject (ref) {
    const {_objectsByRefs: objectsByRefs} = this

    const object = objectsByRefs[ref]

    if (object) {
      this._objects.remove(object.$id)
      delete objectsByRefs[ref]
    }
  }

  _processEvents (events) {
    forEach(events, event => {
      const {operation: op} = event

      const {ref} = event
      if (op === 'del') {
        this._removeObject(ref)
      } else {
        this._addObject(event.class, ref, event.snapshot)
      }
    })
  }

  _watchEvents () {
    const loop = ((onSucess, onFailure) => {
      return () => this.call(
        'event.from', ['*'], this._fromToken, 1e3 + 0.1
      ).then(onSucess, onFailure)
    })(
      ({token, events}) => {
        this._fromToken = token
        this._processEvents(events)

        return loop()
      },
      error => {
        if (areEventsLost(error)) {
          this._fromToken = ''
          this._objects.clear()

          return loop()
        }

        throw error
      }
    )

    return loop().catch(error => {
      if (isMethodUnknown(error)) {
        return this._watchEventsLegacy()
      }

      if (!(error instanceof Bluebird.CancellationError)) {
        throw error
      }
    })
  }

  // This method watches events using the legacy `event.next` XAPI
  // methods.
  //
  // It also has to manually get all objects first.
  _watchEventsLegacy () {
    const getAllObjects = () => {
      return this.call('system.listMethods').then(methods => {
        // Uses introspection to determine the methods to use to get
        // all objects.
        const getAllRecordsMethods = filter(
          methods,
          ::/\.get_all_records$/.test
        )

        return Promise.all(map(
          getAllRecordsMethods,
          method => this.call(method).then(objects => {
            const type = method.slice(0, method.indexOf('.')).toLowerCase()
            forEach(objects, (object, ref) => {
              this._addObject(type, ref, object)
            })
          })
        ))
      })
    }

    const watchEvents = (() => {
      const loop = ((onSuccess, onFailure) => {
        return this.call('event.next').then(onSuccess, onFailure)
      })(
        events => {
          this._processEvents(events)
          return loop()
        },
        error => {
          if (areEventsLost(error)) {
            return this.call('event.unregister', ['*']).then(watchEvents)
          }

          throw error
        }
      )

      return () => this.call('event.register', ['*']).then(loop)
    })()

    return getAllObjects().then(watchEvents)
  }
}

// ===================================================================

// The default value is a factory function.
export const createClient = (opts) => new Xapi(opts)
