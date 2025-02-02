import assert from 'node:assert'
type WithLength = {
  length: number
}

class ThrottleAware<T> implements AsyncGenerator {
  #source: AsyncGenerator
  #throttler: GeneratorThrottler
  #timeouts = new Set<ReturnType<typeof setTimeout>>()
  constructor(source: AsyncGenerator, throttler: GeneratorThrottler) {
    this.#source = source
    this.#throttler = throttler
  }
  // passthrough to the source generator
  next(): Promise<IteratorResult<unknown, any>> {
    return this.#source.next()
  }

  // wait for a slot from throttler before yielding the data
  async *[Symbol.asyncIterator](): AsyncGenerator {
    while (true) {
      const res = await this.next()
      if (res.done) {
        break
      }
      const value = res.value as WithLength
      const { interval, promise } = this.#throttler.getNextSlot(value.length)
      if (interval !== undefined) {
        this.#timeouts.add(interval)
        await promise
      }
      yield res.value
    }
  }
  // cleanup waiting and passthrough to the source iterator
  throw(err: Error) {
    this.#timeouts.forEach(timeout => clearTimeout(timeout))
    return this.#source.throw(err)
  }
  // cleanup waiting and passthrough to the source iterator

  return(value: any) {
    this.#timeouts.forEach(timeout => clearTimeout(timeout))
    return this.#source.return(value)
  }
}

/**
 *
 * This class will throttle the production of a group of generators
 *
 * limits: depends on the event loop, so don't expect it to be very precise
 * works better with more small blocks
 * The source generator must yield object with a length property
 * Changing the speed will only be takin into account fot the next packets asked
 *
 */
export class GeneratorThrottler {
  #previousSlot = 0
  #bytesPerSecond: number | (() => number)
  get speed(): number {
    let speed
    if (typeof this.#bytesPerSecond === 'function') {
      speed = this.#bytesPerSecond()
    } else {
      speed = this.#bytesPerSecond
    }
    assert.ok(speed > 0, `speed must be greate than zero, ${speed} computed`)
    return speed
  }
  constructor(speed: number | (() => number)) {
    this.#bytesPerSecond = speed
  }

  getNextSlot(length: number): { interval?: ReturnType<typeof setTimeout>; promise: Promise<void> } {
    assert.notStrictEqual(length, undefined, `throttled stream need to expose a length property }`)
    assert.ok(length > 0, `throttled stream must expose a positive length property , ${length} given }`)

    const previous = this.#previousSlot
    let nextSlot = Math.round(previous + (length * 1000) / this.speed)
    if (nextSlot < Date.now()) {
      // we're above the limmit, go now
      this.#previousSlot = Date.now()
      return { promise: Promise.resolve() }
    }
    this.#previousSlot = nextSlot
    // wait till the next slot
    // it won't be extremely precise since the event loop is not
    let interval: ReturnType<typeof setTimeout> | undefined = undefined
    const promise = new Promise(function (resolve) {
      interval = setTimeout(resolve, nextSlot - Date.now())
    }) as Promise<void>
    return { promise, interval }
  }

  createThrottledGenerator(source: AsyncGenerator): AsyncGenerator {
    return new ThrottleAware(source, this)
  }
}
