import { createHash } from 'node:crypto'
import { request as httpRequest } from 'node:http'
import { Readable } from 'node:stream'
import { Client } from 'ssh2'
import { createLogger } from '@xen-orchestra/log'

import {
  CONNECTION_CLOSED,
  DOCKER_API_ERROR,
  DOCKER_API_VERSION_UNSUPPORTED,
  DockerError,
  fromSshError,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  isDockerError,
  POOL_EXHAUSTED,
  TIMEOUT,
} from './errors.mjs'
import { SshHttpAgent } from './ssh-http-agent.mjs'

const { debug, warn } = createLogger('xo:docker:connection')

// newest Docker Engine API version this code has been written against
export const MAX_API_VERSION = '1.43'
// oldest Docker Engine API version supported
export const MIN_API_VERSION = '1.24'

const DEFAULT_CONNECT_TIMEOUT = 10e3
const DEFAULT_REQUEST_TIMEOUT = 30e3
const CLOSE_TIMEOUT = 5e3
const MAX_RESPONSE_SIZE = 64 * 1024 * 1024

// `http.Agent` does not count the sockets being created asynchronously (see
// `createSocket()` in Node's `lib/_http_agent.js`), therefore its `maxSockets`
// is not enforced for concurrent requests when `createConnection()` is async,
// which is always the case for SSH channels: the concurrency is limited here
// instead
const MAX_CONCURRENT_REQUESTS = 8
const MAX_QUEUED_REQUESTS = 1e3

// Long-lived streams (stats streams of the sampler, raw passthrough) would
// hold a request slot for minutes, and 8 of them would starve every other
// request of the engine: they have their own channels (a dedicated agent
// without keep-alive, so a channel is closed with its response) and their own
// limit, not queued (POOL_EXHAUSTED right away when reached).
//
// `direct-streamlocal` channels are not SSH sessions: OpenSSH's `MaxSessions`
// does not apply to them. The stats sampler is itself capped by
// `docker.maxStatsContainers` (default 100).
export const MAX_LONG_LIVED_STREAMS = 128

/**
 * Counting semaphore with a bounded, abortable, FIFO queue.
 */
class RequestLimiter {
  #active = 0
  #max
  #maxQueued
  #message
  #queue = []

  constructor(max, maxQueued, message = 'too many pending Docker API requests') {
    this.#max = max
    this.#maxQueued = maxQueued
    this.#message = message
  }

  /** @returns {number} number of granted slots */
  get active() {
    return this.#active
  }

