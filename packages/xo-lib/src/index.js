import trimEnd from 'lodash/trimEnd'
import { BaseError } from 'make-error'
import { JsonRpcWebSocketClient, OPEN, CLOSED } from 'jsonrpc-websocket-client'

// ===================================================================

const noop = () => {}

// ===================================================================

export class XoError extends BaseError {}

// -------------------------------------------------------------------

export default class Xo extends JsonRpcWebSocketClient {
  constructor({ credentials, url = '.', ...opts } = {}) {
    opts.url = `${trimEnd(url, '/')}/api/`
    super(opts)

    this._credentials = credentials
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

  get user() {
    return this._user
  }

  call(method, args, i) {
    if (method.startsWith('session.')) {
      return Promise.reject(new XoError('session.*() methods are disabled from this interface'))
    }

    const promise = super.call(method, args)
    promise.retry = predicate =>
      promise.catch(error => {
        i = (i || 0) + 1
        if (predicate(error, i)) {
          return this.call(method, args, i)
        }
      })

    return promise
  }

  refreshUser() {
    return super.call('session.getUser').then(user => {
      return (this._user = user)
    })
  }

  signIn(credentials) {
    // Register this credentials for future use.
    this._credentials = credentials

    return this._signIn(credentials)
  }

  _signIn(credentials) {
    return super.call('session.signIn', credentials).then(
      user => {
        this._user = user
        this.emit('authenticated')
      },
      error => {
        this.emit('authenticationFailure', error)
        throw error
      }
    )
  }
}
