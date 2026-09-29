/**
 * Cache of async results with a time to live.
 *
 * - concurrent `get()` of a missing key share the same pending promise
 * - rejections are not cached
 * - expired entries are only removed by `sweep()`, `delete()` or
 *   `deleteByPrefix()`: call `sweep()` periodically
 * - a value fetched while its key is deleted is not cached (the caller still
 *   gets it)
 *
 * Not `lru-cache` (whose `fetch()` has the rest, with `ignoreFetchAbort`): its
 * `keys()` does not list pending fetches, so `deleteByPrefix()` could not drop
 * them, and a list fetched with an engine's previous credentials would be
 * cached after the credentials change (checked with lru-cache 11.5).
 */
type Entry = { promise: Promise<unknown>; value: unknown; expiresAt: number | undefined }

export class AsyncTtlCache {
  // key → { promise, value, expiresAt } (`expiresAt` undefined while pending)
  #entries = new Map<string, Entry>()
  #expiresIn: number
  #now: () => number

  /**
   * @param opts.expiresIn ms
   * @param opts.now for tests
   */
  constructor({ expiresIn, now = Date.now }: { expiresIn: number; now?: () => number }) {
    this.#expiresIn = expiresIn
    this.#now = now
  }

  get size() {
    return this.#entries.size
  }

  /**
   * The type of a cached value is not checked: a key must always be used with
   * functions returning the same type.
   *
   * @param opts.forceRefresh ignore a cached value (a pending one is still shared)
   */
  get<T>(key: string, fn: () => Promise<T>, { forceRefresh = false }: { forceRefresh?: boolean } = {}): Promise<T> {
    const current = this.#entries.get(key)
    if (current !== undefined) {
      if (current.expiresAt === undefined) {
        return current.promise as Promise<T>
      }
      if (!forceRefresh && current.expiresAt > this.#now()) {
        return current.promise as Promise<T>
      }
    }

    const entry: { expiresAt: number | undefined; promise: Promise<T>; value: T | undefined } = {
      expiresAt: undefined,
      // replaced right below, `entry` must exist before the callbacks run
      promise: undefined as unknown as Promise<T>,
      value: undefined,
    }
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
   */
  peek(key: string): unknown {
    const entry = this.#entries.get(key)
    if (entry !== undefined && entry.expiresAt !== undefined && entry.expiresAt > this.#now()) {
      return entry.value
    }
  }

  deleteByPrefix(prefix: string) {
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
