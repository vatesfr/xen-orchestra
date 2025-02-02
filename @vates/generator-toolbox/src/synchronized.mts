export class Synchronized<T> {
  #source: AsyncGenerator<T>
  #forks = new Map<string, Forked<T>>()
  #waitingForks = new Set<string>()

  #nextValueForksReady?: {
    promise: Promise<IteratorResult<T>>
    forksWaitingReject: (error: Error) => void
    forksWaitingResolve: () => void
  }

  constructor(source: AsyncGenerator<T>) {
    this.#source = source
  }

  fork(uid: string): AsyncGenerator {
    const fork = new Forked<T>(this, uid)
    this.#forks.set(uid, fork)
    return fork
  }

  async #resolveWhenAllForksReady(): Promise<IteratorResult<T, any>> {
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

  async next(uid: string): Promise<IteratorResult<T, any>> {
    if (this.#nextValueForksReady === undefined) {
      let forksWaitingResolve = () => {}
      let forksWaitingReject = (reason?: Error) => {}
      const next = this.#source.next().catch(async error => {
        forksWaitingReject(error)
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

  async remove(uid: string, error?: Error) {
    let wasStillHere = this.#forks.has(uid)
    this.#forks.delete(uid)
    this.#waitingForks.delete(uid)
    if (wasStillHere) {
      if (error === undefined) {
        await this.#forks.get(uid)?.return(undefined)
      } else {
        await this.#forks.get(uid)?.throw(error)
      }
    }
    if (this.#forks.size === 0) {
      if (error === undefined) {
        await this.#source.return(undefined)
      } else {
        await this.#source.throw(error)
      }
      // @todo should we also fails the nextValueForksReady promise ?
    } else {
      // this fork was maybe blocking the others
      if (this.#nextValueForksReady) {
        await this.#resolveWhenAllForksReady()
      }
    }
  }
}

class Forked<T> implements AsyncGenerator {
  #parent: Synchronized<T>
  #uid: string
  #done = false
  constructor(parent: Synchronized<T>, uid: string) {
    this.#parent = parent
    this.#uid = uid
  }
  next(...[value]: [] | [any]): Promise<IteratorResult<unknown, any>> {
    if (this.#done === true) {
      return Promise.resolve({ done: true, value: undefined })
    }
    return this.#parent.next(this.#uid)
  }
  async return(value: any): Promise<IteratorResult<unknown, any>> {
    this.#done = true
    await this.#parent.remove(this.#uid)
    return { done: true, value: undefined }
  }
  async throw(e: Error): Promise<IteratorResult<unknown, any>> {
    this.#done = true
    await this.#parent.remove(this.#uid, e)
    return { done: true, value: undefined }
  }
  async *[Symbol.asyncIterator](): AsyncGenerator<unknown, any, any> {
    while (true) {
      let res = await this.next()
      if (this.#done || res.done) {
        break
      }
      yield res.value
    }
  }
}
