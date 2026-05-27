/**
 * Time-based cache with in-flight call coalescing.
 *
 * `get()` returns the cached value while fresh; on miss it invokes the
 * supplied loader once and shares the same in-flight promise with any
 * concurrent caller until the loader settles. Keeps the parent process from
 * issuing redundant XAPI plugin calls when several Prometheus scrapes
 * overlap a cache miss.
 */
export class TtlCache<T> {
  #ttlMs: number
  #snapshot: { value: T; expiresAt: number } | undefined
  #inFlight: Promise<T> | undefined

  constructor(ttlMs: number) {
    this.#ttlMs = ttlMs
  }

  async get(load: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const snap = this.#snapshot
    if (snap !== undefined && snap.expiresAt > now) {
      return snap.value
    }
    if (this.#inFlight !== undefined) {
      return this.#inFlight
    }
    const pending = load()
      .then(value => {
        this.#snapshot = { value, expiresAt: Date.now() + this.#ttlMs }
        return value
      })
      .finally(() => {
        this.#inFlight = undefined
      })
    this.#inFlight = pending
    return pending
  }
}
