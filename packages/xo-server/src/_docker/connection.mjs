import { createHash } from 'node:crypto'
import { request as httpRequest } from 'node:http'
import { Readable } from 'node:stream'
import { Client } from 'ssh2'
import { createLogger } from '@xen-orchestra/log'

import {
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

/**
 * Counting semaphore with a bounded, abortable, FIFO queue.
 */
class RequestLimiter {
  #active = 0
  #max
  #maxQueued
  #queue = []

  constructor(max, maxQueued) {
    this.#max = max
    this.#maxQueued = maxQueued
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
        new DockerError(POOL_EXHAUSTED, 'too many pending Docker API requests', {
          data: { maxConcurrent: this.#max, maxQueued: this.#maxQueued },
        })
      )
    }
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        const index = this.#queue.indexOf(waiter)
        if (index !== -1) {
          this.#queue.splice(index, 1)
        }
        reject(signal.reason)
      }
      const waiter = () => {
        signal.removeEventListener('abort', onAbort)
        resolve(this.#makeRelease())
      }
      signal.addEventListener('abort', onAbort, { once: true })
      this.#queue.push(waiter)
    })
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
        next()
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
  if (expectedFingerprint === undefined || expectedFingerprint === '') {
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
  #closedClients = new WeakSet()
  #connectTimeout
  #createClient
  #engineVersion
  #limiter
  #negotiation
  #observedHostKey
  #requestTimeout
  #socketPath
  #sshConfig

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
   * @param {boolean} [opts.acceptUnknownHostKey] accept any host key when `hostKeyFingerprint` is missing, the observed one is then available in `observedHostKey`
   * @param {number} [opts.connectTimeout] max duration of the SSH connection (TCP + handshake + auth) and of a channel opening (ms)
   * @param {number} [opts.requestTimeout] max duration of an HTTP request, including reading the response (ms)
   * @param {object} [internals] for tests only
   * @param {() => import('ssh2').Client} [internals.createClient]
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
      acceptUnknownHostKey = false,
      connectTimeout = DEFAULT_CONNECT_TIMEOUT,
      requestTimeout = DEFAULT_REQUEST_TIMEOUT,
    },
    { createClient = () => new Client() } = {}
  ) {
    this.#acceptUnknownHostKey = acceptUnknownHostKey
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
      hostKeyFingerprint,
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
    const { host, port, username, password, privateKey, passphrase, hostKeyFingerprint } = this.#sshConfig
    const context = this.#context

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
          // `hostHash` must not be set: the verifier receives the raw key blob
          hostVerifier: keyBlob => {
            try {
              this.#observedHostKey = verifyHostKey(keyBlob, {
                expectedFingerprint: hostKeyFingerprint,
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
  async #send({ method = 'GET', path, query, body, headers = {}, versioned = true }, signal) {
    if (versioned) {
      await this.#negotiate()
    }
    signal.throwIfAborted()

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
    const release = await this.#limiter.acquire(signal)

    return new Promise((resolve, reject) => {
      const req = httpRequest({
        agent: this.#agent,
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

  #wrapError(error, path, signal) {
    if (isDockerError(error)) {
      return error
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

  async #throwApiError(response, path) {
    let message
    try {
      const body = parseBody(response, await readBody(response))
      message = Buffer.isBuffer(body) ? body.toString('utf8').trim() : body?.message
    } catch (error) {
      if (isDockerError(error) && error.code === TIMEOUT) {
        throw error
      }
    }
    throw new DockerError(DOCKER_API_ERROR, message || `Docker API error ${response.statusCode}`, {
      data: { ...this.#context, path, statusCode: response.statusCode, message },
    })
  }

  async #request(opts) {
    const signal = AbortSignal.any(
      [AbortSignal.timeout(this.#requestTimeout), opts.signal].filter(signal => signal !== undefined)
    )
    try {
      const response = await this.#send(opts, signal)
      const { statusCode, headers } = response
      if (statusCode < 200 || statusCode >= 300) {
        await this.#throwApiError(response, opts.path)
      }
      const body = parseBody(response, await readBody(response))
      return { statusCode, headers, body }
    } catch (error) {
      throw this.#wrapError(error, opts.path, signal)
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
   * @param {object} opts see `request()`
   * @returns {Promise<import('node:http').IncomingMessage>}
   * @throws {DockerError}
   */
  async requestStream({ method, path, query, body, headers, signal: callerSignal }) {
    // AbortSignal.timeout() cannot be cancelled, use a timer instead
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort(new DOMException('Docker API request timed out', 'TimeoutError'))
    }, this.#requestTimeout)
    const signal = AbortSignal.any([controller.signal, callerSignal].filter(signal => signal !== undefined))
    try {
      const response = await this.#send({ method, path, query, body, headers }, signal)
      if (response.statusCode < 200 || response.statusCode >= 300) {
        await this.#throwApiError(response, path)
      }
      clearTimeout(timer)
      return response
    } catch (error) {
      throw this.#wrapError(error, path, signal)
    } finally {
      clearTimeout(timer)
    }
  }

  /**
   * Close the SSH connection (and every channel on it).
   *
   * @returns {Promise<void>}
   */
  async close() {
    this.#agent.destroy()
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
        client.destroy?.()
        resolve()
      }, CLOSE_TIMEOUT)
      client.once('close', () => {
        clearTimeout(timer)
        resolve()
      })
      client.end()
    })
  }
}
