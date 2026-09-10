import { Client } from '@vates/node-vsphere-soap'
import { createLogger } from '@xen-orchestra/log'
import { pTimeout } from 'promise-toolbox'

const { warn } = createLogger('xo:vmware-explorer:soap')

const noop = () => {}

// a vim25 call either answers or fails fast: the long running work is always delegated to a Task,
// whose completion is polled separately
const DEFAULT_CALL_TIMEOUT = 60e3

/**
 * Promise interface over `@vates/node-vsphere-soap`.
 *
 * The library exposes one event emitter per call, and another one for the connection itself. Mixing
 * both is what made the previous implementation leak a listener per call and reject a call with the
 * error of another one, so this class keeps them strictly separate:
 * - the connection is a memoized promise
 * - every call listens on its own emitter, and removes its listeners in every outcome
 */
export class VimClient {
  #client
  #connected

  /**
   * @param {string} host
   * @param {string} user
   * @param {string} password
   * @param {boolean} sslVerify
   * @param {object} [options]
   * @param {(error: Error) => void} [options.onError] - called for the errors raised by the
   * underlying client once connected, e.g. a session that could not be renewed
   * @param {object} [options.client] - injectable `@vates/node-vsphere-soap` client, for tests
   */
  constructor(host, user, password, sslVerify, { onError, client } = {}) {
    this.#client = client ?? new Client(host, user, password, sslVerify)

    this.#client.on('error', error => {
      if (onError !== undefined) {
        onError(error)
      } else {
        warn('unhandled SOAP client error', { error })
      }
    })
  }

  get serviceContent() {
    return this.#client.serviceContent
  }

  /** cookies of the authenticated session, needed to talk to the host outside of the WSDL */
  get authCookie() {
    return this.#client.authCookie
  }

  get status() {
    return this.#client.status
  }

  /**
   * Resolves once logged in. Memoized: it is safe (and expected) to await it before every call.
   *
   * @returns {Promise<void>}
   */
  connect() {
    this.#connected ??= new Promise((resolve, reject) => {
      const client = this.#client

      // the client starts connecting in its constructor, the event may already be gone
      if (client.status === 'ready') {
        return resolve()
      }

      const onReady = () => {
        client.off('error', onError)
        resolve()
      }
      const onError = error => {
        client.off('ready', onReady)
        reject(error)
      }

      client.once('ready', onReady)
      client.once('error', onError)

      if (client.status === 'disconnected') {
        // the client connects on its own in its constructor only
        client.emit('connect')
      }
    }).catch(error => {
      // a failed connection must not be memoized, or every later call reports an error which may
      // not be true any more
      this.#connected = undefined
      throw error
    })

    return this.#connected
  }

  /**
   * Runs a vim25 method.
   *
   * @param {string} method - name of the method, as exposed by the WSDL
   * @param {object} [args] - arguments of the method, `_this` included
   * @param {object} [options]
   * @param {number} [options.timeout] - in ms
   * @returns {Promise<object>} the `result` of the call, e.g. `{ returnval }`
   */
  async call(method, args, { timeout = DEFAULT_CALL_TIMEOUT } = {}) {
    await this.connect()

    const promise = new Promise((resolve, reject) => {
      const emitter = this.#client.runCommand(method, args)

      const onResult = result => {
        emitter.off('error', onError)
        resolve(result)
      }
      const onError = error => {
        emitter.off('result', onResult)
        reject(error)
      }

      emitter.once('result', onResult)
      emitter.once('error', onError)
    })

    return pTimeout.call(promise, timeout)
  }

  /**
   * Closes the session on the server.
   *
   * A session is not released when the process ends, it lingers until it expires, and a host only
   * accepts a limited number of them.
   *
   * @returns {Promise<void>}
   */
  async close() {
    // a close racing the login used to return early and let the login complete afterwards, leaving
    // the session open until it expires. The outcome of the connection is not the business of this
    // method: it is already reported to whoever awaited `connect()`
    await this.#connected?.catch(noop)

    if (this.#client.status !== 'ready') {
      return
    }
    try {
      // `runCommand` handles the bookkeeping of a `Logout`: status and exit hook
      await this.call('Logout', { _this: this.#client.sessionManager })
    } catch (error) {
      // the session will expire on its own, there is nothing better to do
      warn('failed to log out', { error })
    }
  }
}
