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

import type { Readable } from 'node:stream'
import type { XoDockerContainerStats } from '@vates/types'
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
// dockerd sends one object per second: a daemon sending more (hostile or
// buggy) must not make us parse more, only the latest object is kept
export const DEFAULT_PARSE_INTERVAL = 1e3

// errors of one stream which do not concern the engine: the stream is dropped
// (and retried by a later `sync()` after `retryDelay`), the other streams are
// kept. Any other error (SSH failure, closed connection…) stops the sampler.
const isStreamError = (error: unknown): boolean =>
  !isDockerError(error) || error.code === DOCKER_API_ERROR || error.code === TIMEOUT || error.code === POOL_EXHAUSTED

type StreamEntry = {
  controller: AbortController
  stream: Readable | undefined
  stats: XoDockerContainerStats | undefined
  samples: number
  lastParse: number
  pendingLine: string | undefined
  parseTimer: NodeJS.Timeout | undefined
}

export type DockerStatsSamplerOptions = {
  /** opens `GET /containers/{id}/stats?stream=true` (newline-delimited JSON objects) */
  openStream: (dockerId: string, signal: AbortSignal) => Promise<Readable>
  /** ms without `sync()`/`get()` after which the sampler stops */
  idleTimeout?: number
  /** max number of streams */
  maxContainers?: number
  /**
   * max size of one JSON object (UTF-16 code units, roughly bytes), the stream is dropped above; checked on the
   * pending partial object plus each received chunk, before scanning
   */
  maxObjectSize?: number
  /**
   * min ms between two parsed objects of a stream, the latest one received in the meantime is parsed at the end of
   * the interval
   */
  parseInterval?: number
  /** ms before reopening the stream of a container after a failure or an end */
  retryDelay?: number
  /** called once, with the error which stopped the sampler if any */
  onStop?: (error?: unknown) => void
  /** for tests */
  now?: () => number
}

export class DockerStatsSampler {
  #failures = new Map<string, number>() // Docker id → time after which it may be reopened
  #idleTimeout: number
  #idleTimer: NodeJS.Timeout | undefined
  #lastRead: number
  #maxContainers: number
  #maxObjectSize: number
  #now: () => number
  #onStop: ((error?: unknown) => void) | undefined
  #openStream: (dockerId: string, signal: AbortSignal) => Promise<Readable>
  #parseInterval: number
  #retryDelay: number
  #stopped = false
  #streams = new Map<string, StreamEntry>() // Docker id → { controller, stream, stats, samples, lastParse, pendingLine, parseTimer }

  constructor({
    openStream,
    idleTimeout = DEFAULT_IDLE_TIMEOUT,
    maxContainers = DEFAULT_MAX_CONTAINERS,
    maxObjectSize = DEFAULT_MAX_OBJECT_SIZE,
    retryDelay = DEFAULT_RETRY_DELAY,
    parseInterval = DEFAULT_PARSE_INTERVAL,
    onStop,
    now = Date.now,
  }: DockerStatsSamplerOptions) {
    this.#openStream = openStream
    this.#idleTimeout = idleTimeout
    this.#maxContainers = maxContainers
    this.#maxObjectSize = maxObjectSize
    this.#retryDelay = retryDelay
    this.#parseInterval = parseInterval
    this.#onStop = onStop
    this.#now = now
    this.#lastRead = now()
    this.#scheduleIdleCheck(idleTimeout)
  }

  get stopped(): boolean {
    return this.#stopped
  }

  /** number of streams (opening or open) */
  get size(): number {
    return this.#streams.size
  }

  /**
   * Streams the given containers, and only them: new ones are opened (up to
   * `maxContainers`, the already streamed ones are kept first), the others are
   * closed.
   *
   * @param dockerIds the running containers
   */
  sync(dockerIds: Iterable<string>): void {
    if (this.#stopped) {
      return
    }
    this.#touch()

    const ids = Array.from(new Set(dockerIds))
    const now = this.#now()
    const wanted = new Set<string>()
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
      // `get(id)!`: `id` is a key
      if (!ids.includes(id) || this.#failures.get(id)! <= now) {
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
   * Latest sample of a container.
   *
   * @returns `undefined` if not streamed, `pending` until the second sample (the first one has no CPU usage)
   */
  get(dockerId: string): { stats: XoDockerContainerStats | undefined; pending: boolean } | undefined {
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
   * @param error reason, passed to `onStop`
   */
  stop(error?: unknown): void {
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

  #scheduleIdleCheck(delay: number): void {
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

  #close(id: string): void {
    const entry = this.#streams.get(id)
    if (entry !== undefined) {
      this.#streams.delete(id)
      clearTimeout(entry.parseTimer)
      entry.pendingLine = undefined
      entry.controller.abort()
      entry.stream?.destroy()
    }
  }

  // the stream of a container failed or ended on its own
  #drop(id: string, entry: StreamEntry, error?: unknown): void {
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

  #open(id: string): void {
    const entry: StreamEntry = {
      controller: new AbortController(),
      stream: undefined,
      stats: undefined,
      samples: 0,
      lastParse: -Infinity,
      pendingLine: undefined,
      parseTimer: undefined,
    }
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

  // parses the latest complete line received, unless one was parsed less than
  // `parseInterval` ago: it is then parsed at the end of the interval (unless a
  // newer one replaces it meanwhile)
  #parse(id: string, entry: StreamEntry): void {
    const line = entry.pendingLine
    if (line === undefined || this.#streams.get(id) !== entry) {
      return
    }
    const wait = entry.lastParse + this.#parseInterval - this.#now()
    if (wait > 0) {
      if (entry.parseTimer === undefined) {
        entry.parseTimer = setTimeout(() => {
          entry.parseTimer = undefined
          this.#parse(id, entry)
        }, wait)
        entry.parseTimer.unref?.()
      }
      return
    }
    entry.pendingLine = undefined
    entry.lastParse = this.#now()
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

  #consume(id: string, entry: StreamEntry, stream: Readable): void {
    // partial line after the last newline received
    let buffer = ''
    stream.setEncoding('utf8')
    // strings: the encoding is set
    stream.on('data', (chunk: string) => {
      // checked before any scanning: a daemon cannot make us buffer or scan
      // more than the cap, whatever the number of lines (a legitimate stream
      // sends a few KiB per second, and a chunk is at most 64 KiB)
      if (buffer.length + chunk.length > this.#maxObjectSize) {
        this.#drop(id, entry, new Error('stats object too large'))
        return
      }
      // only the latest complete line matters: the objects before it are
      // older samples, never parsed
      const last = chunk.lastIndexOf('\n')
      if (last === -1) {
        buffer += chunk
        return
      }
      const previous = chunk.lastIndexOf('\n', last - 1)
      const line = (previous === -1 ? buffer + chunk.slice(0, last) : chunk.slice(previous + 1, last)).trim()
      buffer = chunk.slice(last + 1)
      if (line !== '') {
        entry.pendingLine = line
        this.#parse(id, entry)
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
