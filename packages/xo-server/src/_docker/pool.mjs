// Pool of Docker connections, one per engine.
//
// - key = engine id + revision: bumping the revision (credential/host update)
//   makes the pool open a new connection instead of reusing the old one
// - concurrent first uses of an engine share one SSH handshake
// - idle connections are closed after `idleTimeout` by one shared, unref'd
//   sweeper
// - at most `maxConnections`: the least recently used idle connection is
//   evicted, and POOL_EXHAUSTED is thrown when all of them are busy
// - negative cache: after a connection failure, uses of the engine fail fast
//   for `failureTtl`, and the last error stays available (`getState()`) until a
//   connection succeeds or the engine is invalidated
//
// No XO concepts here: the caller provides the connection factory.

import { createLogger } from '@xen-orchestra/log'

import {
  CONNECTION_CLOSED,
  DOCKER_API_VERSION_UNSUPPORTED,
  DOCKER_SOCKET_UNREACHABLE,
  DockerError,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  isDockerError,
  POOL_EXHAUSTED,
  SSH_AUTH_FAILED,
  SSH_ERROR,
  SSH_UNREACHABLE,
  STREAM_LOCAL_FORWARDING_DISABLED,
  STREAM_LOCAL_UNSUPPORTED,
} from './errors.mjs'

const { debug, warn } = createLogger('xo:docker:pool')

export const DEFAULT_MAX_CONNECTIONS = 20
export const DEFAULT_IDLE_TIMEOUT = 5 * 60e3
export const DEFAULT_FAILURE_TTL = 30e3
export const DEFAULT_SWEEP_INTERVAL = 30e3

// errors raised while using an established connection which mean that the
// engine itself is unusable: they evict the connection and are negatively
// cached, like connection failures
//
// Not included: Docker API errors (4xx/5xx of one request), TIMEOUT (one slow
// request), POOL_EXHAUSTED and CONNECTION_CLOSED (local conditions)
const ENGINE_FAILURE_CODES = new Set([
  DOCKER_API_VERSION_UNSUPPORTED,
  DOCKER_SOCKET_UNREACHABLE,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  SSH_AUTH_FAILED,
  SSH_ERROR,
  SSH_UNREACHABLE,
  STREAM_LOCAL_FORWARDING_DISABLED,
  STREAM_LOCAL_UNSUPPORTED,
])

const LOCAL_CODES = new Set([CONNECTION_CLOSED, POOL_EXHAUSTED])

const isEngineFailure = error => isDockerError(error) && ENGINE_FAILURE_CODES.has(error.code)

// what is exposed of an error in `getState()`
const summarizeError = error => ({
  code: isDockerError(error) ? error.code : 'UNKNOWN_ERROR',
  message: String(error?.message ?? error),
})

const makeKey = (id, revision) => `${id}:${revision ?? 0}`

/**
 * Facade given to the users of a pooled connection: once the pool has closed
 * the connection (eviction, invalidation, destroy), it refuses new requests
 * instead of letting `DockerConnection` silently open a new SSH connection the
 * pool would not know about.
 */
function createFacade(entry) {
  const { connection } = entry
  const assertOpen = () => {
    if (entry.closed) {
      throw new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed')
    }
  }
  return {
    get apiVersion() {
      return connection.apiVersion
    },
    get engineVersion() {
      return connection.engineVersion
    },
    get observedHostKey() {
      return connection.observedHostKey
    },
    async request(opts) {
      assertOpen()
      return connection.request(opts)
    },
    async requestStream(opts) {
      assertOpen()
      return connection.requestStream(opts)
    },
    async exec(command, opts) {
      assertOpen()
      return connection.exec(command, opts)
    },
  }
}

export class DockerConnectionPool {
  #destroyed = false
  // key → entry
  #entries = new Map()
  // key → { error, until }
  #failures = new Map()
  #failureTtl
  #idleTimeout
  #maxConnections
  #now
  #onSweep
  #sweeper
  #sweepInterval

