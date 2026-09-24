// Docker engines reached through SSH (`direct-streamlocal` to the Docker
// socket), and their containers.
//
// Collision rule (see `@xen-orchestra/mixin/legacy.js`): every public method is
// copied onto `Xo`, so internals are `#private` and public names contain
// `Docker`.

import { asyncEach } from '@vates/async-each'
import { once } from 'node:events'
import { createLogger } from '@xen-orchestra/log'
import { invalidParameters, noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'

import { compareApiVersions, DockerConnection, normalizeFingerprint } from '../_docker/connection.mjs'
import {
  DOCKER_API_ERROR,
  DOCKER_SOCKET_UNREACHABLE,
  DockerError,
  HOST_KEY_MISMATCH,
  HOST_KEY_UNKNOWN,
  isDockerError,
  POOL_EXHAUSTED,
  SSH_AUTH_FAILED,
  SSH_UNREACHABLE,
} from '../_docker/errors.mjs'
import { normalizeContainerInspect, normalizeContainerListEntry, normalizeEngineInfo } from '../_docker/normalize.mjs'
import { DockerConnectionPool } from '../_docker/pool.mjs'
import { createLogLineParser, createStdcopyDemuxer, isMultiplexedStream } from '../_docker/stdcopy.mjs'
import { AsyncTtlCache } from '../_docker/ttl-cache.mjs'
import { DockerEngines } from '../models/docker-engine.mjs'
import { parseSize } from '../utils.mjs'

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

// stored properties which change how to connect: changing any of them bumps the
// revision, which invalidates the pooled connection and the caches
const IDENTITY_FIELDS = [
  'vm',
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

// stored properties exposed as is by the API, secrets are NEVER in this list
const PUBLIC_FIELDS = ['label', 'host', 'port', 'username', 'socketPath', 'hostKeyFingerprint', 'hostKeyAlgorithm']

// containers whose inspection gives useful data (uptime, restart count…) in
// the list, see tier 2 in the plan
const INSPECTED_STATES = new Set(['running', 'paused', 'restarting'])

const CONTAINER_ACTIONS = new Set(['start', 'stop', 'restart', 'pause', 'unpause'])

const INFO_STATUS_BY_CODE = {
  [SSH_AUTH_FAILED]: 'auth-failed',
  [HOST_KEY_MISMATCH]: 'host-key-mismatch',
  [HOST_KEY_UNKNOWN]: 'host-key-mismatch',
}

const serializeDockerError = error => {
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
const SOCKET_PROBE_SCRIPT = [
  'if [ ! -e "$1" ]; then echo missing',
  'elif [ ! -S "$1" ]; then echo not-a-socket',
  'elif [ ! -r "$1" ] || [ ! -w "$1" ]; then echo permission-denied',
  'else echo ok',
  'fi',
].join('; ')

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

export default class Docker {
  #app
  #cache
  #config
  /** @type {DockerEngines} */
  #db
  #pool

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
    }

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
        async engines => {
          await db.update(engines)
          await Promise.all(engines.map(({ id }) => this.#invalidate(id)))
        }
      )
    })
    app.hooks.on('stop', () => this.#pool.destroy())
  }

  // ===================================================================
  // Engines
  // ===================================================================

  /**
   * @returns {Promise<object[]>} the engines, without secrets
   */
  async getAllDockerEngines() {
    return (await this.#db.get()).map(record => this.#sanitize(record))
  }

  /**
   * @param {string} id
   * @returns {Promise<object>} the engine, without secrets
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
   * @param {object} params
   * @param {string} [params.$VM] VM running the engine, required without `host`
   * @param {string} [params.host] empty: resolved from the VM's addresses at connection time
   * @param {number} [params.port]
   * @param {string} params.username
   * @param {string} [params.password]
   * @param {string} [params.privateKey]
   * @param {string} [params.passphrase]
   * @param {string} [params.socketPath]
   * @param {string} [params.hostKeyFingerprint] `SHA256:…` as printed by `ssh-keygen -l`
   * @param {boolean} [params.acceptUnknownHostKey] transient, never stored
   * @param {string} [params.label]
   * @returns {Promise<object>} the new engine, without secrets
   */
  async createDockerEngine(params = {}) {
    const record = { port: DEFAULT_SSH_PORT, socketPath: DEFAULT_SOCKET_PATH }
    this.#applyProperties(record, params)
    validateRecord(record)

    if (record.vm !== undefined) {
      await this.#assertNoEngineForVm(record.vm)
    }

    await this.#connectAndPin(record, { acceptUnknownHostKey: params.acceptUnknownHostKey === true })
    record.revision = 0

    return this.#sanitize(await this.#db.add(record))
  }

  /**
   * Partial update of an engine.
   *
   * - omitted (`undefined`) properties are kept, `null` or `''` clears them
   *   (resets `port` and `socketPath` to their defaults)
   * - changing a connection property (host, credentials…) closes the pooled
   *   connection and evicts the caches
   * - without `hostKeyFingerprint` after the update (e.g. it has been cleared
   *   with `null`), the TOFU flow of `createDockerEngine()` applies, with
   *   `acceptUnknownHostKey`
   *
   * @param {string} id
   * @param {object} properties see `createDockerEngine()`
   * @returns {Promise<object>} the updated engine, without secrets
   */
  async updateDockerEngine(id, properties = {}) {
    const previous = await this.#getEngineWithCredentials(id)
    const record = { ...previous }
    this.#applyProperties(record, properties)
    validateRecord(record)

    if (record.vm !== undefined && record.vm !== previous.vm) {
      await this.#assertNoEngineForVm(record.vm)
    }

    if (record.hostKeyFingerprint === undefined) {
      await this.#connectAndPin(record, { acceptUnknownHostKey: properties.acceptUnknownHostKey === true })
    }

    const identityChanged = IDENTITY_FIELDS.some(key => record[key] !== previous[key])
    const changed = Object.keys({ ...record, ...previous }).some(key => record[key] !== previous[key])
    if (changed) {
      if (identityChanged) {
        record.revision = (previous.revision ?? 0) + 1
      }
      await this.#db.update(record)
      if (identityChanged) {
        await this.#invalidate(id)
      }
    }
    return this.#sanitize(record)
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async deleteDockerEngine(id) {
    await this.#getEngineWithCredentials(id)
    await this.#db.remove(id)
    await this.#invalidate(id)
  }

  /**
   * Check the connection to an engine with a new, non pooled, connection.
   *
   * Never throws for connection problems. When the Docker socket cannot be
   * opened, a diagnostic tells apart the possible causes (see
   * `#probeSocket()`).
   *
   * @param {string} id
   * @returns {Promise<{ ok: boolean, apiVersion?: string, engineVersion?: string, fingerprint?: string, algorithm?: string, error?: object, diagnostic?: { code: string, message: string } }>}
   */
  async testDockerEngine(id) {
    const record = await this.#getEngineWithCredentials(id)
    const acceptUnknownHostKey = record.hostKeyFingerprint === undefined && !this.#config.strictHostKeyChecking
    let connection
    try {
      connection = this.#createConnection(record, { acceptUnknownHostKey })
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
      if (!isDockerError(error)) {
        throw error
      }
      const { fingerprint, algorithm } = connection?.observedHostKey ?? {}
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
   * @returns {Promise<object>}
   */
  async getDockerEngineInfo(id) {
    const record = await this.#getEngineWithCredentials(id)
    try {
      return await this.#withConnection(record, async connection => {
        const [{ body: info }, { body: version }, { body: composeContainers }] = await Promise.all([
          connection.request({ path: '/info' }),
          connection.request({ path: '/version' }),
          connection.request({
            path: '/containers/json',
            query: { all: 1, filters: { label: ['com.docker.compose.project'] } },
          }),
        ])
        // `id` is the daemon's ID, not to be confused with the engine's
        const { id: daemonId, ...engineInfo } = normalizeEngineInfo(info, version)
        return {
          status: 'connected',
          asOf: Date.now(),
          daemonId,
          ...engineInfo,
          // the version used by XO, `/version` gives the daemon's newest one
          apiVersion: connection.apiVersion,
          daemonApiVersion: version.ApiVersion,
          compose: summarizeCompose(composeContainers.map(normalizeContainerListEntry)),
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
   * @param {object} opts
   * @param {string[]} opts.engines ids of the engines
   * @param {boolean} [opts.all] include stopped containers
   * @param {boolean} [opts.stats] not supported yet
   * @param {boolean} [opts.forceRefresh] bypass the cache
   * @returns {Promise<{ containers: object[], errors: { $engine: string, $VM?: string, code: string, message: string }[], asOf: number }>}
   */
  async getDockerContainers({ engines, all = true, stats = false, forceRefresh = false } = {}) {
    if (!Array.isArray(engines)) {
      throw invalidParameters('engines must be an array of engine ids')
    }
    if (stats) {
      // TODO: stats sampler (sequencing step 8)
      throw invalidParameters('stats are not supported yet')
    }

    // fails early, before any connection, on an unknown engine
    const records = await Promise.all(Array.from(new Set(engines), id => this.#getEngineWithCredentials(id)))

    const containers = []
    const errors = []
    let asOf
    await asyncEach(
      records,
      async record => {
        try {
          const result = await this.#getEngineContainers(record, { all, forceRefresh })
          asOf = asOf === undefined ? result.asOf : Math.min(asOf, result.asOf)
          for (const { container } of result.containers.values()) {
            containers.push(this.#decorateContainer(record, container))
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
   * @returns {Promise<object>}
   */
  async getDockerContainer(id) {
    const { record, dockerId } = await this.#resolveContainerId(id)

    for (const all of [true, false]) {
      const cached = this.#cache.peek(this.#containersCacheKey(record, all))?.containers.get(dockerId)
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
      const container = normalizeContainerInspect(body)
      // the composite id must designate the container by its full id
      if (container.dockerId !== dockerId) {
        throw noSuchObject(id, 'docker-container')
      }
      return this.#decorateContainer(record, container)
    })
  }

  /**
   * Logs of a container, bounded: at most `tail` lines, and the response is
   * cut at `docker.maxLogsSize` bytes (`truncated: true`).
   *
   * @param {string} id composite id
   * @param {object} [opts]
   * @param {number} [opts.tail] number of lines from the end, default `docker.defaultLogsTail`, max `docker.maxLogsTail`
   * @param {number | string} [opts.since] ms since the epoch, or a date string
   * @param {number | string} [opts.until] ms since the epoch, or a date string
   * @param {boolean} [opts.stdout]
   * @param {boolean} [opts.stderr]
   * @param {boolean} [opts.timestamps]
   * @returns {Promise<{ entries: { timestamp?: string, stream: string, message: string }[], truncated: boolean, asOf: number }>}
   */
  async getDockerContainerLogs(
    id,
    { tail = this.#config.defaultLogsTail, since, until, stdout = true, stderr = true, timestamps = true } = {}
  ) {
    const { maxLogsSize, maxLogsTail } = this.#config
    if (!Number.isInteger(tail) || tail < 0 || tail > maxLogsTail) {
      throw invalidParameters(`tail must be an integer between 0 and ${maxLogsTail}`)
    }
    if (!stdout && !stderr) {
      throw invalidParameters('at least one of stdout and stderr must be requested')
    }
    const query = {
      // dockerd answers 400 without any of them: always ask for both, and
      // filter afterwards
      stdout: 1,
      stderr: 1,
      // always requested: without them, a message starting with something
      // looking like a timestamp would be mangled by the line parser
      timestamps: 1,
      tail,
      since: toDockerTimestamp('since', since),
      until: toDockerTimestamp('until', until),
    }

    const { record, dockerId } = await this.#resolveContainerId(id)
    const path = `/containers/${encodeURIComponent(dockerId)}`

    return this.#withConnection(record, async connection => {
      // the content type is only reliable from API 1.42, before that the TTY
      // setting of the container decides
      let tty
      if (connection.apiVersion === undefined || compareApiVersions(connection.apiVersion, '1.42') < 0) {
        tty = this.#cache.peek(this.#containersCacheKey(record, true))?.containers.get(dockerId)?.container.tty
        if (tty === undefined) {
          try {
            tty = normalizeContainerInspect((await connection.request({ path: path + '/json' })).body).tty
          } catch (error) {
            throw isNotFound(error) ? noSuchObject(id, 'docker-container') : error
          }
        }
      }

      const asOf = Date.now()
      const controller = new AbortController()
      let response
      try {
        response = await connection.requestStream({ path: path + '/logs', query, signal: controller.signal })
      } catch (error) {
        throw isNotFound(error) ? noSuchObject(id, 'docker-container') : error
      }

      const demuxer = createStdcopyDemuxer({
        tty: !isMultiplexedStream(response.headers['content-type'], tty, connection.apiVersion),
      })
      const parser = createLogLineParser()
      const entries = []
      const streams = new Set([stdout && 'stdout', stderr && 'stderr'])
      demuxer.pipe(parser)
      demuxer.on('error', error => parser.destroy(error))
      const collected = (async () => {
        for await (const entry of parser) {
          if (streams.has(entry.stream)) {
            entries.push(timestamps ? entry : { ...entry, timestamp: undefined })
          }
        }
      })()
      // awaited below, avoids an unhandled rejection meanwhile
      collected.catch(() => {})

      let truncated = false
      try {
        let size = 0
        for await (const chunk of response) {
          if (size + chunk.length > maxLogsSize) {
            demuxer.write(chunk.subarray(0, maxLogsSize - size))
            truncated = true
            break
          }
          size += chunk.length
          if (!demuxer.write(chunk)) {
            // rejects if the demuxer fails (e.g. invalid frame)
            await once(demuxer, 'drain')
          }
        }
      } finally {
        // stops reading the response (and frees the channel) when truncated
        response.destroy()
        controller.abort()
        demuxer.end()
      }
      await collected
      return { entries, truncated: truncated || demuxer.truncated, asOf }
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
   * @param {'start' | 'stop' | 'restart' | 'pause' | 'unpause'} action
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
    this.#cache.deleteByPrefix(`${record.id}:${record.revision ?? 0}:containers:`)
  }

  async #getEngineWithCredentials(id) {
    const record = typeof id === 'string' ? await this.#db.first(id) : undefined
    if (record === undefined) {
      throw noSuchObject(id, 'docker-engine')
    }
    return record
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
          }
        }
        continue
      }
      if (key === 'hostKeyFingerprint') {
        if (typeof value !== 'string') {
          throw invalidParameters('hostKeyFingerprint must be a string')
        }
        const fingerprint = normalizeFingerprint(value)
        if (fingerprint !== record.hostKeyFingerprint) {
          record.hostKeyFingerprint = fingerprint
          // the type of a pasted key is unknown
          delete record.hostKeyAlgorithm
        }
        continue
      }
      record[key] = value
    }
    if (properties.acceptUnknownHostKey !== undefined && typeof properties.acceptUnknownHostKey !== 'boolean') {
      throw invalidParameters('acceptUnknownHostKey must be a boolean')
    }
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

  #createConnection(record, { acceptUnknownHostKey = false } = {}) {
    const host = this.#resolveHost(record)
    if (host === undefined) {
      throw new DockerError(
        SSH_UNREACHABLE,
        'cannot determine the address of the Docker host: no host is configured and the VM reports no IP address',
        { data: { vm: record.vm } }
      )
    }
    const { connectTimeout, requestTimeout } = this.#config
    return new DockerConnection({
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
    const { fingerprint, algorithm } = connection.observedHostKey
    record.hostKeyFingerprint = fingerprint
    if (algorithm === undefined) {
      delete record.hostKeyAlgorithm
    } else {
      record.hostKeyAlgorithm = algorithm
    }
  }

  // used when a key has been accepted without strict host key checking
  async #pinHostKey(id, { fingerprint, algorithm }) {
    const record = await this.#db.first(id)
    if (record !== undefined && record.hostKeyFingerprint === undefined) {
      record.hostKeyFingerprint = fingerprint
      record.hostKeyAlgorithm = algorithm
      await this.#db.update(record)
    }
  }

  /**
   * Tell apart the causes of a DOCKER_SOCKET_UNREACHABLE, which OpenSSH reports
   * identically (channel open failure, reason 2): run a small script in an SSH
   * session channel.
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

  #withConnection(record, fn) {
    const acceptUnknownHostKey = record.hostKeyFingerprint === undefined && !this.#config.strictHostKeyChecking
    return this.#pool.use(
      record,
      () => this.#createConnection(record, { acceptUnknownHostKey }),
      async connection => {
        if (acceptUnknownHostKey && connection.observedHostKey !== undefined) {
          await this.#pinHostKey(record.id, connection.observedHostKey)
        }
        return fn(connection)
      }
    )
  }

  async #invalidate(id) {
    this.#cache.deleteByPrefix(id + ':')
    await this.#pool.invalidate(id)
  }

  #sanitize(record) {
    const engine = { id: record.id }
    if (record.vm !== undefined) {
      engine.$VM = record.vm
      const poolId = this.#getVm(record.vm)?.$pool
      if (poolId !== undefined) {
        engine.$pool = poolId
      }
    }
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
    const { status, error } = this.#pool.getState(record.id, record.revision)
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
    return `${record.id}:${record.revision ?? 0}:containers:${all ? 'all' : 'running'}`
  }

  /**
   * Tier 1 (the list) + tier 2 (inspection of the running containers), cached
   * per engine.
   *
   * @returns {Promise<{ asOf: number, containers: Map<string, { container: object, inspected: boolean }> }>}
   */
  #getEngineContainers(record, { all, forceRefresh }) {
    return this.#cache.get(
      this.#containersCacheKey(record, all),
      () =>
        this.#withConnection(record, async connection => {
          const { body } = await connection.request({ path: '/containers/json', query: { all: all ? 1 : 0 } })
          const asOf = Date.now()
          const containers = new Map()
          for (const entry of body) {
            const container = normalizeContainerListEntry(entry)
            containers.set(container.dockerId, { container, inspected: false })
          }

          const toInspect = Array.from(containers.values(), _ => _.container).filter(_ => INSPECTED_STATES.has(_.state))
          if (toInspect.length <= this.#config.inspectThreshold) {
            await asyncEach(
              toInspect,
              async listEntry => {
                let body
                try {
                  ;({ body } = await connection.request({ path: `/containers/${listEntry.dockerId}/json` }))
                } catch (error) {
                  // removed since the list: keep the list entry
                  if (isNotFound(error)) {
                    return
                  }
                  throw error
                }
                containers.set(listEntry.dockerId, {
                  container: mergeInspect(listEntry, normalizeContainerInspect(body)),
                  inspected: true,
                })
              },
              { concurrency: 10 }
            )
          }
          return { asOf, containers }
        }),
      { forceRefresh }
    )
  }

  #decorateContainer(record, container) {
    const decorated = { id: `${record.id}_${container.dockerId}`, $engine: record.id }
    if (record.vm !== undefined) {
      decorated.$VM = record.vm
      const poolId = this.#getVm(record.vm)?.$pool
      if (poolId !== undefined) {
        decorated.$pool = poolId
      }
    }
    return Object.assign(decorated, container)
  }
}
