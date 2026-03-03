import assert from 'node:assert'

const TIMEOUT = Symbol('timeout')

export class Timeout<T> implements AsyncGenerator {
  #source: AsyncGenerator<T>
  #timeout: number
  constructor(source: AsyncGenerator<T>, timeout: number) {
    assert.ok(timeout > 0, `Timeout value must be positive, ${timeout} received`)
    this.#source = source
    this.#timeout = timeout
  }
  async next(): Promise<IteratorResult<T>> {
    let timeoutHandle: ReturnType<typeof setTimeout>

    const sourceNext = this.#source.next()
    const result = await Promise.race([
      sourceNext.then(res => {
        clearTimeout(timeoutHandle)
        return res
      }),
      new Promise<typeof TIMEOUT>(resolve => {
        timeoutHandle = setTimeout(() => resolve(TIMEOUT), this.#timeout)
      }),
    ])

    if (result === TIMEOUT) {
      // stop the source once the in-flight next settles to avoid data loss on the next call
      sourceNext.then(
        () => this.#source.return(undefined),
        () => {} // source already errored, nothing to clean up
      )
      throw new Error('Timeout reached')
    }

    return result
  }
  return(): Promise<IteratorResult<T>> {
    return this.#source.return(undefined)
  }
  throw(e: Error): Promise<IteratorResult<T>> {
    return this.#source.throw(e)
  }

  [Symbol.asyncIterator](): AsyncGenerator<T> {
    return this
  }
}
