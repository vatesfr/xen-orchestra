// @ts-check

// Docker engines reached through SSH (`direct-streamlocal` to the Docker
// socket), and their containers.
//
// Collision rule (see `@xen-orchestra/mixin/legacy.js`): every public method is
// copied onto `Xo`, so internals are `#private` and public names contain
// `Docker`.

import { asyncEach } from '@vates/async-each'
import { createHmac, randomBytes } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'
import { synchronized } from 'decorator-synchronized'
import { invalidParameters, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'

import {
  AsyncTtlCache,
  CONNECTION_CLOSED,
  DOCKER_API_ERROR,
  DOCKER_SOCKET_UNREACHABLE,
  DockerConnection,
  DockerConnectionPool,
  DockerError,
  DockerStatsSampler,
  HOST_KEY_MISMATCH,
  HOST_KEY_TYPES,
  HOST_KEY_UNKNOWN,
  isDockerError,
  normalizeContainerInspect,
  normalizeContainerListEntry,
  normalizeContainerStats,
  normalizeEngineInfo,
  parseFingerprint,
  POOL_EXHAUSTED,
  rawRequest,
  readContainerLogs,
  RAW_REQUEST_TOO_LARGE,
  SSH_AUTH_FAILED,
  SSH_COOLDOWN,
  SSH_UNREACHABLE,
  SshCooldown,
  TIMEOUT,
} from '@xen-orchestra/docker-ssh'
import { DockerEngines } from '../models/docker-engine.mjs'
import { parseSize } from '../utils.mjs'

/**
 * @typedef {import('@vates/types').XoApp} XoApp
 * @typedef {import('@vates/types').XoDockerContainer} XoDockerContainer
 * @typedef {import('@vates/types').XoDockerContainerAction} XoDockerContainerAction
 * @typedef {import('@vates/types').XoDockerContainerListError} XoDockerContainerListError
 * @typedef {import('@vates/types').XoDockerContainerStats} XoDockerContainerStats
 * @typedef {import('@vates/types').XoDockerEngine} XoDockerEngine
 * @typedef {import('@vates/types').XoDockerEngineInfo} XoDockerEngineInfo
 * @typedef {import('@vates/types').XoDockerEngineInfoDisconnected} XoDockerEngineInfoDisconnected
 * @typedef {import('@vates/types').XoDockerEngineTestResult} XoDockerEngineTestResult
 * @typedef {import('@vates/types').XoDockerError} XoDockerError
 * @typedef {import('@vates/types').XoDockerLogs} XoDockerLogs
 * @typedef {import('@vates/types').XoDockerSocketDiagnostic} XoDockerSocketDiagnostic
 * @typedef {import('@xen-orchestra/docker-ssh').DockerConnectionFacade} DockerConnectionFacade
 * @typedef {import('@xen-orchestra/docker-ssh').DockerInfo} DockerInfo
 * @typedef {import('@xen-orchestra/docker-ssh').DockerInspect} DockerInspect
 * @typedef {import('@xen-orchestra/docker-ssh').DockerVersion} DockerVersion
 * @typedef {import('@xen-orchestra/docker-ssh').NormalizedDockerContainer} NormalizedDockerContainer
 * @typedef {import('../models/docker-engine.mjs').DockerEngineRecord} DockerEngineRecord
 *
 * @typedef {{ asOf: number, containers: Map<string, { container: NormalizedDockerContainer, inspected: boolean }> }} EngineContainers
 *   cached list of the containers of an engine, see `#getEngineContainers()`
 *
 * The public methods, whose signatures are in `XoApp` (`@vates/types/src/xo-app.mts`)
 * @typedef {Pick<XoApp,
 *   | 'callDockerEngineRawApi'
 *   | 'createDockerEngine'
 *   | 'deleteDockerContainer'
 *   | 'deleteDockerEngine'
 *   | 'getAllDockerEngines'
 *   | 'getDockerContainer'
 *   | 'getDockerContainerLogs'
 *   | 'getDockerContainerStats'
 *   | 'getDockerContainers'
 *   | 'getDockerEngine'
 *   | 'getDockerEngineInfo'
 *   | 'runDockerContainerAction'
 *   | 'testDockerEngine'
 *   | 'updateDockerEngine'
 * >} DockerXoApp
 */

const log = createLogger('xo:xo-mixins:docker')

const DEFAULT_SOCKET_PATH = '/var/run/docker.sock'
const DEFAULT_SSH_PORT = 22

const DEFAULTS = {
  connectTimeout: 15e3,
  requestTimeout: 30e3,
  strictHostKeyChecking: true,
  maxConnections: 20,
  connectionIdleTimeout: 5 * 60e3,
  failureTtl: 30e3,
  cacheExpiresIn: 10e3,
  inspectThreshold: 200,
  defaultLogsTail: 100,
  maxLogsTail: 10e3,
  maxLogsSize: 5 * 1024 * 1024,
  logsTimeout: 30e3,
  logsIdleTimeout: 10e3,
  authFailureCooldown: 10e3,
  statsIdleTimeout: 90e3,
  maxStatsContainers: 100,
  maxStatsEngines: 10,
  maxRawRequestSize: 1024 * 1024,
  maxRawResponseSize: 10 * 1024 * 1024,
  rawRequestTimeout: 5 * 60e3,
}

const FINGERPRINT_RE = /^SHA256:[A-Za-z0-9+/]{43}$/

// public property → stored property
const WRITABLE_FIELDS = new Map([
  ['$VM', 'vm'],
  ['label', 'label'],
  ['host', 'host'],
  ['port', 'port'],
  ['username', 'username'],
  ['password', 'password'],
  ['privateKey', 'privateKey'],
  ['passphrase', 'passphrase'],
  ['socketPath', 'socketPath'],
  ['hostKeyFingerprint', 'hostKeyFingerprint'],
])
const TRANSIENT_FIELDS = new Set(['acceptUnknownHostKey'])
const STRING_FIELDS = ['vm', 'label', 'host', 'username', 'password', 'privateKey', 'passphrase', 'socketPath']

// stored properties which change the SSH connection itself: an update changing
// one of them (or the address resolved from the VM) connects first, and is only
// saved on success
const CONNECTION_FIELDS = [
  'host',
  'port',
  'username',
  'password',
  'privateKey',
  'passphrase',
  'socketPath',
  'hostKeyFingerprint',
  'hostKeyAlgorithm',
]

// stored properties which change how to connect: changing any of them bumps the
// revision, which invalidates the pooled connection and the caches
const IDENTITY_FIELDS = ['vm', ...CONNECTION_FIELDS]

// in the key of the pooled connection, see `#connectionKey()`: not the host key,
// a change of it bumps the revision anyway, except for the pinning of an
// accepted unknown key, which must keep the connection which accepted it
const KEYED_FIELDS = CONNECTION_FIELDS.filter(key => key !== 'hostKeyFingerprint' && key !== 'hostKeyAlgorithm')

// stored properties accepted by the config import, see `#importEngines()`
const STORED_FIELDS = new Set([...WRITABLE_FIELDS.values(), 'hostKeyAlgorithm', 'revision'])

// pin a host key into the record (mutated, not saved)
function setHostKey(record, { fingerprint, algorithm }) {
  record.hostKeyFingerprint = fingerprint
  if (algorithm === undefined) {
    delete record.hostKeyAlgorithm
  } else {
    record.hostKeyAlgorithm = algorithm
  }
}

// unique, never reused: two different identities never share a revision
const newRevision = () => randomBytes(8).toString('hex')

// stored properties exposed as is by the API, secrets are NEVER in this list
const PUBLIC_FIELDS = ['label', 'host', 'port', 'username', 'socketPath', 'hostKeyFingerprint', 'hostKeyAlgorithm']

// containers whose inspection gives useful data (uptime, restart count…) in
// the list, see tier 2 in the plan
const INSPECTED_STATES = new Set(['running', 'paused', 'restarting'])

const CONTAINER_ACTIONS = new Set(['start', 'stop', 'restart', 'pause', 'unpause'])

// containers streamed by the stats sampler (a paused container still uses memory)
const SAMPLED_STATES = new Set(['running', 'paused'])

const RAW_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'])

/** @type {Record<string, XoDockerEngineInfoDisconnected['status']>} */
const INFO_STATUS_BY_CODE = {
  [SSH_AUTH_FAILED]: 'auth-failed',
  [HOST_KEY_MISMATCH]: 'host-key-mismatch',
  [HOST_KEY_UNKNOWN]: 'host-key-mismatch',
}

/**
 * @param {import('@xen-orchestra/docker-ssh').DockerError} error
 * @returns {XoDockerError}
 */
const serializeDockerError = error => {
  /** @type {XoDockerError} */
  const result = { code: error.code, message: error.message }
  if (error.data !== undefined) {
    result.data = error.data
  }
  return result
}

const isNotFound = error => isDockerError(error) && error.code === DOCKER_API_ERROR && error.data?.statusCode === 404

// single-quote a string for POSIX shells
const shQuote = value => `'${String(value).replaceAll("'", `'\\''`)}'`

// run by `/bin/sh` whatever the login shell of the user is, the socket path is
// passed as `$1`
//
// No `!`: the command line is first parsed by the login shell of the user,
// and csh/tcsh expand `!` (history) even between single quotes.
const SOCKET_PROBE_SCRIPT = [
  'test -e "$1" || { echo missing; exit 0; }',
  'test -S "$1" || { echo not-a-socket; exit 0; }',
  'test -r "$1" && test -w "$1" || { echo permission-denied; exit 0; }',
  'echo ok',
].join('; ')

/** @type {Record<string, (socketPath: string) => XoDockerSocketDiagnostic>} */
const SOCKET_DIAGNOSTICS = {
  missing: socketPath => ({
    code: 'socket-missing',
    message: `${socketPath} does not exist on the Docker host: is dockerd running, and is it the right path (rootless Docker: /run/user/<uid>/docker.sock)?`,
  }),
  'not-a-socket': socketPath => ({
    code: 'not-a-socket',
    message: `${socketPath} exists on the Docker host but is not a socket`,
  }),
  'permission-denied': socketPath => ({
    code: 'permission-denied',
    message: `the SSH user cannot read and write ${socketPath}: add it to the docker group (or use the socket of a rootless daemon it owns)`,
  }),
  ok: socketPath => ({
    code: 'forwarding-disabled',
    message: `${socketPath} exists and is accessible to the SSH user: stream local forwarding is probably disabled on the SSH server (AllowStreamLocalForwarding, DisableForwarding), or dockerd does not listen on this socket`,
  }),
}

/**
 * Convert a date parameter to what the Docker API expects: a UNIX timestamp in
 * seconds (fractional part allowed).
 *
 * @param {string} name
 * @param {number | string | Date | undefined} value milliseconds since epoch, or a date string
 * @returns {string | undefined}
 */
function toDockerTimestamp(name, value) {
  if (value === undefined) {
    return
  }
  const time = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value)
  if (!Number.isFinite(time) || time < 0) {
    throw invalidParameters(`${name} must be a date or a number of milliseconds since the epoch`)
  }
  return String(time / 1e3)
}

function validateRecord(record) {
  for (const key of STRING_FIELDS) {
    if (record[key] !== undefined && typeof record[key] !== 'string') {
      throw invalidParameters(`${key === 'vm' ? '$VM' : key} must be a string`)
    }
  }
  if (record.username === undefined || record.username === '') {
    throw invalidParameters('username is required')
  }
  if (record.password === undefined && record.privateKey === undefined) {
    throw invalidParameters('a password or a private key is required')
  }
  if (record.vm === undefined && record.host === undefined) {
    throw invalidParameters('host is required when the engine is not attached to a VM')
  }
  if (!Number.isInteger(record.port) || record.port < 1 || record.port > 65535) {
    throw invalidParameters('port must be an integer between 1 and 65535')
  }
  if (!record.socketPath.startsWith('/') || record.socketPath.includes('\0')) {
    throw invalidParameters('socketPath must be an absolute path')
  }
  if (record.hostKeyFingerprint !== undefined && !FINGERPRINT_RE.test(record.hostKeyFingerprint)) {
    throw invalidParameters('hostKeyFingerprint must be a SHA256 fingerprint, as printed by ssh-keygen -l')
  }
  if (record.hostKeyAlgorithm !== undefined && !HOST_KEY_TYPES.has(record.hostKeyAlgorithm)) {
    throw invalidParameters(`hostKeyAlgorithm must be one of ${Array.from(HOST_KEY_TYPES).join(', ')}`)
  }
}

/**
 * Normalize an answer of the daemon (hostile or buggy, see `wire.mts` in
 * `@xen-orchestra/docker-ssh`): a malformed one is a DOCKER_API_ERROR, not a
 * TypeError.
 *
 * @template T
 * @param {() => T} normalize
 * @returns {T}
 */
function normalizeAnswer(normalize) {
  try {
    return normalize()
  } catch (error) {
    throw new DockerError(DOCKER_API_ERROR, 'invalid answer from the Docker daemon', { cause: error })
  }
}

/**
 * @param {unknown} body of `GET /containers/json`
 * @returns {NormalizedDockerContainer[]}
 */
function normalizeContainerList(body) {
  if (!Array.isArray(body)) {
    throw new DockerError(DOCKER_API_ERROR, 'invalid container list from the Docker daemon')
  }
  return body.map(entry => normalizeAnswer(() => normalizeContainerListEntry(entry)))
}

// merges the details of an inspection into a list entry, keeping the human
// readable `status` which is only in the list
const mergeInspect = (listEntry, inspected) => ({ ...listEntry, ...inspected, status: listEntry.status })

function summarizeCompose(containers) {
  const projects = new Map()
  for (const { compose, state } of containers) {
    if (compose === undefined) {
      continue
    }
    let project = projects.get(compose.project)
    if (project === undefined) {
      project = { name: compose.project, containers: 0, running: 0 }
      projects.set(compose.project, project)
    }
    ++project.containers
    if (state === 'running') {
      ++project.running
    }
  }
  return { projects: Array.from(projects.values()).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) }
}

/** @implements {DockerXoApp} */
export default class Docker {
  #app
  #cache
  #config
  #cooldown
  /** @type {DockerEngines} */
  #db
  // per process: the keys of the connections and caches are HMACs of the
  // connection parameters (secrets included), never exposed
  #keySecret = randomBytes(32)
  // in-process mutexes: `engine:<id>` for every mutation of an engine,
  // `vm:<id>` around the one-engine-per-VM check and the write
  #lock = synchronized.withKey()((key, fn) => fn())
  #pool
  // engine id → { key, sampler }, see `#getSampler()`
  #samplers = new Map()
  // engine id → its current revision (`null` once deleted), for the engines
  // written by this process: a record read before a mutation is stale, it must
  // not connect (old credentials, deleted engine), see `#assertCurrent()`
  #revisions = new Map()

  constructor(app) {
    this.#app = app

    const { config } = app
    const get = (key, parse = value => value) => {
      const value = config.getOptional('docker.' + key)
      return value === undefined ? DEFAULTS[key] : parse(value)
    }
    const getDuration = key => config.getOptionalDuration('docker.' + key) ?? DEFAULTS[key]
    this.#config = {
      connectTimeout: getDuration('connectTimeout'),
      requestTimeout: getDuration('requestTimeout'),
      strictHostKeyChecking: get('strictHostKeyChecking'),
      inspectThreshold: get('inspectThreshold'),
      defaultLogsTail: get('defaultLogsTail'),
      maxLogsTail: get('maxLogsTail'),
      maxLogsSize: get('maxLogsSize', parseSize),
      logsTimeout: getDuration('logsTimeout'),
      logsIdleTimeout: getDuration('logsIdleTimeout'),
      statsIdleTimeout: getDuration('statsIdleTimeout'),
      maxStatsContainers: get('maxStatsContainers'),
      // every live sampler holds a pooled connection: never all of them
      maxStatsEngines: Math.min(get('maxStatsEngines'), Math.floor(get('maxConnections') / 2)),
      maxRawRequestSize: get('maxRawRequestSize', parseSize),
      maxRawResponseSize: get('maxRawResponseSize', parseSize),
      rawRequestTimeout: getDuration('rawRequestTimeout'),
    }

    this.#cooldown = new SshCooldown({ cooldown: getDuration('authFailureCooldown') })

    this.#cache = new AsyncTtlCache({ expiresIn: getDuration('cacheExpiresIn') })
    this.#pool = new DockerConnectionPool({
      maxConnections: get('maxConnections'),
      idleTimeout: getDuration('connectionIdleTimeout'),
      failureTtl: getDuration('failureTtl'),
      onSweep: () => this.#cache.sweep(),
    })

    app.hooks.on('clean', () => this.#db.rebuildIndexes())
    app.hooks.on('core started', () => {
      const db = (this.#db = new DockerEngines({
        connection: app._redis,
        namespace: 'dockerEngine',
        indexes: ['vm'],
        crypto: app.cryptoCredentials,
      }))

      app.addConfigManager?.(
        'dockerEngines',
        () => db.get(),
        engines => this.#importEngines(engines)
      )
    })
    app.hooks.on('stop', () => {
      this.#stopSamplers()
      return this.#pool.destroy()
    })
  }

  // ===================================================================
  // Engines
  // ===================================================================

  /**
   * @returns {Promise<XoDockerEngine[]>} the engines, without secrets
   */
  async getAllDockerEngines() {
    // `Collection#get()` is not typed (its base implementation returns nothing)
    const records = /** @type {DockerEngineRecord[]} */ (/** @type {unknown} */ (await this.#db.get()))
    return records.map(record => this.#sanitize(record))
  }

  /**
   * @param {string} id
   * @returns {Promise<XoDockerEngine>} the engine, without secrets
   */
  async getDockerEngine(id) {
    return this.#sanitize(await this.#getEngineWithCredentials(id))
  }

  /**
   * Register a Docker engine.
   *
   * Connects first: the SSH credentials and the host key are checked, and
   * nothing is saved on failure.
   *
   * Without `hostKeyFingerprint`, the connection fails with a DockerError
   * `HOST_KEY_UNKNOWN` whose `data` contains the observed `fingerprint` and
   * `algorithm`, unless `acceptUnknownHostKey` is true (or
   * `docker.strictHostKeyChecking` is false): the observed key is then pinned
   * in the record.
   *
   * After an authentication, host key or handshake failure, the same
   * parameters are refused for `docker.authFailureCooldown` (DockerError
   * `SSH_COOLDOWN`, `data.retryAfter` in seconds), see `cooldown.mts` in `@xen-orchestra/docker-ssh`.
   *
   * @param {object} [params]
   * @param {string} [params.$VM] VM running the engine, required without `host`
   * @param {string} [params.host] empty: resolved from the VM's addresses at connection time
   * @param {number} [params.port]
   * @param {string} [params.username] required (checked)
   * @param {string} [params.password]
   * @param {string} [params.privateKey]
   * @param {string} [params.passphrase]
   * @param {string} [params.socketPath]
   * @param {string} [params.hostKeyFingerprint] `SHA256:…` as printed by `ssh-keygen -l`, or a whole line of it (whose
   *   key type is then used)
   * @param {boolean} [params.acceptUnknownHostKey] transient, never stored
   * @param {string} [params.label]
   * @returns {Promise<XoDockerEngine>} the new engine, without secrets
   * @throws {DockerError} the connection errors (HOST_KEY_UNKNOWN, HOST_KEY_MISMATCH, SSH_AUTH_FAILED…), SSH_COOLDOWN
   */
  async createDockerEngine(params = {}) {
    const record = { port: DEFAULT_SSH_PORT, socketPath: DEFAULT_SOCKET_PATH }
    this.#applyProperties(record, params)
    validateRecord(record)
    if (record.vm !== undefined) {
      this.#assertVmExists(record.vm)
    }

    const create = async () => {
      if (record.vm !== undefined) {
        await this.#assertNoEngineForVm(record.vm)
      }
      await this.#connectAndPin(record, { acceptUnknownHostKey: params.acceptUnknownHostKey === true })
      record.revision = newRevision()
      const created = await this.#db.add(record)
      this.#revisions.set(created.id, created.revision)
      return this.#sanitize(created)
    }
    // the check, the connection and the write are atomic per VM
    return record.vm === undefined ? create() : this.#withLocks([`vm:${record.vm}`], create)
  }

  /**
   * Partial update of an engine.
   *
   * - omitted (`undefined`) properties are kept, `null` or `''` clears them
   *   (resets `port` and `socketPath` to their defaults); clearing
   *   `privateKey` also clears `passphrase`
   * - changing a connection property (host, port, username, secrets,
   *   socketPath, hostKeyFingerprint, or the address resolved from the VM)
   *   connects first, verifying the host key with the new or the stored pin:
   *   nothing is saved on failure, and the errors are the ones of
   *   `createDockerEngine()` (HOST_KEY_UNKNOWN, HOST_KEY_MISMATCH,
   *   SSH_AUTH_FAILED, SSH_COOLDOWN…); on success, the pooled connection is
   *   closed and the caches evicted
   * - without `hostKeyFingerprint` after the update (e.g. it has been cleared
   *   with `null`), the TOFU flow of `createDockerEngine()` applies, with
   *   `acceptUnknownHostKey`
   * - other changes (e.g. `label`) do not connect
   *
   * Serialized with the other mutations of the engine (update, delete, host
   * key pinning, config import).
   *
   * @param {string} id
   * @param {object} [properties] see `createDockerEngine()`
   * @returns {Promise<XoDockerEngine>} the updated engine, without secrets
   */
  async updateDockerEngine(id, properties = {}) {
    if (typeof id !== 'string') {
      throw noSuchObject(id, 'docker-engine')
    }
    return this.#withLocks([`engine:${id}`], async () => {
      // read under the lock: sees the result of the previous mutations, and
      // fails if the engine has been deleted meanwhile
      const previous = await this.#getEngineWithCredentials(id)
      const record = { ...previous }
      this.#applyProperties(record, properties)
      validateRecord(record)
      if (record.vm !== undefined && record.vm !== previous.vm) {
        this.#assertVmExists(record.vm)
      }

      const update = async () => {
        if (record.vm !== undefined && record.vm !== previous.vm) {
          await this.#assertNoEngineForVm(record.vm)
        }

        const connectionChanged =
          CONNECTION_FIELDS.some(key => record[key] !== previous[key]) ||
          this.#resolveHost(record) !== this.#resolveHost(previous)
        if (connectionChanged || record.hostKeyFingerprint === undefined) {
          await this.#connectAndPin(record, { acceptUnknownHostKey: properties.acceptUnknownHostKey === true })
        }

        const identityChanged = IDENTITY_FIELDS.some(key => record[key] !== previous[key])
        const changed = Object.keys({ ...record, ...previous }).some(key => record[key] !== previous[key])
        if (changed) {
          if (identityChanged) {
            record.revision = newRevision()
          }
          await this.#db.update(record)
          this.#revisions.set(id, record.revision)
          if (identityChanged) {
            await this.#invalidate(id)
          }
        }
        return this.#sanitize(record)
      }
      return record.vm !== undefined && record.vm !== previous.vm
        ? this.#withLocks([`vm:${record.vm}`], update)
        : update()
    })
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteDockerEngine(id) {
    if (typeof id !== 'string') {
      throw noSuchObject(id, 'docker-engine')
    }
    await this.#withLocks([`engine:${id}`], async () => {
      await this.#getEngineWithCredentials(id)
      await this.#db.remove(id)
      this.#revisions.set(id, null)
      await this.#invalidate(id)
    })
  }

  /**
   * Check the connection to an engine with a new, non pooled, connection.
   *
   * Never throws for connection problems. When the Docker socket cannot be
   * opened, a diagnostic tells apart the possible causes (see
   * `#probeSocket()`).
   *
   * @param {string} id
   * @returns {Promise<XoDockerEngineTestResult>}
   * @throws {DockerError} SSH_COOLDOWN (nothing attempted) shortly after an authentication, host key or handshake failure with the same parameters
   */
  async testDockerEngine(id) {
    const record = await this.#getEngineWithCredentials(id)
    const acceptUnknownHostKey = record.hostKeyFingerprint === undefined && !this.#config.strictHostKeyChecking
    let connection
    try {
      connection = this.#createConnection(record, { acceptUnknownHostKey, checkCooldown: true })
      await connection.connect()
      const { fingerprint, algorithm } = connection.observedHostKey ?? {}
      if (record.hostKeyFingerprint === undefined && fingerprint !== undefined) {
        await this.#pinHostKey(id, { fingerprint, algorithm })
      }
      this.#pool.clearFailure(id)
      return {
        ok: true,
        apiVersion: connection.apiVersion,
        engineVersion: connection.engineVersion,
        fingerprint,
        algorithm,
      }
    } catch (error) {
      if (!isDockerError(error) || error.code === SSH_COOLDOWN) {
        throw error
      }
      const { fingerprint, algorithm } = connection?.observedHostKey ?? {}
      /** @type {XoDockerEngineTestResult} */
      const result = { ok: false, fingerprint, algorithm, error: serializeDockerError(error) }
      if (error.code === DOCKER_SOCKET_UNREACHABLE) {
        result.diagnostic = await this.#probeSocket(connection, record.socketPath)
      }
      return result
    } finally {
      await connection?.close()
    }
  }

  /**
   * Live information about an engine: connects (through the pool).
   *
   * Never throws for connection problems: `status` is `connected`,
   * `unreachable`, `auth-failed` or `host-key-mismatch`, with `error` unless
   * connected.
   *
   * @param {string} id
   * @returns {Promise<XoDockerEngineInfo>}
   */
  async getDockerEngineInfo(id) {
    const record = await this.#getEngineWithCredentials(id)
    try {
      return await this.#withConnection(record, async connection => {
        const [{ body: infoBody }, { body: versionBody }, { body: composeBody }] = await Promise.all([
          connection.request({ path: '/info' }),
          connection.request({ path: '/version' }),
          connection.request({
            path: '/containers/json',
            query: { all: 1, filters: { label: ['com.docker.compose.project'] } },
          }),
        ])
        const info = /** @type {DockerInfo} */ (infoBody)
        const version = /** @type {DockerVersion} */ (versionBody)
        // `id` is the daemon's ID, not to be confused with the engine's
        const { id: daemonId, ...engineInfo } = normalizeAnswer(() => normalizeEngineInfo(info, version))
        return {
          status: /** @type {const} */ ('connected'),
          asOf: Date.now(),
          daemonId,
          ...engineInfo,
          // the version used by XO, `/version` gives the daemon's newest one
          apiVersion: connection.apiVersion,
          daemonApiVersion: version.ApiVersion,
          compose: summarizeCompose(normalizeContainerList(composeBody)),
        }
      })
    } catch (error) {
      if (!isDockerError(error) || error.code === POOL_EXHAUSTED || error.code === DOCKER_API_ERROR) {
        throw error
      }
      return {
        status: INFO_STATUS_BY_CODE[error.code] ?? 'unreachable',
        asOf: Date.now(),
        error: serializeDockerError(error),
      }
    }
  }

  // ===================================================================
  // Containers
  // ===================================================================

  /**
   * Containers of some engines.
   *
   * An engine which fails does not fail the list: its containers are missing
   * and the failure is reported in `errors`.
   *
   * @param {object} [opts]
   * @param {string[]} [opts.engines] ids of the engines, required (checked)
   * @param {boolean} [opts.all] include stopped containers
   * @param {boolean} [opts.stats] merge the latest stats (`stats`) of the running and paused containers, never
   *   blocks: starts the engine's stats sampler if needed, and the containers whose sample is not ready yet (or has
   *   no CPU usage yet, ~2 s after the start) have `statsPending: true`
   * @param {boolean} [opts.forceRefresh] bypass the cache
   * @returns {Promise<{ containers: XoDockerContainer[], errors: XoDockerContainerListError[], asOf: number }>}
   */
  async getDockerContainers({ engines, all = true, stats = false, forceRefresh = false } = {}) {
    if (!Array.isArray(engines)) {
      throw invalidParameters('engines must be an array of engine ids')
    }
    // fails early, before any connection, on an unknown engine
    const records = await Promise.all(Array.from(new Set(engines), id => this.#getEngineWithCredentials(id)))

    /** @type {XoDockerContainer[]} */
    const containers = []
    /** @type {XoDockerContainerListError[]} */
    const errors = []
    /** @type {number | undefined} */
    let asOf
    await asyncEach(
      records,
      async record => {
        try {
          const result = await this.#getEngineContainers(record, { all, forceRefresh })
          asOf = asOf === undefined ? result.asOf : Math.min(asOf, result.asOf)
          let sampler
          if (stats) {
            // `undefined` beyond `docker.maxStatsEngines`: no stats
            sampler = this.#getSampler(record, { start: true })
            // the list tells the sampler which containers are running (the
            // actions evict the cached list, so it follows them)
            sampler?.sync(
              Array.from(result.containers.values(), _ => _.container)
                .filter(_ => SAMPLED_STATES.has(_.state))
                .map(_ => _.dockerId)
            )
          }
          for (const { container } of result.containers.values()) {
            const decorated = this.#decorateContainer(record, container)
            const sample = sampler?.get(container.dockerId)
            if (sample !== undefined) {
              if (sample.stats !== undefined) {
                decorated.stats = sample.stats
              }
              if (sample.pending) {
                decorated.statsPending = true
              }
            }
            containers.push(decorated)
          }
        } catch (error) {
          if (!isDockerError(error)) {
            log.warn('getDockerContainers', { engine: record.id, error })
          }
          errors.push({
            $engine: record.id,
            ...(record.vm === undefined ? {} : { $VM: record.vm }),
            code: error.code ?? 'UNKNOWN_ERROR',
            message: error.message,
          })
        }
      },
      { concurrency: 4, stopOnError: false }
    )
    return { containers, errors, asOf: asOf ?? Date.now() }
  }

  /**
   * @param {string} id composite id: `<engine id>_<Docker id>`
   * @returns {Promise<XoDockerContainer>}
   */
  async getDockerContainer(id) {
    const { record, dockerId } = await this.#resolveContainerId(id)

    for (const all of [true, false]) {
      const cached = this.#peekEngineContainers(record, all)?.containers.get(dockerId)
      if (cached?.inspected) {
        return this.#decorateContainer(record, cached.container)
      }
    }

    return this.#withConnection(record, async connection => {
      let body
      try {
        ;({ body } = await connection.request({ path: `/containers/${encodeURIComponent(dockerId)}/json` }))
      } catch (error) {
        throw isNotFound(error) ? noSuchObject(id, 'docker-container') : error
      }
      const container = normalizeAnswer(() => normalizeContainerInspect(/** @type {DockerInspect} */ (body)))
      // the composite id must designate the container by its full id
      if (container.dockerId !== dockerId) {
        throw noSuchObject(id, 'docker-container')
      }
      return this.#decorateContainer(record, container)
    })
  }

  /**
   * Stats of a container: the latest sample of the engine's stats sampler if
   * it streams this container and has a CPU usage, else one
   * `GET /containers/{id}/stats?stream=false` (~1-2 s, dockerd waits for a
   * second sample).
   *
   * Does not start the sampler.
   *
   * @param {string} id composite id
   * @returns {Promise<XoDockerContainerStats>}
   */
  async getDockerContainerStats(id) {
    const { record, dockerId } = await this.#resolveContainerId(id)
    const sample = this.#getSampler(record, { start: false })?.get(dockerId)
    if (sample !== undefined && !sample.pending && sample.stats !== undefined) {
      return sample.stats
    }
    return this.#withConnection(record, async connection => {
      let body
      try {
        // never `one-shot=true`: `precpu_stats` would be empty
        ;({ body } = await connection.request({
          path: `/containers/${encodeURIComponent(dockerId)}/stats`,
          query: { stream: 0 },
        }))
      } catch (error) {
        throw isNotFound(error) ? noSuchObject(id, 'docker-container') : error
      }
      return normalizeAnswer(() => normalizeContainerStats(body))
    })
  }

  /**
   * Raw Docker Engine API request (the REST raw passthrough, admin only): the
   * caller is responsible for the authorization and for the path and headers
   * checks.
   *
   * The request body is cut at `docker.maxRawRequestSize` and the response
   * body at `docker.maxRawResponseSize` (the body stream then fails with
   * RAW_RESPONSE_TOO_LARGE). The request is sent on a dedicated channel
   * (outside of the limit of concurrent requests of the engine), the pooled
   * connection is held until the response is consumed or destroyed.
   *
   * The whole request, response body included, is aborted after
   * `docker.rawRequestTimeout` (before the response: TIMEOUT, afterwards the
   * body stream fails, i.e. the response is cut); 0 disables it.
   *
   * @param {string} id engine id
   * @param {object} opts
   * @param {string} opts.method
   * @param {string} opts.path Docker API path with its query string, e.g. `/images/json?all=1`; prefixed with the
   *   negotiated API version unless it starts with `/v<version>/`
   * @param {Record<string, string>} [opts.headers] sent as is
   * @param {import('node:stream').Readable} [opts.body]
   * @param {AbortSignal} [opts.signal] aborts the request and the response
   * @returns {Promise<{ statusCode: number, headers: import('node:http').IncomingHttpHeaders, body: import('node:stream').Readable }>}
   */
  async callDockerEngineRawApi(id, { method, path, headers = {}, body, signal }) {
    method = String(method).toUpperCase()
    if (!RAW_METHODS.has(method)) {
      throw invalidParameters(`method must be one of ${Array.from(RAW_METHODS).join(', ')}`)
    }
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw invalidParameters('path must start with /')
    }
    const { maxRawRequestSize, maxRawResponseSize, rawRequestTimeout } = this.#config
    const contentLength = headers['content-length']
    if (contentLength !== undefined && Number(contentLength) > maxRawRequestSize) {
      throw new DockerError(RAW_REQUEST_TOO_LARGE, 'the request body is too large (docker.maxRawRequestSize)', {
        data: { maxSize: maxRawRequestSize },
      })
    }
    const record = await this.#getEngineWithCredentials(id)
    return new Promise((resolve, reject) => {
      this.#withConnection(record, async connection => {
        const { done, ...response } = await rawRequest(connection, {
          method,
          path,
          headers,
          body,
          signal,
          maxRequestSize: maxRawRequestSize,
          maxResponseSize: maxRawResponseSize,
          timeout: rawRequestTimeout,
        })
        resolve(response)
        // the pooled connection is busy until the response is done
        await done
      }).catch(reject)
    })
  }

  /**
   * Logs of a container, bounded: at most `tail` lines, the response is cut
   * at `docker.maxLogsSize` bytes (`truncated: true`), and reading it stops
   * after `docker.logsTimeout` overall, or `docker.logsIdleTimeout` without
   * data (`truncated: true, timedOut: true`, with the entries read so far).
   *
   * @param {string} id composite id
   * @param {object} [opts]
   * @param {number} [opts.tail] number of lines from the end, default `docker.defaultLogsTail`, max `docker.maxLogsTail`
   * @param {number | string} [opts.since] ms since the epoch, or a date string
   * @param {number | string} [opts.until] ms since the epoch, or a date string
   * @param {boolean} [opts.stdout]
   * @param {boolean} [opts.stderr]
   * @param {boolean} [opts.timestamps]
   * @returns {Promise<XoDockerLogs>}
   */
  async getDockerContainerLogs(
    id,
    { tail = this.#config.defaultLogsTail, since, until, stdout = true, stderr = true, timestamps = true } = {}
  ) {
    const { logsIdleTimeout, logsTimeout, maxLogsSize, maxLogsTail } = this.#config
    if (!Number.isInteger(tail) || tail < 0 || tail > maxLogsTail) {
      throw invalidParameters(`tail must be an integer between 0 and ${maxLogsTail}`)
    }
    if (!stdout && !stderr) {
      throw invalidParameters('at least one of stdout and stderr must be requested')
    }
    const range = { since: toDockerTimestamp('since', since), until: toDockerTimestamp('until', until) }
    const { record, dockerId } = await this.#resolveContainerId(id)
    return this.#withConnection(record, async connection => {
      try {
        return await readContainerLogs(connection, dockerId, {
          tail,
          ...range,
          stdout,
          stderr,
          timestamps,
          tty: this.#peekEngineContainers(record, true)?.containers.get(dockerId)?.container.tty,
          maxSize: maxLogsSize,
          maxEntries: maxLogsTail,
          timeout: logsTimeout,
          idleTimeout: logsIdleTimeout,
        })
      } catch (error) {
        throw isNotFound(error) ? noSuchObject(id, 'docker-container') : error
      }
    })
  }

  /**
   * Run a lifecycle action on a container.
   *
   * Starting a running container or stopping a stopped one is a no-op (Docker
   * answers 304), other invalid transitions are Docker API errors (e.g. 409
   * when pausing a paused container).
   *
   * @param {string} id composite id
   * @param {XoDockerContainerAction} action
   * @returns {Promise<void>}
   */
  async runDockerContainerAction(id, action) {
    if (!CONTAINER_ACTIONS.has(action)) {
      throw invalidParameters(`action must be one of ${Array.from(CONTAINER_ACTIONS).join(', ')}`)
    }
    const { record, dockerId } = await this.#resolveContainerId(id)
    await this.#withConnection(record, async connection => {
      try {
        await connection.request({ method: 'POST', path: `/containers/${encodeURIComponent(dockerId)}/${action}` })
      } catch (error) {
        if (isNotFound(error)) {
          throw noSuchObject(id, 'docker-container')
        }
        // not modified: already in the requested state
        if (!(isDockerError(error) && error.code === DOCKER_API_ERROR && error.data?.statusCode === 304)) {
          throw error
        }
      } finally {
        this.#evictContainers(record)
      }
    })
  }

  /**
   * @param {string} id composite id
   * @param {object} [opts]
   * @param {boolean} [opts.force] kill the container first if it is running
   * @param {boolean} [opts.removeVolumes] also remove its anonymous volumes
   * @returns {Promise<void>}
   */
  async deleteDockerContainer(id, { force = false, removeVolumes = false } = {}) {
    const { record, dockerId } = await this.#resolveContainerId(id)
    await this.#withConnection(record, async connection => {
      try {
        await connection.request({
          method: 'DELETE',
          path: `/containers/${encodeURIComponent(dockerId)}`,
          query: { force: force ? 1 : 0, v: removeVolumes ? 1 : 0 },
        })
      } catch (error) {
        throw isNotFound(error) ? noSuchObject(id, 'docker-container') : error
      } finally {
        this.#evictContainers(record)
      }
    })
  }

  // ===================================================================
  // Internals
  // ===================================================================

  // the cached lists of this engine are stale after a container change
  #evictContainers(record) {
    this.#cache.deleteByPrefix(`${record.id}:${this.#connectionKey(record)}:containers:`)
  }

  /**
   * Run `fn` holding the in-process mutexes of `keys`.
   *
   * Always acquired in the same order (`engine:*` before `vm:*`, then sorted)
   * to avoid deadlocks; not reentrant.
   */
  #withLocks(keys, fn) {
    const sorted = Array.from(new Set(keys)).sort((a, b) => {
      const ka = a.startsWith('engine:') ? 0 : 1
      const kb = b.startsWith('engine:') ? 0 : 1
      return ka !== kb ? ka - kb : a < b ? -1 : a > b ? 1 : 0
    })
    return sorted.reduceRight(
      (next, key) => () => this.#lock(key, next),
      () => fn()
    )()
  }

  #hmac(values) {
    return createHmac('sha256', this.#keySecret).update(JSON.stringify(values)).digest('base64url')
  }

  /**
   * Key of the pooled connection and of the caches of an engine: an HMAC of
   * everything the connection depends on, so that a connection (or a cached
   * list) can never serve other parameters than the ones it was made with,
   * even with a stale record.
   */
  #connectionKey(record) {
    return this.#hmac([
      record.revision ?? 0,
      this.#resolveHost(record) ?? null,
      ...KEYED_FIELDS.map(key => record[key] ?? null),
    ])
  }

  /**
   * @returns {Promise<DockerEngineRecord>}
   */
  async #getEngineWithCredentials(id) {
    const record = typeof id === 'string' ? await this.#db.first(id) : undefined
    if (record === undefined) {
      throw noSuchObject(id, 'docker-engine')
    }
    return record
  }

  /**
   * Config import (`addConfigManager`): every record is validated before
   * anything is written, then they are written under the locks of the engines
   * and VMs involved.
   */
  async #importEngines(engines) {
    if (!Array.isArray(engines)) {
      throw invalidParameters('dockerEngines must be an array')
    }
    const ids = new Set()
    const vms = new Map()
    const records = engines.map(engine => {
      if (engine === null || typeof engine !== 'object' || typeof engine.id !== 'string' || engine.id === '') {
        throw invalidParameters('each Docker engine must be an object with an id')
      }
      const { id, ...properties } = engine
      for (const key of Object.keys(properties)) {
        if (!STORED_FIELDS.has(key)) {
          throw invalidParameters(`Docker engine ${id}: unknown property ${key}`)
        }
      }
      if (ids.has(id)) {
        throw invalidParameters(`Docker engine ${id} is present twice`)
      }
      ids.add(id)
      const record = { port: DEFAULT_SSH_PORT, socketPath: DEFAULT_SOCKET_PATH, ...properties }
      try {
        if (typeof record.hostKeyFingerprint === 'string') {
          const { fingerprint, algorithm } = parseFingerprint(record.hostKeyFingerprint)
          record.hostKeyFingerprint = fingerprint
          record.hostKeyAlgorithm ??= algorithm
          if (record.hostKeyAlgorithm === undefined) {
            delete record.hostKeyAlgorithm
          }
        }
        validateRecord(record)
      } catch (error) {
        error.message = `Docker engine ${id}: ${error.message}`
        throw error
      }
      if (record.vm !== undefined) {
        if (vms.has(record.vm)) {
          throw objectAlreadyExists({ objectId: vms.get(record.vm), objectType: 'docker-engine' })
        }
        vms.set(record.vm, id)
      }
      // a new revision: nothing cached for the previous parameters is reused
      return { ...record, id, revision: newRevision() }
    })

    await this.#withLocks(
      [...Array.from(ids, id => `engine:${id}`), ...Array.from(vms.keys(), vm => `vm:${vm}`)],
      async () => {
        // engines not in the import keep their VM
        for (const vm of vms.keys()) {
          const existing = await this.#db.first({ vm })
          if (existing !== undefined && !ids.has(existing.id)) {
            throw objectAlreadyExists({ objectId: existing.id, objectType: 'docker-engine' })
          }
        }
        await this.#db.add(records, { replace: true })
        for (const { id, revision } of records) {
          this.#revisions.set(id, revision)
        }
        await Promise.all(Array.from(ids, id => this.#invalidate(id)))
      }
    )
  }

  async #assertNoEngineForVm(vm) {
    const existing = await this.#db.first({ vm })
    if (existing !== undefined) {
      throw objectAlreadyExists({ objectId: existing.id, objectType: 'docker-engine' })
    }
  }

  /**
   * Apply API properties to a stored record (mutated).
   */
  #applyProperties(record, properties) {
    for (const key of Object.keys(properties)) {
      if (!WRITABLE_FIELDS.has(key) && !TRANSIENT_FIELDS.has(key)) {
        throw invalidParameters(`unknown property ${key}`)
      }
    }
    for (const [publicKey, key] of WRITABLE_FIELDS) {
      const value = properties[publicKey]
      if (value === undefined) {
        continue
      }
      if (value === null || value === '') {
        if (key === 'port') {
          record.port = DEFAULT_SSH_PORT
        } else if (key === 'socketPath') {
          record.socketPath = DEFAULT_SOCKET_PATH
        } else {
          delete record[key]
          if (key === 'hostKeyFingerprint') {
            delete record.hostKeyAlgorithm
          } else if (key === 'privateKey') {
            // the passphrase of a removed key is meaningless
            delete record.passphrase
          }
        }
        continue
      }
      if (key === 'hostKeyFingerprint') {
        if (typeof value !== 'string') {
          throw invalidParameters('hostKeyFingerprint must be a string')
        }
        // a whole `ssh-keygen -l` line gives the type of the key
        const { fingerprint, algorithm } = parseFingerprint(value)
        if (fingerprint !== record.hostKeyFingerprint || algorithm !== undefined) {
          setHostKey(record, { fingerprint, algorithm })
        }
        continue
      }
      record[key] = value
    }
    if (properties.acceptUnknownHostKey !== undefined && typeof properties.acceptUnknownHostKey !== 'boolean') {
      throw invalidParameters('acceptUnknownHostKey must be a boolean')
    }
  }

  /**
   * @throws noSuchObject
   */
  #assertVmExists(vmId) {
    this.#app.getObject(vmId, 'VM')
  }

  #getVm(vmId) {
    try {
      return this.#app.getObject(vmId, 'VM')
    } catch (error) {
      if (noSuchObject.is(error)) {
        return
      }
      throw error
    }
  }

  #resolveHost(record) {
    if (record.host !== undefined) {
      return record.host
    }
    if (record.vm === undefined) {
      return
    }
    const vm = this.#getVm(record.vm)
    return vm?.mainIpAddress ?? Object.values(vm?.addresses ?? {})[0]
  }

  /**
   * @param {object} record
   * @param {object} [opts]
   * @param {boolean} [opts.acceptUnknownHostKey]
   * @param {boolean} [opts.checkCooldown] refuse (SSH_COOLDOWN) if the same parameters failed recently
   */
  #createConnection(record, { acceptUnknownHostKey = false, checkCooldown = false } = {}) {
    const host = this.#resolveHost(record)
    if (host === undefined) {
      throw new DockerError(
        SSH_UNREACHABLE,
        'cannot determine the address of the Docker host: no host is configured and the VM reports no IP address',
        { data: { vm: record.vm } }
      )
    }

    // cooldown of the attempts penalized by OpenSSH's PerSourcePenalties, per
    // engine and per address (an unsaved engine only has the latter)
    const cooldownKeys = [`target:${host}:${record.port}`]
    if (record.id !== undefined) {
      cooldownKeys.push(`engine:${record.id}`)
    }
    const identity = this.#hmac([
      host,
      // not the algorithm: it is derived from the observed key
      ...CONNECTION_FIELDS.filter(key => key !== 'hostKeyAlgorithm').map(key => record[key] ?? null),
      // the TOFU confirmation is a new attempt
      acceptUnknownHostKey,
    ])
    if (checkCooldown) {
      this.#cooldown.check(cooldownKeys, identity)
    }

    const { connectTimeout, requestTimeout } = this.#config
    const connection = new DockerConnection({
      host,
      port: record.port,
      username: record.username,
      password: record.password,
      privateKey: record.privateKey,
      passphrase: record.passphrase,
      socketPath: record.socketPath,
      hostKeyFingerprint: record.hostKeyFingerprint,
      hostKeyAlgorithm: record.hostKeyAlgorithm,
      acceptUnknownHostKey,
      connectTimeout,
      requestTimeout,
    })
    const connect = connection.connect.bind(connection)
    connection.connect = async () => {
      try {
        await connect()
      } catch (error) {
        throw this.#cooldown.onFailure(cooldownKeys, identity, error)
      }
      this.#cooldown.clear(cooldownKeys)
    }
    return connection
  }

  /**
   * Connect with a new connection and pin the observed host key into the
   * record (mutated, not saved).
   *
   * @throws {DockerError} HOST_KEY_UNKNOWN (nothing pinned) without fingerprint, unless accepted
   */
  async #connectAndPin(record, { acceptUnknownHostKey }) {
    const connection = this.#createConnection(record, {
      acceptUnknownHostKey: acceptUnknownHostKey || !this.#config.strictHostKeyChecking,
      checkCooldown: true,
    })
    try {
      await connection.connect()
    } catch (error) {
      if (isDockerError(error) && error.code === DOCKER_SOCKET_UNREACHABLE) {
        error.data = { ...error.data, diagnostic: await this.#probeSocket(connection, record.socketPath) }
      }
      throw error
    } finally {
      await connection.close()
    }
    setHostKey(record, connection.observedHostKey)
  }

  // used when a key has been accepted without strict host key checking
  //
  // Under the engine's lock, on a fresh read: only the pin is written, over
  // whatever the other mutations did meanwhile
  async #pinHostKey(id, hostKey) {
    await this.#withLocks([`engine:${id}`], async () => {
      const record = await this.#db.first(id)
      if (record !== undefined && record.hostKeyFingerprint === undefined) {
        setHostKey(record, hostKey)
        await this.#db.update(record)
      }
    })
  }

  /**
   * Tell apart the causes of a DOCKER_SOCKET_UNREACHABLE, which OpenSSH reports
   * identically (channel open failure, reason 2): run a small script in an SSH
   * session channel.
   *
   * @returns {Promise<XoDockerSocketDiagnostic>}
   */
  async #probeSocket(connection, socketPath) {
    try {
      const { stdout } = await connection.exec(`/bin/sh -c ${shQuote(SOCKET_PROBE_SCRIPT)} sh ${shQuote(socketPath)}`)
      const diagnostic = SOCKET_DIAGNOSTICS[stdout.trim()]
      if (diagnostic !== undefined) {
        return diagnostic(socketPath)
      }
      return { code: 'probe-failed', message: 'unexpected output of the socket probe' }
    } catch (error) {
      return {
        code: 'probe-failed',
        message: `cannot run the socket probe on the Docker host (${isDockerError(error) ? error.code : error.message})`,
      }
    }
  }

  /**
   * @template T
   * @param {DockerEngineRecord} record
   * @param {(connection: DockerConnectionFacade) => Promise<T>} fn
   * @returns {Promise<T>}
   */
  #withConnection(record, fn) {
    return this.#holdConnection(record).then(async ({ connection, release }) => {
      try {
        const result = await fn(connection)
        release()
        return result
      } catch (error) {
        release(error)
        throw error
      }
    })
  }

  /**
   * Pooled connection of an engine, busy until released, see `pool.hold()`.
   *
   * @param {DockerEngineRecord} record
   * @returns {Promise<{ connection: DockerConnectionFacade, release: (error?: unknown) => void }>}
   */
  async #holdConnection(record) {
    this.#assertCurrent(record)
    const acceptUnknownHostKey = record.hostKeyFingerprint === undefined && !this.#config.strictHostKeyChecking
    const held = await this.#pool.hold({ id: record.id, revision: this.#connectionKey(record) }, () =>
      this.#createConnection(record, { acceptUnknownHostKey })
    )
    if (acceptUnknownHostKey && held.connection.observedHostKey !== undefined) {
      try {
        await this.#pinHostKey(record.id, held.connection.observedHostKey)
      } catch (error) {
        held.release(error)
        throw error
      }
    }
    return held
  }

  /**
   * @throws {DockerError} CONNECTION_CLOSED if the record is stale: the engine has been updated or deleted since it was
   *   read
   */
  #assertCurrent(record) {
    const current = this.#revisions.get(record.id)
    if (current !== undefined && current !== record.revision) {
      throw new DockerError(CONNECTION_CLOSED, 'the Docker engine has been updated or deleted meanwhile', {
        data: { engine: record.id },
      })
    }
  }

  /**
   * Stats sampler of an engine, bound to its current connection: it holds a
   * reference on the pooled connection while alive (never evicted, nor closed
   * as idle), and stops on its own after `docker.statsIdleTimeout` without
   * reader, or when the connection fails or is closed.
   *
   * Not started beyond `docker.maxStatsEngines` live samplers (`undefined`).
   *
   * @returns {DockerStatsSampler | undefined}
   */
  #getSampler(record, { start }) {
    const key = this.#connectionKey(record)
    let entry = this.#samplers.get(record.id)
    if (entry !== undefined && (entry.key !== key || entry.sampler.stopped)) {
      // the engine's parameters changed: the sampler used the old connection
      entry.sampler.stop()
      this.#samplers.delete(record.id)
      entry = undefined
    }
    if (entry !== undefined || !start || this.#samplers.size >= this.#config.maxStatsEngines) {
      return entry?.sampler
    }
    this.#assertCurrent(record)

    // a reference on the pooled connection, released when the sampler stops
    const held = this.#holdConnection(record)
    const sampler = new DockerStatsSampler({
      idleTimeout: this.#config.statsIdleTimeout,
      maxContainers: this.#config.maxStatsContainers,
      openStream: async (dockerId, signal) =>
        (await held).connection.requestStream({
          path: `/containers/${encodeURIComponent(dockerId)}/stats`,
          query: { stream: 1 },
          signal,
          longLived: true,
        }),
      onStop: error => {
        if (this.#samplers.get(record.id)?.sampler === sampler) {
          this.#samplers.delete(record.id)
        }
        if (error !== undefined && !isDockerError(error)) {
          log.warn('stats sampler', { engine: record.id, error })
        }
        // an engine failure evicts the connection and is negatively cached
        held.then(
          ({ release }) => release(error),
          () => {}
        )
      },
    })
    this.#samplers.set(record.id, { key, sampler })
    held.catch(error => {
      sampler.stop()
      if (!isDockerError(error)) {
        log.warn('stats sampler', { engine: record.id, error })
      }
    })
    return sampler
  }

  #stopSampler(id) {
    this.#samplers.get(id)?.sampler.stop()
    this.#samplers.delete(id)
  }

  #stopSamplers() {
    for (const id of Array.from(this.#samplers.keys())) {
      this.#stopSampler(id)
    }
  }

  async #invalidate(id) {
    this.#stopSampler(id)
    this.#cache.deleteByPrefix(id + ':')
    await this.#pool.invalidate(id)
  }

  /**
   * @param {DockerEngineRecord} record
   * @returns {XoDockerEngine}
   */
  #sanitize(record) {
    // completed below
    const engine = /** @type {XoDockerEngine} */ ({ id: record.id })
    this.#setVmAndPool(engine, record)
    for (const key of PUBLIC_FIELDS) {
      if (record[key] !== undefined) {
        engine[key] = record[key]
      }
    }
    const resolvedHost = this.#resolveHost(record)
    if (resolvedHost !== undefined) {
      engine.resolvedHost = resolvedHost
    }
    engine.hasPassword = record.password !== undefined
    engine.hasPrivateKey = record.privateKey !== undefined
    const { status, error } = this.#pool.getState(record.id, this.#connectionKey(record))
    engine.connectionStatus = status
    if (error !== undefined) {
      engine.error = error
    }
    return engine
  }

  async #resolveContainerId(id) {
    const index = typeof id === 'string' ? id.indexOf('_') : -1
    const engineId = index === -1 ? undefined : id.slice(0, index)
    const dockerId = index === -1 ? undefined : id.slice(index + 1)
    if (engineId === undefined || !/^[0-9a-f]{64}$/.test(dockerId)) {
      throw noSuchObject(id, 'docker-container')
    }
    let record
    try {
      record = await this.#getEngineWithCredentials(engineId)
    } catch (error) {
      throw noSuchObject.is(error) ? noSuchObject(id, 'docker-container') : error
    }
    return { record, dockerId }
  }

  #containersCacheKey(record, all) {
    return `${record.id}:${this.#connectionKey(record)}:containers:${all ? 'all' : 'running'}`
  }

  /**
   * The cached list of the containers of an engine, if any, see
   * `#getEngineContainers()`.
   *
   * @returns {EngineContainers | undefined}
   */
  #peekEngineContainers(record, all) {
    return /** @type {EngineContainers | undefined} */ (this.#cache.peek(this.#containersCacheKey(record, all)))
  }

  /**
   * Tier 1 (the list) + tier 2 (inspection of the running containers), cached
   * per engine.
   *
   * @returns {Promise<EngineContainers>}
   */
  #getEngineContainers(record, { all, forceRefresh }) {
    return this.#cache.get(
      this.#containersCacheKey(record, all),
      () =>
        this.#withConnection(record, async connection => {
          const { body } = await connection.request({ path: '/containers/json', query: { all: all ? 1 : 0 } })
          const asOf = Date.now()
          /** @type {EngineContainers['containers']} */
          const containers = new Map()
          for (const container of normalizeContainerList(body)) {
            containers.set(container.dockerId, { container, inspected: false })
          }

          const toInspect = Array.from(containers.values(), _ => _.container).filter(_ => INSPECTED_STATES.has(_.state))
          if (toInspect.length <= this.#config.inspectThreshold) {
            await asyncEach(
              toInspect,
              async listEntry => {
                let inspected
                try {
                  const { body } = await connection.request({
                    path: `/containers/${encodeURIComponent(listEntry.dockerId)}/json`,
                  })
                  inspected = normalizeAnswer(() => normalizeContainerInspect(/** @type {DockerInspect} */ (body)))
                } catch (error) {
                  // removed since the list, or a failure of this request only
                  // (not of the engine): keep the list entry, without details
                  if (isDockerError(error) && (error.code === DOCKER_API_ERROR || error.code === TIMEOUT)) {
                    if (!isNotFound(error)) {
                      log.debug('container inspection', { engine: record.id, container: listEntry.dockerId, error })
                    }
                    return
                  }
                  throw error
                }
                containers.set(listEntry.dockerId, { container: mergeInspect(listEntry, inspected), inspected: true })
              },
              { concurrency: 10 }
            )
          }
          return { asOf, containers }
        }),
      { forceRefresh }
    )
  }

  /**
   * @param {DockerEngineRecord} record
   * @param {NormalizedDockerContainer} container
   * @returns {XoDockerContainer}
   */
  #decorateContainer(record, container) {
    // completed below
    const decorated = /** @type {XoDockerContainer} */ ({
      id: `${record.id}_${container.dockerId}`,
      $engine: record.id,
    })
    this.#setVmAndPool(decorated, record)
    return Object.assign(decorated, container)
  }

  // the VM hosting the engine, and its pool when the VM is known
  #setVmAndPool(target, record) {
    if (record.vm !== undefined) {
      target.$VM = record.vm
      const poolId = this.#getVm(record.vm)?.$pool
      if (poolId !== undefined) {
        target.$pool = poolId
      }
    }
  }
}
