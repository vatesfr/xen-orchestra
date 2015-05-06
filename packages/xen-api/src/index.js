import Bluebird, {promisify} from 'bluebird'
import Collection from 'xo-collection'
import createDebug from 'debug'
import forEach from 'lodash.foreach'
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

const isNetworkError = (error) => NETWORK_ERRORS[error.code]

// -------------------------------------------------------------------

const XAPI_NETWORK_ERRORS = {
  HOST_STILL_BOOTING: true,
  HOST_HAS_NO_MANAGEMENT_IP: true
}

const isXapiNetworkError = (error) => XAPI_NETWORK_ERRORS[error.code]

// -------------------------------------------------------------------

const areEventsLost = (error) => error.code === 'EVENTS_LOST'

const isHostSlave = (error) => error.code === 'HOST_IS_SLAVE'

const isSessionInvalid = (error) => error.code === 'SESSION_INVALID'

// -------------------------------------------------------------------

class XapiError extends BaseError {
  constructor (error) {
    super(error[0])

    this.code = error[0]
    this.params = error.slice(1)
  }
}

export const wrapError = error => new XapiError(error)

// ===================================================================

const URL_RE = /^(http(s)?:\/\/)?([^/]+?)(?::([0-9]+))?(?:\/.*)?$/
function parseUrl (url) {
  const matches = URL_RE.exec(url)
  if (!matches) {
    throw new Error('invalid URL: ' + url)
  }

  const [, protocol, , host, port] = matches
  let [, , isSecure] = matches

  if (!protocol) {
    isSecure = true
  }

  return {
    isSecure: Boolean(isSecure),
    host,
    port: port !== undefined ?
      +port :
      isSecure ? 443 : 80
  }
}

// -------------------------------------------------------------------

const {
  create: createObject,
  defineProperty
} = Object

const noop = () => {}

// -------------------------------------------------------------------

const notConnectedPromise = Bluebird.reject(new Error('not connected'))

// Does nothing but avoid a Bluebird message error.
notConnectedPromise.catch(noop)

// ===================================================================

const OPAQUE_REF_RE = /^OpaqueRef:/
const MAX_TRIES = 5

// -------------------------------------------------------------------

export class Xapi extends EventEmitter {
  constructor (opts) {
    super()

    this._url = parseUrl(opts.url)
    this._auth = opts.auth

    this._sessionId = notConnectedPromise

    this._init()

    this._pool = null
    this._objectsByRefs = createObject(null)
    this._objectsByRefs['OpaqueRef:NULL'] = null
    this._objects = new Collection()
    this._objects.getId = (object) => object.$id

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
    return `${this._auth.user}@${this._url.host}`
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

    this._sessionId = notConnectedPromise

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
    }).catch(isSessionInvalid, () => {
      // XAPI is sometimes reinitialized and sessions are lost.
      // Try to login again.
      debug('%s: the session has been reinitialized', this._humanId)

      this._sessionId = notConnectedPromise

      return this._sessionCall(method, args)
    })
  }

  // Low level call: handle transport errors.
  _transportCall (method, args, tries = 1) {
    debug('%s: %s(...)', this._humanId, method)

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

          return this._transportCall(method, args, tries + 1)
        })
      })
      .catch(isHostSlave, ({params: [master]}) => {
        debug('%s: host is slave, attempting to connect at %s', this._humanId, master)

        this._url.host = master
        this._init()

        return this._transportCall(method, args)
      })
  }

  // Lowest level call: do not handle any errors.
  _rawCall (method, args) {
    return this._xmlRpcCall(method, args)
      .then(result => {
        const {Status: status} = result

        // Return the plain result if it does not have a valid XAPI
        // format.
        if (!status) {
          return result
        }

        if (status === 'Success') {
          return result.Value
        }

        wrapError(result.ErrorDescription)
      })
      .cancellable()
  }

  _init () {
    const {isSecure, host, port} = this._url

    const client = (isSecure ?
      createSecureXmlRpcClient :
      createXmlRpcClient
    )({
      host,
      port,
      rejectUnauthorized: false,
      timeout: 10
    })

    this._xmlRpcCall = promisify(client.methodCall, client)
  }

  _normalizeObject (type, ref, object) {
    const {_objectsByRefs: objectsByRefs} = this

    forEach(object, function resolveIfLink (value, key, object) {
      if (typeof value === 'string' && OPAQUE_REF_RE.test(value)) {
        defineProperty(object, key, {
          enumerable: true,
          get: () => objectsByRefs[value]
        })
      } else if (typeof value === 'object') {
        forEach(value, resolveIfLink)
      }
    })

    object.$id = object.uuid || ref
    object.$ref = ref
    object.$type = type

    defineProperty(object, '$pool', {
      enumerable: true,
      get: () => this._pool
    })
  }

  _watchEvents () {
    this.call(
      'event.from', ['*'], this._fromToken, 1e3 + 0.1
    ).then(({token, events}) => {
      this._fromToken = token

      const {
        _objects: objects,
        _objectsByRefs: objectsByRefs
      } = this

      forEach(events, event => {
        const {operation: op} = event

        const {ref} = event
        if (op === 'del') {
          const object = objectsByRefs[ref]

          if (object) {
            objects.remove(object.$id)
            delete objectsByRefs[ref]
          }
        } else {
          const {class: type, snapshot: object} = event

          this._normalizeObject(type, ref, object)
          objects.set(object)
          objectsByRefs[ref] = object

          if (object.$type === 'pool') {
            this._pool = object
          }
        }
      })
    }).catch(areEventsLost, () => {
      this._objects.clear()
    }).then(() => {
      this._watchEvents()
    }).catch(Bluebird.CancellationError, noop)
  }
}

// ===================================================================

// The default value is a factory function.
export const createClient = (opts) => new Xapi(opts)
