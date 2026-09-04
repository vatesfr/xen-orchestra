/**
 * A minimal counting semaphore: bounds how many `run()`-wrapped tasks execute
 * at once, queueing the rest in FIFO order until a slot frees up.
 */
export class Semaphore {
  #available: number
  readonly #waiters: Array<() => void> = []

  constructor(concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency <= 0) {
      throw new Error(`concurrency must be a positive integer, got ${concurrency}`)
    }
    this.#available = concurrency
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.#available > 0) {
      this.#available--
    } else {
      await new Promise<void>(resolve => this.#waiters.push(resolve))
    }
    try {
      return await fn()
    } finally {
      const next = this.#waiters.shift()
      if (next !== undefined) {
        next()
      } else {
        this.#available++
      }
    }
  }
}
