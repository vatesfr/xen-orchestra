import Bluebird, {promisify} from 'bluebird'
import createDebug from 'debug'
import makeError from 'make-error'
import {
  createClient as createXmlRpcClient,
  createSecureClient as createSecureXmlRpcClient
} from 'xmlrpc'
import {EventEmitter} from 'events'

const debug = createDebug('xo:xapi')

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

class XapiError {
  constructor (error) {
    XapiError.super.call(this, error[0])

    this.code = error[0]
    this.params = error.slice(1)
  }
}
makeError(XapiError)

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

// ===================================================================

export class Xapi extends EventEmitter {
  constructor (opts) {
    super()

    this._url = parseUrl(opts.url)
    this._auth = opts.auth

    this._sessionId = null

    this._init()

    this._fromToken = ''
    this._watchEvents()
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

  _watchEvents () {
    this.call('event.from', [
      ['*'], this._fromToken, 1e3 + 0.1
    ]).then(({token, events}) => {
      this._fromToken = token

      if (events.length) {
        this.emit('events', events)
      }
    }).catch(areEventsLost, () => {
      this.emit('eventsLost')
    }).then(() => {
      this._watchEvents()
    })
  }
}

// ===================================================================

// The default value is a factory function.
export const createClient = (opts) => new Xapi(opts)