  /**
   * @param {AbortSignal} signal
   * @returns {Promise<() => void>} resolves with an idempotent release function
   */
  acquire(signal) {
    if (this.#active < this.#max) {
      ++this.#active
      return Promise.resolve(this.#makeRelease())
    }
    if (this.#queue.length >= this.#maxQueued) {
      return Promise.reject(
        new DockerError(POOL_EXHAUSTED, this.#message, {
          data: { maxConcurrent: this.#max, maxQueued: this.#maxQueued },
        })
      )
    }
    if (signal.aborted) {
      return Promise.reject(signal.reason)
    }
    return new Promise((resolve, reject) => {
      const remove = () => {
        signal.removeEventListener('abort', onAbort)
        const index = this.#queue.indexOf(waiter)
        if (index !== -1) {
          this.#queue.splice(index, 1)
        }
      }
      const onAbort = () => {
        remove()
        reject(signal.reason)
      }
      const waiter = {
        grant: () => {
          signal.removeEventListener('abort', onAbort)
          resolve(this.#makeRelease())
        },
        reject: error => {
          remove()
          reject(error)
        },
      }
      signal.addEventListener('abort', onAbort, { once: true })
      this.#queue.push(waiter)
    })
  }

  /**
   * Reject every queued (not yet granted) acquisition.
   *
   * @param {Error} error
   */
  rejectQueued(error) {
    for (const waiter of this.#queue.slice()) {
      waiter.reject(error)
    }
  }

  #makeRelease() {
    let released = false
    return () => {
      if (released) {
        return
      }
      released = true
      const next = this.#queue.shift()
      if (next === undefined) {
        --this.#active
      } else {
        // the slot is directly transferred
        next.grant()
      }
    }
  }
}

/**
 * OpenSSH fingerprint of a host key, same format as `ssh-keygen -lf`:
 * `SHA256:` followed by the unpadded base64 of the SHA-256 of the key blob.
 *
 * @param {Buffer} keyBlob host key in SSH wire format (what ssh2's `hostVerifier` receives when `hostHash` is not set)
 * @returns {string}
 */
export function computeFingerprint(keyBlob) {
  return 'SHA256:' + createHash('sha256').update(keyBlob).digest('base64').replace(/=+$/, '')
}

/**
 * Algorithm of a host key blob: its first field (SSH string).
 *
 * @param {Buffer} keyBlob
 * @returns {string | undefined} e.g. `ssh-ed25519`
 */
export function getKeyAlgorithm(keyBlob) {
  if (keyBlob.length < 4) {
    return
  }
  const length = keyBlob.readUInt32BE(0)
  if (length > keyBlob.length - 4) {
    return
  }
  return keyBlob.toString('latin1', 4, 4 + length)
}

/**
 * Normalize a user-provided fingerprint: ensure the `SHA256:` prefix, drop
 * base64 padding and surrounding spaces.
 *
 * @param {string} fingerprint
 * @returns {string}
 */
export function normalizeFingerprint(fingerprint) {
  let normalized = fingerprint.trim().replace(/=+$/, '')
  if (!normalized.startsWith('SHA256:')) {
    normalized = 'SHA256:' + normalized
  }
  return normalized
}

/**
 * Check a host key against the expected fingerprint.
 *
 * @param {Buffer} keyBlob
 * @param {object} opts
 * @param {string} [opts.expectedFingerprint]
 * @param {boolean} [opts.acceptUnknownHostKey]
 * @returns {{ fingerprint: string, algorithm: string | undefined }} the observed key if accepted
 * @throws {DockerError} HOST_KEY_UNKNOWN or HOST_KEY_MISMATCH
 */
export function verifyHostKey(keyBlob, { expectedFingerprint, acceptUnknownHostKey = false }) {
  const observed = { fingerprint: computeFingerprint(keyBlob), algorithm: getKeyAlgorithm(keyBlob) }
  if (expectedFingerprint == null || expectedFingerprint === '') {
    if (acceptUnknownHostKey) {
      return observed
    }
    throw new DockerError(HOST_KEY_UNKNOWN, 'the SSH host key is unknown', { data: observed })
  }
  const expected = normalizeFingerprint(expectedFingerprint)
  if (expected !== observed.fingerprint) {
    throw new DockerError(HOST_KEY_MISMATCH, 'the SSH host key does not match the expected one', {
      data: { expected, actual: observed.fingerprint, algorithm: observed.algorithm },
    })
  }
  return observed
}

/**
 * Compare two `major.minor` API versions.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a < b, 0 if equal, positive if a > b
 */
export function compareApiVersions(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0, n = Math.max(pa.length, pb.length); i < n; ++i) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) {
      return diff
    }
  }
  return 0
}

/**
 * Choose the API version to use with a daemon, based on its `GET /version`.
 *
 * @param {{ ApiVersion?: string, MinAPIVersion?: string }} version
 * @returns {string}
 * @throws {DockerError} DOCKER_API_VERSION_UNSUPPORTED
 */
export function negotiateApiVersion({ ApiVersion, MinAPIVersion }) {
  if (typeof ApiVersion !== 'string' || !/^\d+\.\d+$/.test(ApiVersion)) {
    throw new DockerError(DOCKER_API_VERSION_UNSUPPORTED, 'the Docker daemon did not report a valid API version', {
      data: { apiVersion: ApiVersion },
    })
  }
  const data = {
    daemonApiVersion: ApiVersion,
    daemonMinApiVersion: MinAPIVersion,
    minApiVersion: MIN_API_VERSION,
    maxApiVersion: MAX_API_VERSION,
  }
  if (compareApiVersions(ApiVersion, MIN_API_VERSION) < 0) {
    throw new DockerError(DOCKER_API_VERSION_UNSUPPORTED, 'the Docker daemon is too old', { data })
  }
  if (typeof MinAPIVersion === 'string' && compareApiVersions(MAX_API_VERSION, MinAPIVersion) < 0) {
    throw new DockerError(DOCKER_API_VERSION_UNSUPPORTED, 'the Docker daemon is too recent', { data })
  }
  return compareApiVersions(ApiVersion, MAX_API_VERSION) < 0 ? ApiVersion : MAX_API_VERSION
}

