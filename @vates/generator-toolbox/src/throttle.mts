import assert from 'node:assert'

/**
 *
 * This class will throttle the production of a group of generators
 *
 * limits: depends on the event loop, so don't expect it to be very precise
 * works better with more small blocks
 * The source generator must yield object with a length property
 * Changing the speed will only be takin into account fot the next packets asked
 */
export class Throttle {
  #previousSlot = 0
  #bytesPerSecond: number | (() => number)
  get speed(): number {
    let speed: number
    if (typeof this.#bytesPerSecond === 'function') {
      speed = this.#bytesPerSecond()
    } else {
      speed = this.#bytesPerSecond
    }
    assert.ok(speed > 0, `speed must be greater than zero, ${speed} computed`)
    return speed
  }
  constructor(speed: number | (() => number)) {
    this.#bytesPerSecond = speed
  }

  getNextSlot(length: number): { timeout?: ReturnType<typeof setTimeout>; promise?: Promise<unknown> } {
    assert.notStrictEqual(length, undefined, `throttled stream need to expose a length property }`)
    assert.ok(length > 0, `throttled stream must expose a positive length property , ${length} given }`)

    const previous = this.#previousSlot
    const nextSlot = Math.round(previous + (length * 1000) / this.speed)
    if (nextSlot < Date.now()) {
      // we're above the limit, go now
      this.#previousSlot = Date.now()
      return {}
    }
    this.#previousSlot = nextSlot
    // wait till the next slot
    // it won't be extremely precise since the event loop is not
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined
    const promise = new Promise(function (resolve) {
      timeout = setTimeout(resolve, nextSlot - Date.now())
    })
    return { promise, timeout }
  }

  async *createThrottledGenerator(source: AsyncGenerator<{ length: number }>): AsyncGenerator<{ length: number }> {
    let timeout: ReturnType<typeof setTimeout> | undefined
    try {
      for await (const value of source) {
        const res = this.getNextSlot(value.length)
        timeout = res.timeout
        // wait for the time slot before yielding the data
        if (res.promise !== undefined) {
          await res.promise
        }
        yield value
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
