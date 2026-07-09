import { closeSync, mkdirSync, openSync, renameSync, rmdirSync, unlinkSync, writeFileSync, writeSync } from 'node:fs'
import { createLogger } from '@xen-orchestra/log'
import { join } from 'node:path'
import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { serializeError } from '@vates/task'
import stringify from 'json-stringify-safe'

const log = createLogger('xo:rpu-observability')

const DEFAULT_TRACES_RETENTION = 31 * 24 * 60 * 60 * 1000
const HEARTBEAT_INTERVAL = 5e3
const SENSITIVE_KEY_RE = /password|token|secret|credential|authorization|session|api[-_]?key/i

const activeTraces = new Set()

/**
 * Resolves the traces directory and retention from the server configuration.
 *
 * @param {object} app - The xo-server instance (uses `app.config`)
 * @returns {{ dir: string, retention: number }} Traces directory and retention in milliseconds
 */
export function getRpuTracesConfig(app) {
  return {
    dir: app.config.getOptional('rpu.tracesDir') ?? join(app.config.get('datadir'), 'rpu-traces'),
    retention: app.config.getOptionalDuration('rpu.tracesRetention') ?? DEFAULT_TRACES_RETENTION,
  }
}

/**
 * `JSON.stringify` replacer: serializes errors, converts BigInt and scrubs
 * secret-looking keys since the trace contains debug-level data.
 *
 * Use with `json-stringify-safe` which breaks real cycles only: an object
 * referenced twice is serialized twice, not flagged as circular.
 *
 * @param {string} key
 * @param {any} value
 * @returns {any}
 */
export function replacer(key, value) {
  if (key !== '' && SENSITIVE_KEY_RE.test(key)) {
    return '[REDACTED]'
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value instanceof Error) {
    return serializeError(value)
  }
  return value
}

/**
 * Creates the trace and heartbeat files for one RPU/RPR run.
 *
 * @param {object} params
 * @param {string} params.dir - Directory where the files are created
 * @param {'rpu'|'rpr'} params.kind - Kind of operation, used as file name prefix
 * @param {string} params.poolId - Identifier of the target pool
 * @returns {{ traceFile: string, heartbeatFile: string, attach: (task: object) => void, stop: () => void } | undefined}
 *   `undefined` if the files cannot be created (observability is optional)
 */
export function openRpuTrace({ dir, kind, poolId }) {
  let base, fd, heartbeatFile, traceFile
  try {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '')
    base = `${kind}-${String(poolId).replace(/[^a-zA-Z0-9-]/g, '')}-${timestamp}`
    mkdirSync(dir, { recursive: true, mode: 0o700 })
    traceFile = join(dir, base + '.ndjson')
    heartbeatFile = join(dir, base + '.heartbeat.json')
    fd = openSync(traceFile, 'ax', 0o600)
  } catch (error) {
    try {
      log.warn('could not create RPU trace files, continuing without observability', { error, dir })
    } catch {}
    // best effort cleanup of anything created before the failure
    if (fd !== undefined) {
      try {
        closeSync(fd)
      } catch {}
      try {
        unlinkSync(traceFile)
      } catch {}
    }
    try {
      rmdirSync(dir) // only succeeds if the dir is empty
    } catch {}
    return
  }

  activeTraces.add(base)

  let beat
  let interval
  let stopped = false
  let writeErrorLogged = false
  const onWriteError = error => {
    if (!writeErrorLogged) {
      writeErrorLogged = true
      try {
        log.warn('failed to write RPU trace, observability is degraded', { error, traceFile })
      } catch {}
    }
  }

  return {
    heartbeatFile,
    traceFile,

    attach(task) {
      const inner = task._onProgress
      task._onProgress = event => {
        if (!stopped) {
          try {
            let sanitized = event
            if (event.type === 'property' && SENSITIVE_KEY_RE.test(event.name)) {
              sanitized = { ...event, value: '[REDACTED]' }
            }
            writeSync(fd, stringify(sanitized, replacer) + '\n')
          } catch (error) {
            onWriteError(error)
          }
        }
        inner(event)
      }

      beat = () => {
        try {
          const tmp = heartbeatFile + '.tmp'
          writeFileSync(
            tmp,
            JSON.stringify({
              lastUpdated: new Date().toISOString(),
              status: task.status,
              ...(writeErrorLogged && { degraded: true }),
            }) + '\n',
            { mode: 0o600 }
          )
          renameSync(tmp, heartbeatFile)
        } catch (error) {
          onWriteError(error)
        }
      }
      beat()
      interval = setInterval(beat, HEARTBEAT_INTERVAL)
      interval.unref()

      try {
        task.set('traceFile', traceFile)
      } catch {}
    },

    stop() {
      if (!stopped) {
        stopped = true
        activeTraces.delete(base)
        clearInterval(interval)
        if (beat !== undefined) {
          beat()
        }
        try {
          closeSync(fd)
        } catch (error) {
          onWriteError(error)
        }
      }
    },
  }
}

/**
 * Reconciles the heartbeats of interrupted runs at boot: a heartbeat left
 * `pending` on disk cannot belong to a running operation anymore since
 * xo-server just started.
 *
 * Never throws: errors are logged and the remaining files are still processed.
 *
 * @param {string} dir - Traces directory
 * @returns {Promise<void>}
 */
export async function reconcileRpuTraces(dir) {
  let names
  try {
    names = await readdir(dir)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      try {
        log.warn('could not list RPU traces for reconciliation', { error, dir })
      } catch {}
    }
    return
  }

  for (const name of names) {
    const isHeartbeat = /^rp[ru]-.*\.heartbeat\.json$/.test(name)
    const isActive = [...activeTraces].some(base => name.startsWith(base))
    if (isHeartbeat && !isActive) {
      const path = join(dir, name)
      try {
        const heartbeat = JSON.parse(await readFile(path, 'utf8'))
        if (heartbeat.status === 'pending') {
          await writeFile(
            path,
            JSON.stringify({
              lastUpdated: new Date().toISOString(),
              status: 'interrupted',
              lastAlive: heartbeat.lastUpdated,
            }) + '\n',
            { mode: 0o600 }
          )
          const traceFile = join(dir, name.replace(/\.heartbeat\.json$/, '.ndjson'))
          log.info(`interrupted RPU/RPR detected (last alive ${heartbeat.lastUpdated}): trace in ${traceFile}`)
        }
      } catch (error) {
        try {
          log.warn('could not reconcile RPU heartbeat', { error, path })
        } catch {}
      }
    }
  }
}

/**
 * Deletes the trace/heartbeat files older than the retention, skipping the
 * traces still being written.
 *
 * Never throws: errors are logged and the remaining files are still processed.
 *
 * @param {string} dir - Traces directory
 * @param {number} retention - Max age in milliseconds
 * @returns {Promise<void>}
 */
export async function gcRpuTraces(dir, retention) {
  let names
  try {
    names = await readdir(dir)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      try {
        log.warn('could not list RPU traces for GC', { error, dir })
      } catch {}
    }
    return
  }

  const limit = Date.now() - retention
  for (const name of names) {
    const isTraceFile = /^rp[ru]-.*\.(ndjson|heartbeat\.json(\.tmp)?)$/.test(name)
    const isActive = [...activeTraces].some(base => name.startsWith(base))
    if (isTraceFile && !isActive) {
      const path = join(dir, name)
      try {
        if ((await stat(path)).mtimeMs < limit) {
          await unlink(path)
        }
      } catch (error) {
        try {
          log.warn('could not GC RPU trace file', { error, path })
        } catch {}
      }
    }
  }
}
