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
  EHOSTUNREAD: true,

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

const isSessionInvalid = (error) => error.code === 'SESSION_INVALID'

const areEventsLost = (error) => error.code === 'EVENTS_LOST'

// -------------------------------------------------------------------

class XapiError extends BaseError {
  constructor (error) {
    super(error[0])

    this.code = error[0]
    this.params = error.slice(1)
  }
}

// ===================================================================

const URL_RE = /^(?:http(s)?:\/\/)?([^/]+?)(?::([0-9]+))?(?:\/.*)?$/
function parseUrl (url) {
  const matches = URL_RE.exec(url)
  if (!matches) {
    throw new Error('invalid URL: ' + url)
  }

  const [, isSecure, host, port] = matches

  return {
    isSecure: Boolean(isSecure),
    host,
    port: port !== undefined ?
      +port :
      isSecure ? 443 : 80
  }
}

// -------------------------------------------------------------------

const has = Object.hasOwnProperty

// -------------------------------------------------------------------

function getFirstKey (collection) {
  for (let key in collection) {
    if (has.call(collection, key)) {
      return key
    }
  }
}

// ===================================================================

export class Xapi extends EventEmitter {
  constructor (opts) {
    super()

    this._url = parseUrl(opts.url)
    this._auth = opts.auth

    this._sessionId = null

    this._init()

    this._poolId = null
    this._objects = new Collection()
    this._objects.getId = (object) => object.$id

    this._fromToken = ''
    this._fetchObjects().then(() => {
      this._watchEvents()
    })
  }

  // High level calls.
  call (method, args) {
    // When no arguments are passed, return a curried version of the
    // method.
    //
    // Example:
    //
    //     var logIn = xapi.call('session.login_with_password')
    //     logIn('user', 'password')
    if (!args) {
      return (...args) => this.call(method, args)
    }

    return this._sessionCall(method, args)
  }

  get objects () {
    return this._objects
  }

  _logIn () {
    if (!this._sessionId) {
      this._sessionId = this._transportCall('session.login_with_password', [
        this._auth.user,
        this._auth.password
      ])
    }

    return this._sessionId
  }

  // Medium level call: handle session errors.
  _sessionCall (method, args) {
    if (startsWith(method, 'session.')) {
      return Bluebird.reject(
        new Error('session.*() methods are disabled from this interface')
      )
    }

    return this._logIn().then((sessionId) => {
      return this._transportCall(method, [sessionId].concat(args))
    }).catch(isSessionInvalid, () => {
      // XAPI is sometimes reinitialized and sessions are lost.
      // Try to login again.
      return this._sessionCall(method, args)
    })
  }

  // Low level call: handle transport errors.
  _transportCall (method, args) {
    debug('%s: %s(%j)', this._readableId, method, args)

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
      .catch(isNetworkError, isXapiNetworkError, () => {
        // TODO: ability to cancel the connection
        // TODO: ability to force immediate reconnection
        // TODO: implement back-off

        return Bluebird.delay(5e3).then(() => {
          // TODO: handling HOST_IS_SLAVE.
          // TODO: handling not responding host.

          return this._transportCall(method, args)
        })
      })
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
      get: () => this._poolId
    })
  }

  _fetchObjects () {
    const objectsByType = Object.create(null)
    return this.call('system.listMethods', []).each(nsMethod => {
      const [type, method] = nsMethod.split('.')

      if (method !== 'get_all_records') {
        return
      }

      return this.call(nsMethod, []).catch(() => {}).then(objects => {
        objectsByType[type] = objects
      })
    }).then(() => {
      // Pool handling is special and must be done first.
      /* eslint no-lone-blocks: 0 */
      {
        const pools = objectsByType.pool
        if (!pools) {
          throw new Error('no pool record found')
        }
        delete objectsByType.pool

        const ref = getFirstKey(pools)
        const pool = pools[ref]

        this._normalizeObject('pool', ref, pool)
        this._poolId = pool.$id

        this._objects.add(pool)
      }

      forEach(objectsByType, (objects, type) => {
        forEach(objects, (object, ref) => {
          this._normalizeObject(type, ref, object)

          this._objects.add(object)
        })
      })
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
            this._poolId = object.$id
          }
        }
      })
    }).catch(areEventsLost, () => {
      this._objects.clear()
    }).then(() => {
      this._watchEvents()
    })
  }
}

// ===================================================================

// The default value is a factory function.
export const createClient = (opts) => new Xapi(opts)