  /**
   * @param {object} [opts]
   * @param {number} [opts.maxConnections]
   * @param {number} [opts.idleTimeout] ms
   * @param {number} [opts.failureTtl] ms
   * @param {number} [opts.sweepInterval] ms
   * @param {() => void} [opts.onSweep] called on each sweep, e.g. to clean caches
   * @param {() => number} [opts.now] for tests
   */
  constructor({
    maxConnections = DEFAULT_MAX_CONNECTIONS,
    idleTimeout = DEFAULT_IDLE_TIMEOUT,
    failureTtl = DEFAULT_FAILURE_TTL,
    sweepInterval = DEFAULT_SWEEP_INTERVAL,
    onSweep,
    now = Date.now,
  } = {}) {
    this.#failureTtl = failureTtl
    this.#idleTimeout = idleTimeout
    this.#maxConnections = maxConnections
    this.#now = now
    this.#onSweep = onSweep
    this.#sweepInterval = sweepInterval
  }

  /** @returns {number} number of connections (established or being established) */
  get size() {
    return this.#entries.size
  }

  /**
   * Passive state of an engine's connection, never connects.
   *
   * @param {string} id
   * @param {number} [revision]
   * @returns {{ status: 'idle' | 'connected' | 'error', error?: { code: string, message: string } }}
   */
  getState(id, revision) {
    const key = makeKey(id, revision)
    const failure = this.#failures.get(key)
    if (failure !== undefined) {
      return { status: 'error', error: summarizeError(failure.error) }
    }
    const entry = this.#entries.get(key)
    return { status: entry?.connected ? 'connected' : 'idle' }
  }

  /**
   * Forget the last failure of an engine (e.g. after a successful manual test).
   *
   * @param {string} id
   */
  clearFailure(id) {
    for (const key of this.#failures.keys()) {
      if (key.startsWith(id + ':')) {
        this.#failures.delete(key)
      }
    }
  }

