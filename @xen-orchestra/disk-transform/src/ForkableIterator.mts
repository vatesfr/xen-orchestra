import assert from 'node:assert'

export class ForkableIterator<T> {
  #forks = new Set<ForkedIterator<T>>()
  #source: AsyncIterator<T>

  #started = false

  #forksWaiting = new Set<ForkedIterator<T>>()
  #promiseWaitingForForks?: {
    promise: Promise<void>
    resolve(): void
    reject(err: Error): void
  }
  #promiseWaitingForNext?: Promise<IteratorResult<T>>

  constructor(source: AsyncIterator<T>) {
    if (typeof source[Symbol.asyncIterator] !== 'function') {
      throw new Error('Source must be an async iterator')
    }
    this.#source = source
  }

  fork(): ForkedIterator<T> {
    assert.notEqual(this.#started, true, 'Can t be forked once started')
    const fork = new ForkedIterator(this)
    this.#forks.add(fork)
    return fork
  }

  async #waitForAllForks(): Promise<void> {
    // first fork waiting for the data
    if (this.#promiseWaitingForForks === undefined) {
      let resolve = () => {}
      let reject: (err: Error) => void = () => {}
      const promise = new Promise<void>(function (_resolve, _reject) {
        resolve = _resolve
        reject = _reject
      })

      this.#promiseWaitingForForks = { promise, resolve, reject }
    }
    // all the forks are waiting
    const { promise, resolve } = this.#promiseWaitingForForks
    if (this.#forksWaiting.size === this.#forks.size) {
      // reset data
      this.#promiseWaitingForForks = undefined
      this.#forksWaiting = new Set()
      resolve() // mark the wait of the other forks as over
    }
    return promise
  }

  async next(fork: ForkedIterator<T>): Promise<IteratorResult<T>> {
    // ensure a fork can't wait twice
    assert.strictEqual(this.#forksWaiting.has(fork), false, 'fork is already waiting')
    assert.strictEqual(this.#forks.has(fork), true, 'fork is not from this source')
    this.#forksWaiting.add(fork)
    this.#started = true

    // ask for value only once for the first fork asking
    if (this.#promiseWaitingForNext === undefined) {
      this.#promiseWaitingForNext = this.#source.next()
    }
    // keep a copy of the promise locally since it may be removed from other forks
    const nextValue = this.#promiseWaitingForNext?.catch(err => {
      // handle the error and ensure it is thrown from an awaited place
      // ( the call to waitForAllForks)
      this.#promiseWaitingForForks?.reject(err)
    }) as Promise<IteratorResult<T>>
    await this.#waitForAllForks()
    // ready to ask for a new value
    this.#promiseWaitingForNext = undefined
    return nextValue
  }

  remove(fork: ForkedIterator<T>) {
    assert.ok(this.#forks.has(fork))
    this.#forks.delete(fork)
    // this fork may be waiting, blocking the others
    this.#forksWaiting.delete(fork)

    // removing a fork can free the data to flow again
    if (this.#forksWaiting.size === this.#forks.size && this.#promiseWaitingForForks !== undefined) {
      const { resolve } = this.#promiseWaitingForForks
      this.#promiseWaitingForForks = undefined
      this.#forksWaiting = new Set()
      resolve() // mark the wait of the other forks as over
    }
  }
}

class ForkedIterator<T> {
  #parent: ForkableIterator<T>
  constructor(parent: ForkableIterator<T>) {
    this.#parent = parent
  }

  async *[Symbol.asyncIterator]() {
    let res: IteratorResult<T>
    do {
      res = await this.#parent.next(this)
      console.log({ res })
      yield res.value
    } while (!res.done)
  }

  destroy() {
    this.#parent.remove(this)
  }
}

async function* makeRangeIterator(start = 0, end = Infinity, step = 1) {
  let iterationCount = 0
  for (let i = start; i < end; i += step) {
    iterationCount++
    await new Promise(resolve => setTimeout(resolve, 100))
    if (Math.random() > 0.5) {
      //  throw new Error('fuck')
    }
    yield i
  }
}

const source = makeRangeIterator(0, 5)
const forkable = new ForkableIterator(source)
const fork1 = forkable.fork()
const fork2 = forkable.fork()

async function consume(iterable, label) {
  console.log('consume')
  try {
    for await (const val of iterable) {
      console.log({ val, label })
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2500))
    }
  } catch (err) {
    console.error(label, err)
  }
  console.log('consumed', label)
}

await Promise.all([consume(fork1, 'A'), consume(fork2, 'B')])

console.log('done')
