import Bluebird, {promisify} from 'bluebird'
import Collection from 'xo-collection'
import createDebug from 'debug'
import findKey from 'lodash.findkey'
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

const noop = () => {}

const notConnectedPromise = Bluebird.reject(new Error('not connected'))

// Does nothing but avoid a Bluebird message error.
notConnectedPromise.catch(noop)

// ===================================================================

export class Xapi extends EventEmitter {
  constructor (opts) {
    super()

    this._url = parseUrl(opts.url)
    this._auth = opts.auth

    this._sessionId = notConnectedPromise

    this._init()

    this._poolId = null
    this._objects = new Collection()
    this._objects.getId = (object) => object.$id

    this._fromToken = ''
    this.on('connected', this._watchEvents)
    this.on('disconnected', () => {
      this._fromToken = ''
      this._objects.clear()
    })
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

      this._sessionId = null

      return this._sessionCall(method, args)
    })
  }

  // Low level call: handle transport errors.
  _transportCall (method, args) {
    debug('%s: %s(...)', this._humanId, method)

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

        throw new XapiError(result.ErrorDescription)
      })
      .catch(isHostSlave, ({params: [master]}) => {
        debug('%s: host is slave, attempting to connect at %s', this._humanId, master)

        this._url.host = master
        this._init()

        return this._transportCall(method, args)
      })
      .catch(isNetworkError, isXapiNetworkError, () => {
        debug('%s: a network error happened', this._humanId)

        // TODO: ability to cancel the connection
        // TODO: ability to force immediate reconnection
        // TODO: implement back-off

        return Bluebird.delay(5e3).then(() => {
          // TODO: handling not responding host.

          return this._transportCall(method, args)
        })
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
    object.$id = object.uuid || ref
    object.$ref = ref
    object.$type = type

    Object.defineProperty(object, '$pool', {
      // enumerable: true,
      get: () => this._pool
    })
  }

  _watchEvents () {
    this.call('event.from', [
      ['*'], this._fromToken, 1e3 + 0.1
    ]).then(({token, events}) => {
      this._fromToken = token

      const {_objects: objects} = this

      forEach(events, event => {
        const {operation: op} = event

        const {ref} = event
        if (op === 'del') {
          // TODO: This should probably be speed up with an index.
          const key = findKey(objects.all, {$ref: ref})

          if (key !== undefined) {
            objects.remove(key)
          }
        } else {
          const {class: type, snapshot: object} = event

          this._normalizeObject(type, ref, object)
          objects.set(object)

          if (object.$type === 'pool') {
            this._pool = object
          }
        }
      })
    }).catch(areEventsLost, () => {
      this._objects.clear()
    }).then(() => {
      this._watchEvents()
    }).catch(noop)
  }
}

// ===================================================================

// The default value is a factory function.
export const createClient = (opts) => new Xapi(opts)
