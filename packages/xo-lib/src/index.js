import startsWith from 'lodash.startswith'
import JsonRpcWebSocketClient, {
  OPEN,
  CLOSED
} from 'jsonrpc-websocket-client'
import { BaseError } from 'make-error'

// ===================================================================

const noop = () => {}

// ===================================================================

export class XoError extends BaseError {}

// -------------------------------------------------------------------

// TODO: implement call(...).retry(predicate)
export default class Xo extends JsonRpcWebSocketClient {
  constructor (opts) {
    super(`${opts && opts.url || '.' }/api/`)

    this._credentials = opts && opts.credentials || null
    this._user = null

    this.on(OPEN, () => {
      if (this._credentials) {
        this._signIn(this._credentials).catch(noop)
      }
    })
    this.on(CLOSED, () => {
      this._user = null
    })
  }

  get user () {
    return this._user
  }

  call (method, args) {
    return new Promise(resolve => {
      if (startsWith(method, 'session.')) {
        throw new XoError('session.*() methods are disabled from this interface')
      }

      resolve(super.call(method, args))
    })
  }

  signIn (credentials) {
    // Register this credentials for future use.
    this._credentials = credentials

    return this._signIn(credentials)
  }

  _signIn (credentials) {
    return super.call('session.signIn', credentials).then(user => {
      this._user = user
      this.emit('authenticated')
    })
  }
}
