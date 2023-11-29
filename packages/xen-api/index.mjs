import hrp from 'http-request-plus'
import retry from 'promise-toolbox/retry.js'
import transport from './dist/transports/json-rpc.js'

import isReadOnlyCall from './dist/_isReadOnlyCall.js'

export class Xapi {
  #readOnly
  #transport
  #url
  sessionId

  constructor({ auth: { user, password }, url, readOnly = true }) {
    this.#auth = { user, password }
    this.#readOnly = readOnly
    this.#url = parseUrl(url)
  }

  call(method, params, opts) {
    return isReadOnlyCall(method, params)
      ? this.#roCall(method, params, opts)
      : this.#readOnly
      ? Promise.reject(new Error('read-only calls are forbidden'))
      : this.#call(method, params, opts)
  }
}
