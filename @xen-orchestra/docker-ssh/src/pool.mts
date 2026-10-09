// Pool of Docker connections, one per engine.
//
// - key = engine id + revision: bumping the revision (credential/host update)
//   makes the pool open a new connection instead of reusing the old one; the
//   revision is opaque, e.g. a hash of the connection parameters, so that a
//   connection can never serve other parameters than the ones it was opened
//   with
// - concurrent first uses of an engine share one SSH handshake
// - a connection whose SSH session ends (lost, or closed) is removed: the next
//   use opens a new one, through `createConnection` and the negative cache
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

import type { DockerConnection } from './connection.mjs'

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
  SSH_REFUSED_PENALTY,
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
  SSH_REFUSED_PENALTY,
  SSH_UNREACHABLE,
  STREAM_LOCAL_FORWARDING_DISABLED,
  STREAM_LOCAL_UNSUPPORTED,
])

const LOCAL_CODES = new Set([CONNECTION_CLOSED, POOL_EXHAUSTED])

const isEngineFailure = (error: unknown): error is DockerError =>
  isDockerError(error) && ENGINE_FAILURE_CODES.has(error.code)

// what is exposed of an error in `getState()`
const summarizeError = (error: unknown): { code: string; message: string } => ({
  code: isDockerError(error) ? error.code : 'UNKNOWN_ERROR',
  message: String((error as { message?: unknown } | null | undefined)?.message ?? error),
})

const makeKey = (id: string, revision: number | string | undefined) => `${id}:${revision ?? 0}`

/**
 * What the users of a pooled connection get, see `createFacade()`.
 */
export type DockerConnectionFacade = Pick<
  DockerConnection,
  'apiVersion' | 'engineVersion' | 'observedHostKey' | 'request' | 'requestStream' | 'exec'
>

/**
 * What the pool uses of a connection: a `DockerConnection`, or a stand-in in
 * tests.
 */
export type PoolableConnection = DockerConnectionFacade & Pick<DockerConnection, 'connect' | 'close' | 'onClose'>

/** State of an engine's connection, see `getState()` */
export type DockerConnectionState = {
  status: 'idle' | 'connected' | 'error'
  error?: { code: string; message: string }
}

type Entry = {
  closed: boolean
  closing?: Promise<void>
  connected: boolean
  connection: PoolableConnection | undefined
  facade: DockerConnectionFacade | undefined
  id: string
  key: string
  lastUsed: number
  ready: Promise<void>
  refs: number
}

// a failure is anything a connection attempt threw, a DockerError in practice
type Failure = { error: unknown; until: number }

/**
 * Facade given to the users of a pooled connection: neither `connect()` nor
 * `close()`, and new requests are refused once the pool has closed the
 * connection (eviction, invalidation, destroy).
 */
