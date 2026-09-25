// Tier 3 of the container data (see the plan, §5): stats, never blocking.
//
// One sampler per engine, started by the first request asking for stats and
// stopped after `idleTimeout` without any reader. While alive, it holds one
// streaming `GET /containers/{id}/stats?stream=true` per running container (at
// most `maxContainers`) and keeps only the latest normalized sample of each:
// bounded memory, no history.
//
// dockerd pushes one JSON object per second per stream, each carrying its own
// `precpu_stats`, except the first one which has no previous sample
// (`cpuPercent: null`): a container is "pending" until its second sample.
//
// No XO concepts here: the caller provides `openStream()`, and tells which
// containers are running with `sync()` on each list refresh.

import { createLogger } from '@xen-orchestra/log'

import { DOCKER_API_ERROR, isDockerError, POOL_EXHAUSTED, TIMEOUT } from './errors.mjs'
import { normalizeContainerStats } from './normalize.mjs'

const { debug, warn } = createLogger('xo:docker:stats-sampler')

export const DEFAULT_IDLE_TIMEOUT = 90e3
export const DEFAULT_MAX_CONTAINERS = 100
// a stats object is a few KiB, even with many networks and block devices
export const DEFAULT_MAX_OBJECT_SIZE = 256 * 1024
// a container whose stream failed or ended is not reopened before this delay
export const DEFAULT_RETRY_DELAY = 5e3

// errors of one stream which do not concern the engine: the stream is dropped
// (and retried by a later `sync()` after `retryDelay`), the other streams are
// kept. Any other error (SSH failure, closed connection…) stops the sampler.
const isStreamError = error =>
  !isDockerError(error) || error.code === DOCKER_API_ERROR || error.code === TIMEOUT || error.code === POOL_EXHAUSTED

export class DockerStatsSampler {
  #failures = new Map() // Docker id → time after which it may be reopened
  #idleTimeout
  #idleTimer
  #lastRead
  #maxContainers
  #maxObjectSize
  #now
  #onStop
  #openStream
  #retryDelay
  #stopped = false
  #streams = new Map() // Docker id → { controller, stream, stats, samples }

  /**
   * @param {object} opts
   * @param {(dockerId: string, signal: AbortSignal) => Promise<import('node:stream').Readable>} opts.openStream
   *   opens `GET /containers/{id}/stats?stream=true` (newline-delimited JSON objects)
   * @param {number} [opts.idleTimeout] ms without `sync()`/`get()` after which the sampler stops
   * @param {number} [opts.maxContainers] max number of streams
   * @param {number} [opts.maxObjectSize] max size of one JSON object (bytes), the stream is dropped above
   * @param {number} [opts.retryDelay] ms before reopening the stream of a container after a failure or an end
   * @param {(error?: Error) => void} [opts.onStop] called once, with the error which stopped the sampler if any
   * @param {() => number} [opts.now] for tests
   */
  constructor({
    openStream,
    idleTimeout = DEFAULT_IDLE_TIMEOUT,
    maxContainers = DEFAULT_MAX_CONTAINERS,
    maxObjectSize = DEFAULT_MAX_OBJECT_SIZE,
    retryDelay = DEFAULT_RETRY_DELAY,
    onStop,
    now = Date.now,
  }) {
    this.#openStream = openStream
    this.#idleTimeout = idleTimeout
    this.#maxContainers = maxContainers
    this.#maxObjectSize = maxObjectSize
    this.#retryDelay = retryDelay
    this.#onStop = onStop
    this.#now = now
    this.#lastRead = now()
    this.#scheduleIdleCheck(idleTimeout)
  }

  /** @returns {boolean} */
  get stopped() {
    return this.#stopped
  }

  /** @returns {number} number of streams (opening or open) */
  get size() {
    return this.#streams.size
  }

