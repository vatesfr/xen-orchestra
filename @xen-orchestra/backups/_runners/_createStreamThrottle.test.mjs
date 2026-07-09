import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { Readable } from 'node:stream'

import createStreamThrottle from './_createStreamThrottle.mjs'

const makeStream = (chunks, props = {}) => {
  const stream = Readable.from(chunks)
  Object.assign(stream, props)
  return stream
}

const readAll = async stream => {
  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks.map(c => (typeof c === 'string' ? Buffer.from(c) : c))).toString()
}

describe('createStreamThrottle', () => {
  it('rate=0 returns identity, stream data and props intact', async () => {
    const throttleStream = createStreamThrottle(0)
    const stream = makeStream(['hello world'], { length: 11, maxStreamLength: 20 })
    const throttled = throttleStream(stream)
    assert.strictEqual(throttled, stream)
    assert.strictEqual(throttled.length, 11)
    assert.strictEqual(throttled.maxStreamLength, 20)
    assert.strictEqual(await readAll(throttled), 'hello world')
  })

  it('rate>0 passes data through and preserves length and maxStreamLength', async () => {
    const throttleStream = createStreamThrottle(1024 * 1024)
    const stream = makeStream(['hello world'], { length: 11, maxStreamLength: 20 })
    const throttled = throttleStream(stream)
    assert.strictEqual(throttled.length, 11)
    assert.strictEqual(throttled.maxStreamLength, 20)
    assert.strictEqual(await readAll(throttled), 'hello world')
  })

  it('rate>0 handles undefined length and maxStreamLength', async () => {
    const throttleStream = createStreamThrottle(1024 * 1024)
    const stream = makeStream(['hello world'])
    const throttled = throttleStream(stream)
    assert.strictEqual(throttled.length, undefined)
    assert.strictEqual(throttled.maxStreamLength, undefined)
    assert.strictEqual(await readAll(throttled), 'hello world')
  })

  // regression: maxStreamLength was lost after throttling, causing S3 to ignore it and cap at 50GB
  it('rate>0 preserves maxStreamLength so S3 can compute correct partSize', async () => {
    const throttleStream = createStreamThrottle(1024 * 1024)
    const stream = makeStream(['hello world'], { maxStreamLength: 11 })
    const throttled = throttleStream(stream)
    assert.strictEqual(throttled.maxStreamLength, 11)
    assert.strictEqual(await readAll(throttled), 'hello world')
  })
})