function createFacade(entry: Entry): DockerConnectionFacade {
  // set before the facade is created
  const { connection } = entry as Entry & { connection: PoolableConnection }
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
  #entries = new Map<string, Entry>()
  // key → { error, until }
  #failures = new Map<string, Failure>()
  #failureTtl: number
  #idleTimeout: number
  #maxConnections: number
  #now: () => number
  #onSweep: (() => void) | undefined
  #sweeper: NodeJS.Timeout | undefined
  #sweepInterval: number

  /**
   * @param opts.idleTimeout ms
   * @param opts.failureTtl ms
   * @param opts.sweepInterval ms
   * @param opts.onSweep called on each sweep, e.g. to clean caches
   * @param opts.now for tests
   */
  constructor({
    maxConnections = DEFAULT_MAX_CONNECTIONS,
    idleTimeout = DEFAULT_IDLE_TIMEOUT,
    failureTtl = DEFAULT_FAILURE_TTL,
    sweepInterval = DEFAULT_SWEEP_INTERVAL,
    onSweep,
    now = Date.now,
  }: {
    maxConnections?: number
    idleTimeout?: number
    failureTtl?: number
    sweepInterval?: number
    onSweep?: () => void
    now?: () => number
  } = {}) {
    this.#failureTtl = failureTtl
    this.#idleTimeout = idleTimeout
    this.#maxConnections = maxConnections
    this.#now = now
    this.#onSweep = onSweep
    this.#sweepInterval = sweepInterval
  }

  /** number of connections (established or being established) */
  get size(): number {
    return this.#entries.size
  }

  /**
   * Passive state of an engine's connection, never connects.
   */
  getState(id: string, revision?: number | string): DockerConnectionState {
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
   */
  clearFailure(id: string): void {
    this.#deleteFailures(id)
  }

  /**
   * Run `fn` with the connection of an engine, connecting if necessary.
   *
   * The connection is considered busy (never evicted) while `fn` runs.
   *
   * @param createConnection returns a new, not yet connected, connection
   */
  async use<T>(
    { id, revision }: { id: string; revision?: number | string },
    createConnection: () => Promise<PoolableConnection> | PoolableConnection,
    fn: (connection: DockerConnectionFacade) => Promise<T> | T
  ): Promise<T> {
    const entry = await this.#acquire(id, revision, createConnection)
    try {
      // `facade!`: set once the entry is ready
      return await fn(entry.facade!)
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

  async #acquire(
    id: string,
    revision: number | string | undefined,
    createConnection: () => Promise<PoolableConnection> | PoolableConnection
  ): Promise<Entry> {
    if (this.#destroyed) {
      throw new DockerError(CONNECTION_CLOSED, 'the Docker connection pool has been destroyed')
    }

    const key = makeKey(id, revision)

    const failure = this.#failures.get(key)
    if (failure !== undefined && failure.until > this.#now()) {
      // a DockerError in practice, anything else is reported as SSH_ERROR
      const error = failure.error as { code?: string; message: string; data?: object }
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

  #create(id: string, key: string, createConnection: () => Promise<PoolableConnection> | PoolableConnection): Entry {
    if (this.#entries.size >= this.#maxConnections) {
      this.#evictOne()
    }
    // the failures of the other revisions of an engine are stale: they would
    // otherwise stay in memory until the engine is invalidated
    this.#deleteFailures(id, key)

    const entry: Entry = {
      closed: false,
      connected: false,
      connection: undefined,
      facade: undefined,
      id,
      key,
      lastUsed: this.#now(),
      // replaced right below, `entry` must exist before the promise runs
      ready: undefined as unknown as Promise<void>,
      refs: 0,
    }
    entry.ready = (async () => {
      const connection = await createConnection()
      entry.connection = connection
      entry.facade = createFacade(entry)
      connection.onClose(() => {
        if (this.#entries.get(key) === entry) {
          debug('Docker connection closed, removed from the pool', { id })
        }
        this.#close(entry)
      })
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

  #setFailure(key: string, error: unknown): void {
    this.#failures.set(key, { error, until: this.#now() + this.#failureTtl })
  }

  // failures of all the revisions of an engine, except `keep`
  #deleteFailures(id: string, keep?: string): void {
    for (const key of this.#failures.keys()) {
      if (key !== keep && key.startsWith(id + ':')) {
        this.#failures.delete(key)
      }
    }
  }

  #evictOne(): void {
    let lru: Entry | undefined
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
   * @returns never rejects
   */
  #close(entry: Entry): Promise<void> {
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

  #startSweeper(): void {
    if (this.#sweeper === undefined && !this.#destroyed) {
      this.#sweeper = setInterval(() => this.sweep(), this.#sweepInterval)
      this.#sweeper.unref()
    }
  }

  #stopSweeper(): void {
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
  sweep(): void {
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
   */
  async invalidate(id: string): Promise<void> {
    this.clearFailure(id)
    const promises: Promise<void>[] = []
    for (const entry of Array.from(this.#entries.values())) {
      if (entry.id === id) {
        promises.push(this.#close(entry))
      }
    }
    await Promise.all(promises)
  }

  /**
   * Close every connection, the pool cannot be used afterwards.
   */
  async destroy(): Promise<void> {
    this.#destroyed = true
    this.#stopSweeper()
    this.#failures.clear()
    await Promise.all(Array.from(this.#entries.values(), entry => this.#close(entry)))
  }
}
