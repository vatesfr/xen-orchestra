import assert from 'node:assert'

export class Synchronized<T, TReturn, TNext> {
  #source: AsyncGenerator<T, TReturn, TNext>
  #forks = new Map<string, Forked<T, TReturn, TNext>>()
  #removedForks = new Set<string>()
  #waitingForks = new Set<string>()
  #started = false

  #nextValueForksReady?: {
    promise: Promise<IteratorResult<T>>
    forksWaitingReject: (error: Error) => void
    forksWaitingResolve: () => void
  }

  constructor(source: AsyncGenerator<T, TReturn, TNext>) {
    this.#source = source
  }

  fork(uid: string): AsyncGenerator {
    assert.strictEqual(this.#started, false, `can't create a fork after consuming the data`)
    const fork = new Forked<T, TReturn, TNext>(this, uid)
    this.#forks.set(uid, fork)
    return fork
  }

  async #resolveWhenAllForksReady(): Promise<IteratorResult<T>> {
    if (!this.#nextValueForksReady) {
      throw new Error('Can t wait forks if there are noone waiting')
    }
    const { promise, forksWaitingResolve } = this.#nextValueForksReady
    if (this.#waitingForks.size === this.#forks.size) {
      // reset value
      this.#waitingForks.clear()
      this.#nextValueForksReady = undefined
      forksWaitingResolve() // for the other forks waiting
    }
    return promise
  }

  async next(uid: string): Promise<IteratorResult<T>> {
    if (this.#removedForks.has(uid)) {
      return { done: true, value: undefined }
    }
    if (!this.#forks.has(uid)) {
      throw new Error(`trying to advance fork ${uid} that is not a fork of this one`)
    }

    if (this.#waitingForks.has(uid)) {
      throw new Error(`Fork ${uid} is already waiting`)
    }

    this.#started = true
    if (this.#nextValueForksReady === undefined) {
      let forksWaitingResolve = () => {}
      let forksWaitingReject: (reason?: Error) => void = () => {}
      const next = this.#source.next().catch(async error => {
        const e = new Error(`Error in the source generator ${error.message}`, { cause: error })
        forksWaitingReject(e)
        // source has failed, kill everything, and stop the forks
        for (const uid of [...this.#forks.keys()]) {
          await this.remove(uid, error)
        }
      })
      const promise = Promise.all([
        next,
        new Promise((_resolve, _reject) => {
          forksWaitingResolve = () => _resolve(undefined)
          forksWaitingReject = _reject
        }),
      ]).then(([_]) => _ as IteratorResult<T>)

      this.#nextValueForksReady = { promise, forksWaitingResolve, forksWaitingReject }
    }
    this.#waitingForks.add(uid)
    return this.#resolveWhenAllForksReady()
  }

  async remove(uid: string, error?: Error): Promise<IteratorResult<T>> {
    const fork = this.#forks.get(uid)
    if (fork === undefined) {
      if (this.#removedForks.has(uid)) {
        // already removed
        return { done: true, value: undefined }
      }
      throw new Error(`trying to remove fork wih uid ${uid} that is not a fork of this one`)
    }
    this.#forks.delete(uid)
    this.#waitingForks.delete(uid)
    this.#removedForks.add(uid)
    try {
      if (error === undefined) {
        await fork.return()
      } else {
        await fork.throw(error)
      }
    } catch (cleaningError) {
      console.error('Error while cleaning the forked', {
        cleaningError,
        sourceError: error,
      })
    }

    if (this.#forks.size === 0) {
      if (error === undefined) {
        await this.#source.return(undefined as TReturn)
      } else {
        await this.#source.throw(error)
      }
      // Reject any pending forks waiting for the next value
      if (this.#nextValueForksReady) {
        this.#nextValueForksReady.forksWaitingReject(new Error('Source generator terminated.', { cause: error }))
        this.#nextValueForksReady = undefined
      }
    } else {
      // this fork was maybe blocking the others
      if (this.#nextValueForksReady) {
        await this.#resolveWhenAllForksReady()
      }
    }
    return { done: true, value: undefined }
  }
}

class Forked<T, TReturn, TNext> implements AsyncGenerator<T, TReturn, TNext> {
  #parent: Synchronized<T, TReturn, TNext>
  #uid: string
  constructor(parent: Synchronized<T, TReturn, TNext>, uid: string) {
    this.#parent = parent
    this.#uid = uid
  }
  next(): Promise<IteratorResult<T>> {
    return this.#parent.next(this.#uid)
  }
  async return(): Promise<IteratorResult<T>> {
    return this.#parent.remove(this.#uid)
  }
  async throw(e: Error): Promise<IteratorResult<T>> {
    return this.#parent.remove(this.#uid, e)
  }
  async *[Symbol.asyncIterator](): AsyncGenerator<T, TReturn, TNext> {
    while (true) {
      const res = await this.next()
      if (res.done) {
        break
      }
      yield res.value
    }
    return undefined as TReturn
  }
}
