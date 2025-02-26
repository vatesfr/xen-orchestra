import assert from 'node:assert'
export class Timeout<T> implements AsyncGenerator {
  #source: AsyncGenerator<T>
  #timeout: number
  constructor(source: AsyncGenerator<T>, timeout: number) {
    assert.ok(timeout > 0, `Timeout value must be positive, ${timeout} received`)
    this.#source = source
    this.#timeout = timeout
  }
  async next(): Promise<IteratorResult<T>> {
    let timeout: ReturnType<typeof setTimeout>
    const promiseTimeout = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error('Timeout reached '))
      }, this.#timeout)
    })
    const promiseNext = new Promise((resolve, reject) => {
      this.#source.next().then(res => {
        // ensure timetout won't fire later
        clearTimeout(timeout)
        resolve(res)
      }, reject)
    })
    // promiseTimeout will never resolve
    return Promise.race([promiseNext, promiseTimeout]) as Promise<IteratorResult<T>>
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
