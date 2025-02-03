import { GeneratorThrottler } from './throttle.mts'
import { suite, test } from 'node:test'
import assert from 'node:assert'

async function* makeGenerator(chunkSize = 1024 * 1024, nbChunks = 100) {
  for (let i = 0; i < nbChunks; i++) {
    yield Buffer.allocUnsafe(chunkSize)
  }
}

async function consumes(generator) {
  for await (const data of generator) {
  }
}

suite('it throttle one', () => {
  test('base test', async () => {
    const generator = makeGenerator(1024 * 1024, 20)
    // 10MB/s
    const throttler = new GeneratorThrottler(10 * 1024 * 1024)
    const throttled = throttler.createThrottledGenerator(generator)

    let start = Date.now()
    await consumes(throttled)
    let end = Date.now()
    assert.strictEqual(Math.round((end - start) / 1000), 2)
  })
  test('variable speed test', async () => {
    const generator = makeGenerator(1024 * 1024, 20)
    // 10MB/s
    const throttler = new GeneratorThrottler(() => 10 * 1024 * 1024)
    const throttled = throttler.createThrottledGenerator(generator)

    let start = Date.now()
    await consumes(throttled)
    let end = Date.now()
    assert.strictEqual(Math.round((end - start) / 1000), 2)
  })
  test('multiple generator test', async () => {
    const generator = makeGenerator(1024 * 1024, 10)
    // 10MB/s
    const throttler = new GeneratorThrottler(10 * 1024 * 1024)
    const first = throttler.createThrottledGenerator(makeGenerator(1024 * 1024, 10))
    const second = throttler.createThrottledGenerator(makeGenerator(1024 * 1024, 10))
    let start = Date.now()

    await Promise.all([consumes(first), consumes(second)])
    let end = Date.now()
    assert.strictEqual(Math.round((end - start) / 1000), 2)
  })
})
