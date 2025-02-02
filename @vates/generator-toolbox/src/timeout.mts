export class Timeout<T> implements AsyncGenerator {
  #source: AsyncGenerator<T>
  #timeout: number
  constructor(source, timeout: number) {
    this.#source = source
    this.#timeout = timeout
  }
  async next(): Promise<IteratorResult<T, any>> {
    let timeout
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
    return Promise.race([promiseNext, promiseTimeout]) as Promise<IteratorResult<T, any>>
  }
  return(value: any): Promise<IteratorResult<T, any>> {
    return this.#source.return(value)
  }
  throw(e: any): Promise<IteratorResult<T, any>> {
    return this.#source.throw(e)
  }
  async *[Symbol.asyncIterator](): AsyncGenerator<T, any, any> {
    while (true) {
      const res = await this.next()
      if (res.done) {
        break
      }
      yield res.value
    }
  }
}
