import { createHash } from 'node:crypto'
import { request as httpRequest, type IncomingHttpHeaders, type IncomingMessage } from 'node:http'
import { type Duplex, Readable } from 'node:stream'
import {
  Client,
  type ClientCallback,
  type ClientErrorExtensions,
  type ConnectConfig,
  type ServerHostKeyAlgorithm,
} from 'ssh2'
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
import type { DockerVersion } from './wire.mjs'

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
type Waiter = { grant: () => void; reject: (error: unknown) => void }

class RequestLimiter {
  #active = 0
  #max: number
  #maxQueued: number
  #message: string
  #queue: Waiter[] = []

  constructor(max: number, maxQueued: number, message = 'too many pending Docker API requests') {
    this.#max = max
    this.#maxQueued = maxQueued
    this.#message = message
  }

  /** number of granted slots */
  get active(): number {
    return this.#active
  }

  /**
   * @returns resolves with an idempotent release function
   */
  acquire(signal: AbortSignal): Promise<() => void> {
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
    return new Promise<() => void>((resolve, reject) => {
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
      const waiter: Waiter = {
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
   */
  rejectQueued(error: Error): void {
    for (const waiter of this.#queue.slice()) {
      waiter.reject(error)
    }
  }

  #makeRelease(): () => void {
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
 * @param keyBlob host key in SSH wire format (what ssh2's `hostVerifier` receives when `hostHash` is not set)
 */
export function computeFingerprint(keyBlob: Buffer): string {
  return 'SHA256:' + createHash('sha256').update(keyBlob).digest('base64').replace(/=+$/, '')
}

/**
 * Algorithm of a host key blob: its first field (SSH string).
 *
 * @returns e.g. `ssh-ed25519`
 */
export function getKeyAlgorithm(keyBlob: Buffer): string | undefined {
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
 */
export function normalizeFingerprint(fingerprint: string): string {
  let normalized = fingerprint.trim().replace(/=+$/, '')
  if (!normalized.startsWith('SHA256:')) {
    normalized = 'SHA256:' + normalized
  }
  return normalized
}

/** An SSH host key, as seen during a handshake */
export type HostKey = { fingerprint: string; algorithm: string | undefined }

/**
 * Check a host key against the expected fingerprint.
 *
 * @returns the observed key if accepted
 * @throws {DockerError} HOST_KEY_UNKNOWN or HOST_KEY_MISMATCH
 */
export function verifyHostKey(
  keyBlob: Buffer,
  {
    expectedFingerprint,
    acceptUnknownHostKey = false,
  }: { expectedFingerprint?: string | null; acceptUnknownHostKey?: boolean }
): HostKey {
  const observed: HostKey = { fingerprint: computeFingerprint(keyBlob), algorithm: getKeyAlgorithm(keyBlob) }
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
 * @returns negative if a < b, 0 if equal, positive if a > b
 */
export function compareApiVersions(a: string, b: string): number {
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
 * The values are checked: they come from the daemon.
 *
 * @throws {DockerError} DOCKER_API_VERSION_UNSUPPORTED
 */
export function negotiateApiVersion({
  ApiVersion,
  MinAPIVersion,
}: {
  ApiVersion?: unknown
  MinAPIVersion?: unknown
}): string {
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
//
// `keyType` is not checked against the algorithms known by ssh2: an unknown one
// makes the handshake fail
const hostKeyAlgorithmsFor = (keyType: string): ServerHostKeyAlgorithm[] =>
  keyType === 'ssh-rsa' ? ['rsa-sha2-512', 'rsa-sha2-256', 'ssh-rsa'] : [keyType as ServerHostKeyAlgorithm]

/**
 * Wait for `promise` unless `signal` aborts first (the promise itself is not
 * cancelled).
 */
function raceSignal<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(signal.reason)
  }
  let onAbort: (() => void) | undefined
  // `onAbort!` below: always set, the executor of the promise runs synchronously
  return Promise.race([
    promise,
    new Promise<never>((resolve, reject) => {
      onAbort = () => reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
    }),
  ]).finally(() => signal.removeEventListener('abort', onAbort!))
}

const isJsonContentType = (contentType: unknown) => typeof contentType === 'string' && /[/+]json\b/i.test(contentType)

function buildQueryString(query: Record<string, unknown> | undefined): string {
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

// error bodies are only read for their message: a hostile or buggy daemon must
// not make us read (nor put in errors, logs and API responses) megabytes
export const MAX_ERROR_BODY_SIZE = 4 * 1024
export const MAX_ERROR_MESSAGE_LENGTH = 512

/**
 * Reads at most `maxSize` bytes of a response, the rest is discarded (the
 * response is destroyed, and its channel with it).
 */
async function readBody(response: IncomingMessage, maxSize: number): Promise<{ buffer: Buffer; truncated: boolean }> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of response) {
    chunks.push(chunk)
    size += chunk.length
    if (size > maxSize) {
      response.destroy()
      return { buffer: Buffer.concat(chunks).subarray(0, maxSize), truncated: true }
    }
  }
  return { buffer: Buffer.concat(chunks), truncated: false }
}

export function truncateErrorMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  const message = value.trim()
  if (message === '') {
    return undefined
  }
  return message.length > MAX_ERROR_MESSAGE_LENGTH ? message.slice(0, MAX_ERROR_MESSAGE_LENGTH) + '…' : message
}

/**
 * @returns the parsed JSON (anything: it comes from the daemon), or `buffer` if the response is not JSON
 */
function parseBody(response: IncomingMessage, buffer: Buffer): unknown {
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
 * What `DockerConnection` uses of an `ssh2.Client`, so that tests can provide
 * a stand-in.
 */
export interface SshClient {
  on(event: 'ready', listener: () => void): this
  on(event: 'close', listener: () => void): this
  on(event: 'error', listener: (error: Error & ClientErrorExtensions) => void): this
  once(event: 'close', listener: () => void): this
  connect(config: ConnectConfig): this
  exec(command: string, callback: ClientCallback): this
  openssh_forwardOutStreamLocal(socketPath: string, callback: (error: Error | undefined, channel: Duplex) => void): this
  end(): this
  destroy?(): this
  /** private TCP socket (`net.Socket`) of `ssh2.Client`, not in its public API, see `close()` */
  _sock?: { readonly destroyed: boolean; destroy(): void }
}

export type DockerConnectionOptions = {
  host: string
  port?: number
  username: string
  password?: string
  privateKey?: string | Buffer
  passphrase?: string
  /** path of the Docker socket on the remote host */
  socketPath?: string
  /** expected host key fingerprint (`SHA256:…`), `null` (e.g. from a DB) is the same as missing */
  hostKeyFingerprint?: string | null
  /** type of the expected host key (e.g. `ssh-ed25519`, as in `observedHostKey.algorithm`), makes the server present this key */
  hostKeyAlgorithm?: string | null
  /** accept any host key when `hostKeyFingerprint` is missing, the observed one is then available in `observedHostKey` */
  acceptUnknownHostKey?: boolean
  /** max duration of the SSH connection (TCP + handshake + auth) and of a channel opening (ms) */
  connectTimeout?: number
  /** max duration of an HTTP request, including reading the response (ms) */
  requestTimeout?: number
}

/** for tests only */
export type DockerConnectionInternals = {
  createClient?: () => SshClient
  closeTimeout?: number
}

export type DockerRequestOptions = {
  method?: string
  /** e.g. `/containers/json` */
  path: string
  query?: Record<string, unknown>
  /** objects are sent as JSON */
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export type DockerStreamRequestOptions = DockerRequestOptions & {
  /**
   * the response may stay open for long (e.g. `stats?stream=true`): sent on a
   * dedicated channel, outside of the limit of concurrent requests (see `MAX_LONG_LIVED_STREAMS`)
   */
  longLived?: boolean
  /**
   * raw passthrough: `path` is sent verbatim (it may contain a query string, and is
   * prefixed with the negotiated version unless it starts with `/v<version>/`), and error responses (non 2xx) are
   * returned instead of thrown
   */
  raw?: boolean
}

export type DockerResponse = {
  statusCode: number
  headers: IncomingHttpHeaders
  /** parsed when JSON (anything: it comes from the daemon), a Buffer otherwise */
  body: unknown
}

export type DockerExecResult = { code: number | null; signal: string | undefined; stdout: string; stderr: string }

type SendOptions = {
  method?: string
  path: string
  query?: Record<string, unknown>
  body?: unknown
  headers?: Record<string, string | number>
  versioned?: boolean
  longLived?: boolean
}

type SshConfig = {
  host: string
  port: number
  username: string
  password: string | undefined
  privateKey: string | Buffer | undefined
  passphrase: string | undefined
  hostKeyFingerprint: string | undefined
}

/**
 * Connection to a Docker daemon reached through SSH: one `ssh2.Client`, many
 * HTTP requests multiplexed on `direct-streamlocal@openssh.com` channels.
 */
export class DockerConnection {
  #acceptUnknownHostKey: boolean
  #agent: SshHttpAgent
  #apiVersion: string | undefined
  #client: SshClient | undefined
  #clientPromise: Promise<SshClient> | undefined
  #closeTimeout: number
  #closedClients = new WeakSet<SshClient>()
  #connectTimeout: number
  #createClient: () => SshClient
  #engineVersion: string | undefined
  #generation = 0
  #hostKeyAlgorithm: string | undefined
  #limiter: RequestLimiter
  #pinnedHostKey: HostKey | undefined
  #negotiation: Promise<string> | undefined
  #observedHostKey: HostKey | undefined
  #requestTimeout: number
  #socketPath: string
  #sshConfig: SshConfig
  #streamAgent: SshHttpAgent
  #streamLimiter: RequestLimiter

  /**
   * @param internals for tests only
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
    }: DockerConnectionOptions,
    { createClient = () => new Client(), closeTimeout = CLOSE_TIMEOUT }: DockerConnectionInternals = {}
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

  /** slots in use, for tests and diagnostics */
  get activeRequests(): { requests: number; streams: number } {
    return { requests: this.#limiter.active, streams: this.#streamLimiter.active }
  }

  /** negotiated API version, e.g. `1.43` */
  get apiVersion(): string | undefined {
    return this.#apiVersion
  }

  /** version of the Docker Engine, e.g. `27.3.1` */
  get engineVersion(): string | undefined {
    return this.#engineVersion
  }

  /** host key seen during the last handshake */
  get observedHostKey(): HostKey | undefined {
    return this.#observedHostKey
  }

  get #context(): { host: string; port: number; socketPath: string } {
    const { host, port } = this.#sshConfig
    return { host, port, socketPath: this.#socketPath }
  }

  /**
   * Establish the SSH connection (if necessary) and negotiate the API version.
   */
  async connect(): Promise<void> {
    await this.#getClient()
    await this.#negotiate()
  }

  /**
   * @returns a ready client, shared by all requests
   */
  #getClient(): Promise<SshClient> {
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

  #openClient(): Promise<SshClient> {
    const { host, port, username, password, privateKey, passphrase } = this.#sshConfig
    const context = this.#context

    // once a key has been accepted, it is pinned for the lifetime of this
    // instance: reconnections must present the same key, even when the first
    // one was accepted via `acceptUnknownHostKey`
    const pinned = this.#pinnedHostKey
    const expectedFingerprint = this.#sshConfig.hostKeyFingerprint ?? pinned?.fingerprint
    const expectedAlgorithm = this.#hostKeyAlgorithm ?? pinned?.algorithm

    return new Promise<SshClient>((resolve, reject) => {
      const client = this.#createClient()
      this.#client = client

      let hostKeyError: DockerError | undefined
      let ready = false
      let settled = false
      const fail = (error: DockerError) => {
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
          hostVerifier: (keyBlob: Buffer): boolean => {
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
              //
              // `data` of the errors thrown by `verifyHostKey()`
              const {
                actual,
                fingerprint = actual,
                algorithm,
              } = error.data as {
                actual?: string
                fingerprint?: string
                algorithm: string | undefined
              }
              // one of them is always set by `verifyHostKey()`
              this.#observedHostKey = { fingerprint: fingerprint!, algorithm }
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

  #negotiate(): Promise<string> {
    if (this.#apiVersion !== undefined) {
      return Promise.resolve(this.#apiVersion)
    }
    if (this.#negotiation === undefined) {
      const negotiation = (async () => {
        const { body } = (await this.#request({ method: 'GET', path: '/version', versioned: false })) as {
          body: DockerVersion
        }
        const apiVersion = negotiateApiVersion(body)
        this.#apiVersion = apiVersion
        this.#engineVersion = body.Version
        debug('Docker API version negotiated', { ...this.#context, apiVersion, engineVersion: body.Version })
        return apiVersion
      })()
      this.#negotiation = negotiation
      // on success, #apiVersion is set and checked first
      negotiation.catch(() => {
        // allow a new attempt
        this.#negotiation = undefined
      })
    }
    return this.#negotiation
  }

  /**
   * Send a request and wait for the response headers.
   */
  async #send(
    { method = 'GET', path, query, body, headers = {}, versioned = true, longLived = false }: SendOptions,
    signal: AbortSignal,
    generation: number
  ): Promise<IncomingMessage> {
    if (versioned) {
      // the negotiation is shared between requests: do not cancel it
      await raceSignal(this.#negotiate(), signal)
    }
    signal.throwIfAborted()
    this.#assertNotClosedSince(generation)

    let payload: unknown
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
    let onAbort: (() => void) | undefined
    const release = () => {
      // `onAbort!`: `release()` is only called once the listener is set, or
      // before `addEventListener()` which ignores `undefined`
      signal.removeEventListener('abort', onAbort!)
      releaseSlot()
    }
    try {
      this.#assertNotClosedSince(generation)
    } catch (error) {
      release()
      throw error
    }

    return new Promise<IncomingMessage>((resolve, reject) => {
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
        // a string, a Buffer or `undefined`: objects have been serialized above
        req.end(payload as string | Buffer | undefined)
      }
    })
  }

  #assertNotClosedSince(generation: number): void {
    if (generation !== this.#generation) {
      throw new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed', { data: this.#context })
    }
  }

  #wrapError(error: unknown, path: string | undefined, signal: AbortSignal, generation: number): DockerError {
    if (isDockerError(error)) {
      return error
    }
    if (generation !== this.#generation) {
      return new DockerError(CONNECTION_CLOSED, 'the Docker connection has been closed', {
        data: { ...this.#context, path },
        cause: error,
      })
    }
    // only its `name` is looked at, it is an Error in practice
    const errorLike = error as { name?: unknown } | null | undefined
    // once the signal is aborted, the error can also be a generic socket
    // error (e.g. `ECONNRESET: aborted` while reading the body)
    if (signal.aborted || errorLike?.name === 'AbortError' || errorLike?.name === 'TimeoutError') {
      // AbortError from http.request has the signal reason as cause
      return new DockerError(TIMEOUT, 'Docker API request timed out or was aborted', {
        data: { ...this.#context, path, timeout: this.#requestTimeout },
        cause: errorLike!.name === 'AbortError' || signal.reason === undefined ? error : signal.reason,
      })
    }
    return fromSshError(error, this.#context)
  }

  async #throwApiError(response: IncomingMessage, path: string, signal: AbortSignal): Promise<never> {
    let message: string | undefined
    try {
      const { buffer, truncated } = await raceSignal(readBody(response, MAX_ERROR_BODY_SIZE), signal)
      let body: unknown = buffer
      if (!truncated) {
        try {
          body = parseBody(response, buffer)
        } catch {
          // invalid JSON: used as text
        }
      }
      // a truncated JSON body cannot be parsed: its beginning is used as text
      message = truncateErrorMessage(
        Buffer.isBuffer(body) ? body.toString('utf8') : (body as { message?: unknown } | null | undefined)?.message
      )
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

  async #request(opts: SendOptions & { signal?: AbortSignal }): Promise<DockerResponse> {
    const generation = this.#generation
    const signal = AbortSignal.any(
      [AbortSignal.timeout(this.#requestTimeout), opts.signal].filter(signal => signal !== undefined)
    )
    try {
      const response = await this.#send(opts, signal, generation)
      const { headers } = response
      // always set on a client response
      const statusCode = response.statusCode!
      if (statusCode < 200 || statusCode >= 300) {
        await this.#throwApiError(response, opts.path, signal)
      }
      const { buffer, truncated } = await raceSignal(readBody(response, MAX_RESPONSE_SIZE), signal)
      if (truncated) {
        throw new DockerError(DOCKER_API_ERROR, 'Docker API response is too large', {
          data: { maxSize: MAX_RESPONSE_SIZE },
        })
      }
      const body = parseBody(response, buffer)
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
   * @returns body is parsed when JSON, a Buffer otherwise
   * @throws {DockerError}
   */
  request({ method, path, query, body, headers, signal }: DockerRequestOptions): Promise<DockerResponse> {
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
   * @throws {DockerError}
   */
  async requestStream({
    method,
    path,
    query,
    body,
    headers,
    signal: callerSignal,
    longLived = false,
    raw = false,
  }: DockerStreamRequestOptions): Promise<IncomingMessage> {
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
      // `statusCode!`: always set on a client response
      if (!raw && (response.statusCode! < 200 || response.statusCode! >= 300)) {
        await this.#throwApiError(response, path, signal)
      }
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
   * @throws {DockerError}
   */
  async exec(
    command: string,
    { signal: callerSignal, maxOutputSize = 64 * 1024 }: { signal?: AbortSignal; maxOutputSize?: number } = {}
  ): Promise<DockerExecResult> {
    const signal = AbortSignal.any(
      [AbortSignal.timeout(this.#requestTimeout), callerSignal].filter(signal => signal !== undefined)
    )
    const generation = this.#generation
    try {
      const client = await raceSignal(this.#getClient(), signal)
      this.#assertNotClosedSince(generation)
      return await new Promise<DockerExecResult>((resolve, reject) => {
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

          const collect = (chunks: Buffer[]) => {
            let size = 0
            return (chunk: Buffer) => {
              if (size < maxOutputSize) {
                chunks.push(chunk.subarray(0, maxOutputSize - size))
              }
              size += chunk.length
            }
          }
          const stdout: Buffer[] = []
          const stderr: Buffer[] = []
          channel.on('data', collect(stdout))
          channel.stderr.on('data', collect(stderr))

          let exitCode: number | null = null
          let exitSignal: string | undefined
          channel.on('exit', (code: number | null, signalName?: string) => {
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
   */
  async close(): Promise<void> {
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
    await new Promise<void>(resolve => {
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