  /**
   * Run `fn` with the connection of an engine, connecting if necessary.
   *
   * The connection is considered busy (never evicted) while `fn` runs.
   *
   * @template T
   * @param {{ id: string, revision?: number }} engine
   * @param {() => Promise<import('./connection.mjs').DockerConnection> | import('./connection.mjs').DockerConnection} createConnection returns a new, not yet connected, connection
   * @param {(connection: ReturnType<typeof createFacade>) => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async use({ id, revision }, createConnection, fn) {
    const entry = await this.#acquire(id, revision, createConnection)
    try {
      return await fn(entry.facade)
    } catch (error) {
      if (isEngineFailure(error) && this.#entries.get(entry.key) === entry) {
        debug('engine failure while using a connection', { id, code: error.code })
        this.#setFailure(entry.key, error)
        this.#close(entry)
      }
      throw error
    } finally {
      --entry.refs
      entry.lastUsed = this.#now()
    }
  }

  async #acquire(id, revision, createConnection) {
    if (this.#destroyed) {
      throw new DockerError(CONNECTION_CLOSED, 'the Docker connection pool has been destroyed')
    }

    const key = makeKey(id, revision)

    const failure = this.#failures.get(key)
    if (failure !== undefined && failure.until > this.#now()) {
      const { error } = failure
      throw new DockerError(error.code ?? SSH_ERROR, error.message, {
        data: { ...error.data, failFast: true, retryAt: failure.until },
        cause: error,
      })
    }

    let entry = this.#entries.get(key)
    if (entry === undefined) {
      entry = this.#create(id, key, createConnection)
    }

    ++entry.refs
    entry.lastUsed = this.#now()
    try {
      await entry.ready
    } catch (error) {
      --entry.refs
      throw error
    }
    if (entry.closed) {
      --entry.refs
      throw new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed')
    }
    return entry
  }

  #create(id, key, createConnection) {
    if (this.#entries.size >= this.#maxConnections) {
      this.#evictOne()
    }

    const entry = {
      closed: false,
      connected: false,
      connection: undefined,
      facade: undefined,
      id,
      key,
      lastUsed: this.#now(),
      ready: undefined,
      refs: 0,
    }
    entry.ready = (async () => {
      const connection = await createConnection()
      entry.connection = connection
      entry.facade = createFacade(entry)
      if (entry.closed) {
        throw new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed')
      }
      await connection.connect()
    })().then(
      () => {
        entry.connected = true
        if (this.#entries.get(key) === entry) {
          this.#failures.delete(key)
        }
      },
      error => {
        if (this.#entries.get(key) === entry) {
          this.#entries.delete(key)
          if (!(isDockerError(error) && LOCAL_CODES.has(error.code))) {
            this.#setFailure(key, error)
          }
        }
        entry.closed = true
        entry.connection?.close().catch(error => warn('failed to close a Docker connection', { error }))
        throw error
      }
    )
    // unhandled rejections are prevented: waiters handle it
    entry.ready.catch(() => {})

    this.#entries.set(key, entry)
    this.#startSweeper()
    return entry
  }

  #setFailure(key, error) {
    this.#failures.set(key, { error, until: this.#now() + this.#failureTtl })
  }

  #evictOne() {
    let lru
    for (const entry of this.#entries.values()) {
      if (entry.refs === 0 && entry.connected && (lru === undefined || entry.lastUsed < lru.lastUsed)) {
        lru = entry
      }
    }
    if (lru === undefined) {
      throw new DockerError(POOL_EXHAUSTED, 'too many Docker connections in use', {
        data: { maxConnections: this.#maxConnections },
      })
    }
    debug('evicting the least recently used Docker connection', { id: lru.id })
    this.#close(lru)
  }

  /**
   * Remove an entry from the pool and close its connection.
   *
   * @returns {Promise<void>} never rejects
   */
  #close(entry) {
    if (this.#entries.get(entry.key) === entry) {
      this.#entries.delete(entry.key)
    }
    if (this.#entries.size === 0) {
      this.#stopSweeper()
    }
    if (entry.closed && entry.closing !== undefined) {
      return entry.closing
    }
    entry.closed = true
    entry.closing = entry.ready
      .catch(() => {})
      .then(() => entry.connection?.close())
      .catch(error => warn('failed to close a Docker connection', { id: entry.id, error }))
    return entry.closing
  }

  #startSweeper() {
    if (this.#sweeper === undefined && !this.#destroyed) {
      this.#sweeper = setInterval(() => this.sweep(), this.#sweepInterval)
      this.#sweeper.unref()
    }
  }

  #stopSweeper() {
    if (this.#sweeper !== undefined) {
      clearInterval(this.#sweeper)
      this.#sweeper = undefined
    }
  }

  /**
   * Close the connections idle for more than `idleTimeout`.
   *
   * Called periodically while the pool has connections, exposed for tests.
   */
  sweep() {
    const limit = this.#now() - this.#idleTimeout
    for (const entry of Array.from(this.#entries.values())) {
      if (entry.refs === 0 && entry.connected && entry.lastUsed <= limit) {
        debug('closing an idle Docker connection', { id: entry.id })
        this.#close(entry)
      }
    }
    try {
      this.#onSweep?.()
    } catch (error) {
      warn('onSweep', { error })
    }
  }

  /**
   * Close the connections of an engine (all revisions) and forget its last
   * failure.
   *
   * @param {string} id
   * @returns {Promise<void>}
   */
  async invalidate(id) {
    this.clearFailure(id)
    const promises = []
    for (const entry of Array.from(this.#entries.values())) {
      if (entry.id === id) {
        promises.push(this.#close(entry))
      }
    }
    await Promise.all(promises)
  }

  /**
   * Close every connection, the pool cannot be used afterwards.
   *
   * @returns {Promise<void>}
   */
  async destroy() {
    this.#destroyed = true
    this.#stopSweeper()
    this.#failures.clear()
    await Promise.all(Array.from(this.#entries.values(), entry => this.#close(entry)))
  }
}