  /**
   * Streams the given containers, and only them: new ones are opened (up to
   * `maxContainers`, the already streamed ones are kept first), the others are
   * closed.
   *
   * @param {Iterable<string>} dockerIds the running containers
   */
  sync(dockerIds) {
    if (this.#stopped) {
      return
    }
    this.#touch()

    const ids = Array.from(new Set(dockerIds))
    const now = this.#now()
    const wanted = new Set()
    // the containers already streamed are kept first, to avoid churn when the
    // cap is reached
    for (const id of ids) {
      if (this.#streams.has(id) && wanted.size < this.#maxContainers) {
        wanted.add(id)
      }
    }
    for (const id of ids) {
      if (wanted.size >= this.#maxContainers) {
        break
      }
      const retryAt = this.#failures.get(id)
      if (retryAt === undefined || retryAt <= now) {
        wanted.add(id)
      }
    }

    for (const id of Array.from(this.#streams.keys())) {
      if (!wanted.has(id)) {
        this.#close(id)
      }
    }
    // forget the failures of the containers which are gone
    for (const id of Array.from(this.#failures.keys())) {
      if (!ids.includes(id) || this.#failures.get(id) <= now) {
        this.#failures.delete(id)
      }
    }
    for (const id of wanted) {
      if (!this.#streams.has(id)) {
        this.#open(id)
      }
    }
  }

  /**
   * @param {string} dockerId
   * @returns {boolean} whether this container is streamed
   */
  has(dockerId) {
    return this.#streams.has(dockerId)
  }

  /**
   * Latest sample of a container.
   *
   * @param {string} dockerId
   * @returns {{ stats: object | undefined, pending: boolean } | undefined} `undefined` if not streamed, `pending`
   *   until the second sample (the first one has no CPU usage)
   */
  get(dockerId) {
    if (this.#stopped) {
      return
    }
    this.#touch()
    const entry = this.#streams.get(dockerId)
    if (entry === undefined) {
      return
    }
    return { stats: entry.stats, pending: entry.samples < 2 }
  }

  /**
   * Close every stream, the sampler cannot be used afterwards.
   *
   * @param {Error} [error] reason, passed to `onStop`
   */
  stop(error) {
    if (this.#stopped) {
      return
    }
    this.#stopped = true
    clearTimeout(this.#idleTimer)
    for (const id of Array.from(this.#streams.keys())) {
      this.#close(id)
    }
    this.#failures.clear()
    debug('stopped', { error })
    try {
      this.#onStop?.(error)
    } catch (error) {
      warn('onStop', { error })
    }
  }

  #touch() {
    this.#lastRead = this.#now()
  }

  #scheduleIdleCheck(delay) {
    this.#idleTimer = setTimeout(() => {
      const idle = this.#now() - this.#lastRead
      if (idle >= this.#idleTimeout) {
        debug('no reader, stopping')
        this.stop()
      } else {
        this.#scheduleIdleCheck(this.#idleTimeout - idle)
      }
    }, delay)
    this.#idleTimer.unref?.()
  }

  #close(id) {
    const entry = this.#streams.get(id)
    if (entry !== undefined) {
      this.#streams.delete(id)
      entry.controller.abort()
      entry.stream?.destroy()
    }
  }

  // the stream of a container failed or ended on its own
  #drop(id, entry, error) {
    if (this.#streams.get(id) !== entry) {
      return
    }
    this.#close(id)
    if (error !== undefined && !isStreamError(error)) {
      this.stop(error)
      return
    }
    this.#failures.set(id, this.#now() + this.#retryDelay)
    if (error !== undefined && !(isDockerError(error) && error.code === DOCKER_API_ERROR)) {
      debug('stats stream failed', { container: id, error })
    }
  }

  #open(id) {
    const entry = { controller: new AbortController(), stream: undefined, stats: undefined, samples: 0 }
    this.#streams.set(id, entry)
    this.#openStream(id, entry.controller.signal).then(
      stream => {
        if (this.#streams.get(id) !== entry) {
          // closed meanwhile
          stream.destroy()
          return
        }
        entry.stream = stream
        this.#consume(id, entry, stream)
      },
      error => {
        if (!entry.controller.signal.aborted) {
          this.#drop(id, entry, error)
        }
      }
    )
  }

  #consume(id, entry, stream) {
    let buffer = ''
    stream.setEncoding('utf8')
    stream.on('data', chunk => {
      buffer += chunk
      let index
      while ((index = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, index).trim()
        buffer = buffer.slice(index + 1)
        if (line === '') {
          continue
        }
        let stats
        try {
          stats = normalizeContainerStats(JSON.parse(line))
        } catch (error) {
          this.#drop(id, entry, new Error('invalid stats object', { cause: error }))
          return
        }
        entry.stats = stats
        ++entry.samples
      }
      if (buffer.length > this.#maxObjectSize) {
        this.#drop(id, entry, new Error('stats object too large'))
      }
    })
    // `close` is always emitted, after `error` if any: the stream ended
    // (container stopped) or its channel failed; if the whole connection is
    // gone, the next `openStream()` fails with CONNECTION_CLOSED (or an SSH
    // error) and stops the sampler
    stream.on('error', error => {
      debug('stats stream error', { container: id, error })
    })
    stream.on('close', () => this.#drop(id, entry))
  }
}
