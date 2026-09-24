import { Agent } from 'node:http'
import { createLogger } from '@xen-orchestra/log'

import { DockerError, fromSshError, SSH_UNREACHABLE, TIMEOUT } from './errors.mjs'

const { debug } = createLogger('xo:docker:ssh-http-agent')

const DEFAULT_CONNECT_TIMEOUT = 10e3

function noop() {}

/**
 * Make an ssh2 channel usable as an HTTP socket.
 *
 * Port of `decorateStream()` from `ssh2/lib/http-agents.js` (HTTP case): the
 * HTTP client and the agent call these `net.Socket` methods which do not
 * exist on a channel.
 *
 * Note: `setTimeout` is a no-op, therefore the `timeout` option of the agent
 * and `req.setTimeout()` have no effect on these sockets, timeouts must be
 * handled with an `AbortSignal`.
 *
 * @param {import('node:stream').Duplex} stream
 */
export function decorateStream(stream) {
  stream.setKeepAlive = noop
  stream.setNoDelay = noop
  stream.setTimeout = noop
  stream.ref = noop
  stream.unref = noop

  // Addition to ssh2's version: once the SSH connection is lost,
  // Channel#destroy() emits neither `close` nor `error`, the agent would then
  // keep counting the channel as an active socket forever (and eventually
  // hit `maxSockets`). Make sure the agent forgets a destroyed channel.
  let closed = false
  let removed = false
  stream.once('close', () => {
    closed = true
  })
  const { destroy } = stream
  stream.destroy = function () {
    const result = destroy.apply(this, arguments)
    if (!removed) {
      removed = true
      // deferred: the agent may be iterating over its sockets (Agent#destroy())
      process.nextTick(() => {
        if (!closed) {
          // handled by `installListeners()` in Node's lib/_http_agent.js
          this.emit('agentRemove')
        }
      })
    }
    return result
  }

  stream.destroySoon = stream.destroy
  return stream
}

/**
 * HTTP agent sending requests to a Unix socket on a remote host through an
 * already established SSH connection (`direct-streamlocal@openssh.com`
 * channels).
 *
 * Unlike ssh2's own `HTTPAgent` which opens one SSH connection per socket,
 * all channels are multiplexed on a single, shared, `ssh2.Client`.
 *
 * The `host` and `port` of the requests are ignored.
 */
export class SshHttpAgent extends Agent {
  #connectTimeout
  #getClient
  #socketPath

  /**
   * @param {object} opts
   * @param {() => Promise<import('ssh2').Client>} opts.getClient returns a connected (ready) client, must enforce its own timeout
   * @param {string} opts.socketPath path of the Unix socket on the remote host
   * @param {number} [opts.connectTimeout] max duration to open a channel once the client is ready (ms)
   * @param {import('node:http').AgentOptions} [agentOptions]
   */
  constructor({ getClient, socketPath, connectTimeout = DEFAULT_CONNECT_TIMEOUT }, agentOptions) {
    super({
      keepAlive: true,
      keepAliveMsecs: 10e3,
      maxSockets: 8,
      maxFreeSockets: 2,
      ...agentOptions,
    })

    this.#connectTimeout = connectTimeout
    this.#getClient = getClient
    this.#socketPath = socketPath
  }

  /**
   * `http.Agent#removeSocket()` only removes a socket from the free list when
   * it is no longer writable, but an ssh2 channel closed because the SSH
   * connection has been lost stays writable: it would be reused and requests
   * sent on it would never complete. Always remove it from the free list.
   */
  removeSocket(socket, options) {
    const name = this.getName(options)
    const freeSockets = this.freeSockets[name]
    if (freeSockets !== undefined) {
      const index = freeSockets.indexOf(socket)
      if (index !== -1) {
        freeSockets.splice(index, 1)
        if (freeSockets.length === 0) {
          delete this.freeSockets[name]
        }
      }
    }
    return super.removeSocket(socket, options)
  }

  /**
   * Called by `http.Agent` when a new socket is needed.
   *
   * Async form: returns nothing and calls `cb` once.
   *
   * @param {object} _options ignored (host/port are meaningless here)
   * @param {(error: Error | null, socket?: import('node:stream').Duplex) => void} cb
   */
  createConnection(_options, cb) {
    const socketPath = this.#socketPath
    let settled = false
    const settle = (error, stream) => {
      if (settled) {
        // too late: the caller already received an error, release the channel
        stream?.destroy()
        return
      }
      settled = true
      clearTimeout(timer)
      if (error == null) {
        cb(null, decorateStream(stream))
      } else {
        cb(fromSshError(error, { socketPath }))
      }
    }

    let timer

    this.#getClient().then(
      client => {
        if (settled) {
          return
        }
        // started only once the client is ready so that a slow SSH connection
        // is reported with its own error (see `getClient`)
        timer = setTimeout(() => {
          settle(
            new DockerError(TIMEOUT, 'timed out while opening an SSH channel to the Docker socket', {
              data: { socketPath, timeout: this.#connectTimeout },
            })
          )
        }, this.#connectTimeout)
        try {
          client.openssh_forwardOutStreamLocal(socketPath, (error, stream) => {
            if (error == null) {
              debug('channel opened', { socketPath })
            }
            settle(error, stream)
          })
        } catch (error) {
          // thrown synchronously when the client is not connected (anymore)
          settle(
            new DockerError(SSH_UNREACHABLE, 'the SSH connection is closed', { data: { socketPath }, cause: error })
          )
        }
      },
      error => settle(error)
    )
  }
}