// preferred `serverHostKey` algorithms for a given host key type
const hostKeyAlgorithmsFor = keyType =>
  keyType === 'ssh-rsa' ? ['rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'] : [keyType]

/**
 * Wait for `promise` unless `signal` aborts first (the promise itself is not
 * cancelled).
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {AbortSignal} signal
 * @returns {Promise<T>}
 */
function raceSignal(promise, signal) {
  if (signal.aborted) {
    return Promise.reject(signal.reason)
  }
  let onAbort
  return Promise.race([
    promise,
    new Promise((resolve, reject) => {
      onAbort = () => reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
    }),
  ]).finally(() => signal.removeEventListener('abort', onAbort))
}

const isJsonContentType = contentType => typeof contentType === 'string' && /[/+]json\b/i.test(contentType)

function buildQueryString(query) {
  if (query === undefined) {
    return ''
  }
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue
    }
    // Docker expects JSON for some parameters (e.g. `filters`)
    params.append(key, value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value))
  }
  const search = params.toString()
  return search === '' ? '' : '?' + search
}

/**
 * @param {import('node:http').IncomingMessage} response
 * @returns {Promise<Buffer>}
 */
async function readBody(response) {
  const chunks = []
  let size = 0
  for await (const chunk of response) {
    size += chunk.length
    if (size > MAX_RESPONSE_SIZE) {
      response.destroy()
      throw new DockerError(DOCKER_API_ERROR, 'Docker API response is too large', {
        data: { maxSize: MAX_RESPONSE_SIZE },
      })
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function parseBody(response, buffer) {
  if (buffer.length !== 0 && isJsonContentType(response.headers['content-type'])) {
    try {
      return JSON.parse(buffer.toString('utf8'))
    } catch (error) {
      throw new DockerError(DOCKER_API_ERROR, 'invalid JSON in Docker API response', {
        data: { statusCode: response.statusCode },
        cause: error,
      })
    }
  }
  return buffer
}

/**
 * Connection to a Docker daemon reached through SSH: one `ssh2.Client`, many
 * HTTP requests multiplexed on `direct-streamlocal@openssh.com` channels.
 */
export class DockerConnection {
  #acceptUnknownHostKey
  #agent
  #apiVersion
  #client
  #clientPromise
  #closeTimeout
  #closedClients = new WeakSet()
  #connectTimeout
  #createClient
  #engineVersion
  #generation = 0
  #hostKeyAlgorithm
  #limiter
  #pinnedHostKey
  #negotiation
  #observedHostKey
  #requestTimeout
  #socketPath
  #sshConfig
  #streamAgent
  #streamLimiter

  /**
   * @param {object} opts
   * @param {string} opts.host
   * @param {number} [opts.port]
   * @param {string} opts.username
   * @param {string} [opts.password]
   * @param {string | Buffer} [opts.privateKey]
   * @param {string} [opts.passphrase]
   * @param {string} [opts.socketPath] path of the Docker socket on the remote host
   * @param {string} [opts.hostKeyFingerprint] expected host key fingerprint (`SHA256:…`)
   * @param {string} [opts.hostKeyAlgorithm] type of the expected host key (e.g. `ssh-ed25519`, as in `observedHostKey.algorithm`), makes the server present this key
   * @param {boolean} [opts.acceptUnknownHostKey] accept any host key when `hostKeyFingerprint` is missing, the observed one is then available in `observedHostKey`
   * @param {number} [opts.connectTimeout] max duration of the SSH connection (TCP + handshake + auth) and of a channel opening (ms)
   * @param {number} [opts.requestTimeout] max duration of an HTTP request, including reading the response (ms)
   * @param {object} [internals] for tests only
   * @param {() => import('ssh2').Client} [internals.createClient]
   * @param {number} [internals.closeTimeout]
   */
  constructor(
    {
      host,
      port = 22,
      username,
      password,
      privateKey,
      passphrase,
      socketPath = '/var/run/docker.sock',
      hostKeyFingerprint,
      hostKeyAlgorithm,
      acceptUnknownHostKey = false,
      connectTimeout = DEFAULT_CONNECT_TIMEOUT,
      requestTimeout = DEFAULT_REQUEST_TIMEOUT,
    },
    { createClient = () => new Client(), closeTimeout = CLOSE_TIMEOUT } = {}
  ) {
    this.#acceptUnknownHostKey = acceptUnknownHostKey
    this.#closeTimeout = closeTimeout
    this.#hostKeyAlgorithm = hostKeyAlgorithm ?? undefined
    this.#connectTimeout = connectTimeout
    this.#createClient = createClient
    this.#requestTimeout = requestTimeout
    this.#socketPath = socketPath

    // kept private: must never be exposed, logged or attached to errors
    this.#sshConfig = {
      host,
      port,
      username,
      password,
      privateKey,
      passphrase,
      // `null` (e.g. from a DB) is the same as missing
      hostKeyFingerprint: hostKeyFingerprint ?? undefined,
    }

    this.#limiter = new RequestLimiter(MAX_CONCURRENT_REQUESTS, MAX_QUEUED_REQUESTS)
    this.#agent = new SshHttpAgent(
      {
        getClient: () => this.#getClient(),
        socketPath,
        connectTimeout,
      },
      { maxSockets: MAX_CONCURRENT_REQUESTS }
    )
    this.#streamLimiter = new RequestLimiter(MAX_LONG_LIVED_STREAMS, 0, 'too many long-lived Docker API streams')
    this.#streamAgent = new SshHttpAgent(
      {
        getClient: () => this.#getClient(),
        socketPath,
        connectTimeout,
      },
      { keepAlive: false, maxSockets: Infinity, maxFreeSockets: 0 }
    )
  }

  /** @returns {{ requests: number, streams: number }} slots in use, for tests and diagnostics */
  get activeRequests() {
    return { requests: this.#limiter.active, streams: this.#streamLimiter.active }
  }

  /** @returns {string | undefined} negotiated API version, e.g. `1.43` */
  get apiVersion() {
    return this.#apiVersion
  }

  /** @returns {string | undefined} version of the Docker Engine, e.g. `27.3.1` */
  get engineVersion() {
    return this.#engineVersion
  }

  /** @returns {{ fingerprint: string, algorithm: string | undefined } | undefined} host key seen during the last handshake */
  get observedHostKey() {
    return this.#observedHostKey
  }

  get #context() {
    const { host, port } = this.#sshConfig
    return { host, port, socketPath: this.#socketPath }
  }

  /**
   * Establish the SSH connection (if necessary) and negotiate the API version.
   *
   * @returns {Promise<void>}
   */
  async connect() {
    await this.#getClient()
    await this.#negotiate()
  }

  /**
   * @returns {Promise<import('ssh2').Client>} a ready client, shared by all requests
   */
  #getClient() {
    if (this.#clientPromise === undefined) {
      const promise = this.#openClient()
      this.#clientPromise = promise
      promise.catch(() => {
        // allow a new attempt
        if (this.#clientPromise === promise) {
          this.#clientPromise = undefined
        }
      })
    }
    return this.#clientPromise
  }

  #openClient() {
    const { host, port, username, password, privateKey, passphrase } = this.#sshConfig
    const context = this.#context

    // once a key has been accepted, it is pinned for the lifetime of this
    // instance: reconnections must present the same key, even when the first
    // one was accepted via `acceptUnknownHostKey`
    const pinned = this.#pinnedHostKey
    const expectedFingerprint = this.#sshConfig.hostKeyFingerprint ?? pinned?.fingerprint
    const expectedAlgorithm = this.#hostKeyAlgorithm ?? pinned?.algorithm

    return new Promise((resolve, reject) => {
      const client = this.#createClient()
      this.#client = client

      let hostKeyError
      let ready = false
      let settled = false
      const fail = error => {
        if (!settled) {
          settled = true
          reject(error)
        }
      }

      client.on('ready', () => {
        ready = true
        settled = true
        this.#pinnedHostKey ??= this.#observedHostKey
        debug('SSH connection ready', context)
        resolve(client)
      })
      client.on('error', error => {
        if (ready) {
          // e.g. keepalive timeout, the connection will be closed
          warn('SSH connection error', { ...context, error: fromSshError(error, context) })
          return
        }
        // the host verifier can only answer `false`: ssh2 then fails with a
        // generic handshake error, replace it with the precise one
        if (
          hostKeyError === undefined &&
          expectedAlgorithm !== undefined &&
          String(error?.message).includes('no matching host key format')
        ) {
          // the server no longer has a key of the expected type
          hostKeyError = new DockerError(HOST_KEY_MISMATCH, 'the SSH server does not have the expected host key type', {
            data: { ...context, expected: expectedFingerprint, expectedAlgorithm },
            cause: error,
          })
        }
        fail(hostKeyError ?? fromSshError(error, context))
      })
      client.on('close', () => {
        this.#closedClients.add(client)
        debug('SSH connection closed', context)
        if (this.#client === client) {
          this.#client = undefined
          this.#clientPromise = undefined
        }
        fail(hostKeyError ?? fromSshError(new Error('SSH connection closed before being ready'), context))
      })

      try {
        client.connect({
          host,
          port,
          username,
          password,
          privateKey,
          passphrase,
          readyTimeout: this.#connectTimeout,
          keepaliveInterval: 10e3,
          keepaliveCountMax: 3,
          algorithms:
            expectedAlgorithm === undefined ? undefined : { serverHostKey: hostKeyAlgorithmsFor(expectedAlgorithm) },
          // `hostHash` must not be set: the verifier receives the raw key blob
          hostVerifier: keyBlob => {
            try {
              this.#observedHostKey = verifyHostKey(keyBlob, {
                expectedFingerprint,
                acceptUnknownHostKey: this.#acceptUnknownHostKey,
              })
              return true
            } catch (error) {
              if (!isDockerError(error)) {
                throw error
              }
              hostKeyError = error
              // still exposed so that the user can be asked to confirm it
              const { actual, fingerprint = actual, algorithm } = error.data
              this.#observedHostKey = { fingerprint, algorithm }
              return false
            }
          },
        })
      } catch (error) {
        // thrown synchronously on invalid config (e.g. unparsable private key),
        // the client will never emit `close`
        this.#closedClients.add(client)
        if (this.#client === client) {
          this.#client = undefined
        }
        fail(fromSshError(error, context))
      }
    })
  }

  #negotiate() {
    if (this.#apiVersion !== undefined) {
      return Promise.resolve(this.#apiVersion)
    }
    if (this.#negotiation === undefined) {
      const negotiation = (async () => {
        const { body } = await this.#request({ method: 'GET', path: '/version', versioned: false })
        const apiVersion = negotiateApiVersion(body)
        this.#apiVersion = apiVersion
        this.#engineVersion = body.Version
        debug('Docker API version negotiated', { ...this.#context, apiVersion, engineVersion: body.Version })
        return apiVersion
      })()
      this.#negotiation = negotiation
      negotiation.then(
        () => {
          this.#negotiation = undefined
        },
        () => {
          // allow a new attempt
          this.#negotiation = undefined
        }
      )
    }
    return this.#negotiation
  }

  /**
   * Send a request and wait for the response headers.
   *
   * @param {object} opts
   * @param {AbortSignal} signal
   * @returns {Promise<import('node:http').IncomingMessage>}
   */
  async #send(
    { method = 'GET', path, query, body, headers = {}, versioned = true, longLived = false },
    signal,
    generation
  ) {
    if (versioned) {
      // the negotiation is shared between requests: do not cancel it
      await raceSignal(this.#negotiate(), signal)
    }
    signal.throwIfAborted()
    this.#assertNotClosedSince(generation)

    let payload
    headers = { ...headers }
    if (body !== undefined && !(body instanceof Readable) && !Buffer.isBuffer(body) && typeof body !== 'string') {
      payload = JSON.stringify(body)
      headers['content-type'] ??= 'application/json'
    } else {
      payload = body
    }
    if (typeof payload === 'string' || Buffer.isBuffer(payload)) {
      headers['content-length'] = Buffer.byteLength(payload)
    }

    const fullPath = (versioned ? `/v${this.#apiVersion}` : '') + path + buildQueryString(query)

    // acquired after the negotiation which needs a slot itself
    const releaseSlot = await (longLived ? this.#streamLimiter : this.#limiter).acquire(signal)
    let onAbort
    const release = () => {
      signal.removeEventListener('abort', onAbort)
      releaseSlot()
    }
    try {
      this.#assertNotClosedSince(generation)
    } catch (error) {
      release()
      throw error
    }

    return new Promise((resolve, reject) => {
      // Do not rely only on the request/response emitting `close` or `error`:
      // when the SSH connection is lost, a channel may never emit anything
      // after being destroyed (ssh2's Channel#destroy() does not emit them).
      onAbort = () => {
        release()
        req.destroy(signal.reason)
        reject(signal.reason)
      }
      signal.addEventListener('abort', onAbort, { once: true })

      const req = httpRequest({
        agent: longLived ? this.#streamAgent : this.#agent,
        host: 'docker',
        port: 80,
        method,
        path: fullPath,
        headers,
        signal,
      })
      req.on('response', response => {
        response.once('close', release)
        resolve(response)
      })
      req.on('error', error => {
        release()
        reject(error)
      })
      req.once('close', release)
      if (payload instanceof Readable) {
        payload.on('error', error => req.destroy(error))
        payload.pipe(req)
      } else {
        req.end(payload)
      }
    })
  }

  #assertNotClosedSince(generation) {
    if (generation !== this.#generation) {
      throw new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed', { data: this.#context })
    }
  }

  #wrapError(error, path, signal, generation) {
    if (isDockerError(error)) {
      return error
    }
    if (generation !== this.#generation) {
      return new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed', {
        data: { ...this.#context, path },
        cause: error,
      })
    }
    // once the signal is aborted, the error can also be a generic socket
    // error (e.g. `ECONNRESET: aborted` while reading the body)
    if (signal.aborted || error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      // AbortError from http.request has the signal reason as cause
      return new DockerError(TIMEOUT, 'Docker API request timed out or was aborted', {
        data: { ...this.#context, path, timeout: this.#requestTimeout },
        cause: error.name === 'AbortError' || signal.reason === undefined ? error : signal.reason,
      })
    }
    return fromSshError(error, this.#context)
  }

  async #throwApiError(response, path, signal) {
    let message
    try {
      const body = parseBody(response, await raceSignal(readBody(response), signal))
      message = Buffer.isBuffer(body) ? body.toString('utf8').trim() : body?.message
    } catch (error) {
      // reported as TIMEOUT by #wrapError()
      if (signal.aborted) {
        throw error
      }
    }
    throw new DockerError(DOCKER_API_ERROR, message || `Docker API error ${response.statusCode}`, {
      data: { ...this.#context, path, statusCode: response.statusCode, message },
    })
  }

  async #request(opts) {
    const generation = this.#generation
    const signal = AbortSignal.any(
      [AbortSignal.timeout(this.#requestTimeout), opts.signal].filter(signal => signal !== undefined)
    )
    try {
      const response = await this.#send(opts, signal, generation)
      const { statusCode, headers } = response
      if (statusCode < 200 || statusCode >= 300) {
        await this.#throwApiError(response, opts.path, signal)
      }
      const body = parseBody(response, await raceSignal(readBody(response), signal))
      return { statusCode, headers, body }
    } catch (error) {
      throw this.#wrapError(error, opts.path, signal, generation)
    }
  }

  /**
   * Call the Docker Engine API.
   *
   * The path must not contain the version prefix, it is added automatically.
   *
   * @param {object} opts
   * @param {string} [opts.method]
   * @param {string} opts.path e.g. `/containers/json`
   * @param {Record<string, unknown>} [opts.query]
   * @param {unknown} [opts.body] objects are sent as JSON
   * @param {Record<string, string>} [opts.headers]
   * @param {AbortSignal} [opts.signal]
   * @returns {Promise<{ statusCode: number, headers: import('node:http').IncomingHttpHeaders, body: unknown }>} body is parsed when JSON, a Buffer otherwise
   * @throws {DockerError}
   */
  request({ method, path, query, body, headers, signal }) {
    return this.#request({ method, path, query, body, headers, signal })
  }

  /**
   * Same as `request()` but returns the response as a stream (logs, events,
   * exports…).
   *
   * `requestTimeout` only applies until the response headers are received,
   * afterwards only `signal` can interrupt the stream: the caller is
   * responsible for consuming or destroying it.
   *
   * @param {object} opts see `request()`, plus:
   * @param {boolean} [opts.longLived] the response may stay open for long (e.g. `stats?stream=true`): sent on a
   *   dedicated channel, outside of the limit of concurrent requests (see `MAX_LONG_LIVED_STREAMS`)
   * @param {boolean} [opts.raw] raw passthrough: `path` is sent verbatim (it may contain a query string, and is
   *   prefixed with the negotiated version unless it starts with `/v<version>/`), and error responses (non 2xx) are
   *   returned instead of thrown
   * @returns {Promise<import('node:http').IncomingMessage>}
   * @throws {DockerError}
   */
  async requestStream({ method, path, query, body, headers, signal: callerSignal, longLived = false, raw = false }) {
    // AbortSignal.timeout() cannot be cancelled, use a timer instead
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort(new DOMException('Docker API request timed out', 'TimeoutError'))
    }, this.#requestTimeout)
    const signal = AbortSignal.any([controller.signal, callerSignal].filter(signal => signal !== undefined))
    const generation = this.#generation
    try {
      const response = await this.#send(
        raw
          ? { method, path, body, headers, longLived, versioned: !/^\/v\d+(?:\.\d+)?\//.test(path) }
          : { method, path, query, body, headers, longLived },
        signal,
        generation
      )
      if (!raw && (response.statusCode < 200 || response.statusCode >= 300)) {
        await this.#throwApiError(response, path, signal)
      }
      clearTimeout(timer)
      return response
    } catch (error) {
      throw this.#wrapError(error, path, signal, generation)
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Run a command on the SSH host through a session channel (not through the
   * Docker socket).
   *
   * Only meant for diagnostics (e.g. probing the Docker socket when it cannot
   * be opened), the output is truncated at `maxOutputSize` bytes per stream.
   *
   * @param {string} command
   * @param {object} [opts]
   * @param {AbortSignal} [opts.signal]
   * @param {number} [opts.maxOutputSize]
   * @returns {Promise<{ code: number | null, signal: string | undefined, stdout: string, stderr: string }>}
   * @throws {DockerError}
   */
  async exec(command, { signal: callerSignal, maxOutputSize = 64 * 1024 } = {}) {
    const signal = AbortSignal.any(
      [AbortSignal.timeout(this.#requestTimeout), callerSignal].filter(signal => signal !== undefined)
    )
    const generation = this.#generation
    try {
      const client = await raceSignal(this.#getClient(), signal)
      this.#assertNotClosedSince(generation)
      return await new Promise((resolve, reject) => {
        client.exec(command, (error, channel) => {
          if (error) {
            reject(error)
            return
          }
          const onAbort = () => {
            channel.destroy()
            reject(signal.reason)
          }
          signal.addEventListener('abort', onAbort, { once: true })

          const collect = chunks => {
            let size = 0
            return chunk => {
              if (size < maxOutputSize) {
                chunks.push(chunk.subarray(0, maxOutputSize - size))
              }
              size += chunk.length
            }
          }
          const stdout = []
          const stderr = []
          channel.on('data', collect(stdout))
          channel.stderr.on('data', collect(stderr))

          let exitCode = null
          let exitSignal
          channel.on('exit', (code, signalName) => {
            exitCode = code ?? null
            exitSignal = signalName ?? undefined
          })
          channel.on('close', () => {
            signal.removeEventListener('abort', onAbort)
            resolve({
              code: exitCode,
              signal: exitSignal,
              stdout: Buffer.concat(stdout).toString('utf8'),
              stderr: Buffer.concat(stderr).toString('utf8'),
            })
          })
        })
      })
    } catch (error) {
      throw this.#wrapError(error, undefined, signal, generation)
    }
  }

  /**
   * Close the SSH connection (and every channel on it).
   *
   * Pending and queued requests fail with CONNECTION_CLOSED. The instance can
   * still be used afterwards: a new request opens a new connection.
   *
   * @returns {Promise<void>}
   */
  async close() {
    ++this.#generation
    this.#limiter.rejectQueued(
      new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed', { data: this.#context })
    )
    this.#agent.destroy()
    this.#streamAgent.destroy()
    const clientPromise = this.#clientPromise
    this.#clientPromise = undefined
    const client = this.#client
    this.#client = undefined
    if (clientPromise !== undefined) {
      // wait for a pending connection to settle
      await clientPromise.catch(() => {})
    }
    if (client === undefined || this.#closedClients.has(client)) {
      return
    }
    await new Promise(resolve => {
      const timer = setTimeout(() => {
        warn('SSH connection did not close in time, destroying it', this.#context)
        // Client#destroy() is a no-op once the socket is no longer writable,
        // which is the case after Client#end(): destroy the socket itself
        client._sock?.destroy()
        client.destroy?.()
        resolve()
      }, this.#closeTimeout)
      client.once('close', () => {
        clearTimeout(timer)
        resolve()
      })
      client.end()
    })
  }
}
