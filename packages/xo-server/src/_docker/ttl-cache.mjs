/**
 * Cache of async results with a time to live.
 *
 * - concurrent `get()` of a missing key share the same pending promise
 * - rejections are not cached
 * - expired entries are only removed by `sweep()`, `delete()` or
 *   `deleteByPrefix()`: call `sweep()` periodically
 */
export class AsyncTtlCache {
  // key → { promise, value, expiresAt } (`expiresAt` undefined while pending)
  #entries = new Map()
  #expiresIn
  #now

  /**
   * @param {object} opts
   * @param {number} opts.expiresIn ms
   * @param {() => number} [opts.now] for tests
   */
  constructor({ expiresIn, now = Date.now }) {
    this.#expiresIn = expiresIn
    this.#now = now
  }

  get size() {
    return this.#entries.size
  }

  /**
   * @template T
   * @param {string} key
   * @param {() => Promise<T>} fn
   * @param {object} [opts]
   * @param {boolean} [opts.forceRefresh] ignore a cached value (a pending one is still shared)
   * @returns {Promise<T>}
   */
  get(key, fn, { forceRefresh = false } = {}) {
    const current = this.#entries.get(key)
    if (current !== undefined) {
      if (current.expiresAt === undefined) {
        return current.promise
      }
      if (!forceRefresh && current.expiresAt > this.#now()) {
        return current.promise
      }
    }

    const entry = { expiresAt: undefined, promise: undefined, value: undefined }
    entry.promise = (async () => fn())().then(
      value => {
        if (this.#entries.get(key) === entry) {
          entry.value = value
          entry.expiresAt = this.#now() + this.#expiresIn
        }
        return value
      },
      error => {
        if (this.#entries.get(key) === entry) {
          this.#entries.delete(key)
        }
        throw error
      }
    )
    this.#entries.set(key, entry)
    return entry.promise
  }

  /**
   * Value of a key if it is cached and not expired, without fetching it.
   *
   * @param {string} key
   * @returns {unknown}
   */
  peek(key) {
    const entry = this.#entries.get(key)
    if (entry !== undefined && entry.expiresAt !== undefined && entry.expiresAt > this.#now()) {
      return entry.value
    }
  }

  delete(key) {
    this.#entries.delete(key)
  }

  deleteByPrefix(prefix) {
    for (const key of Array.from(this.#entries.keys())) {
      if (key.startsWith(prefix)) {
        this.#entries.delete(key)
      }
    }
  }

  /** Remove expired entries. */
  sweep() {
    const now = this.#now()
    for (const [key, entry] of Array.from(this.#entries)) {
      if (entry.expiresAt !== undefined && entry.expiresAt <= now) {
        this.#entries.delete(key)
      }
    }
  }
}
