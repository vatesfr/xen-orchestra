import { strict as assert } from 'node:assert'
import test from 'node:test'
import { Readable } from 'node:stream'

import { watchUploadProgress } from './_watchUploadProgress.mjs'

// drive `chunks` (an array of Buffers) through watchUploadProgress and resolve
// with the ordered list of reported progress values
async function run(chunks, length) {
  const values = []
  const stream = Readable.from(chunks)
  watchUploadProgress(stream, length, progress => values.push(progress))

  // watchUploadProgress pauses the stream: resume it like the real consumer does
  stream.resume()
  await new Promise((resolve, reject) => {
    stream.on('end', resolve)
    stream.on('error', reject)
  })
  return values
}

test('reports a final progress of exactly 1 once the stream ends', async () => {
  const values = await run([Buffer.alloc(50), Buffer.alloc(50)], 100)
  assert.equal(values.at(-1), 1)
})

test('every reported value is a fraction in [0, 1] and never decreases', async () => {
  const values = await run([Buffer.alloc(25), Buffer.alloc(25), Buffer.alloc(25), Buffer.alloc(25)], 100)
  assert.ok(values.length > 0)
  let previous = 0
  for (const value of values) {
    assert.ok(value >= 0 && value <= 1, `value ${value} out of range`)
    assert.ok(value >= previous, `value ${value} decreased from ${previous}`)
    previous = value
  }
})

test('a zero-length stream reports 1 without emitting NaN', async () => {
  const values = await run([], 0)
  assert.deepEqual(values, [1])
})

test('throttles intermediate updates below the min delta but always ends at 1', async () => {
  // 1-byte chunks over a 1000-byte total = 0.1% each: only the first is emitted
  // (subsequent ones are below the 1% threshold and within the time window),
  // then `end` forces the final 1
  const values = await run([Buffer.alloc(1), Buffer.alloc(1), Buffer.alloc(1)], 1000)
  assert.deepEqual(values, [0.001, 1])
})

test('caps the fraction at 1 even if more bytes than expected flow through', async () => {
  const values = await run([Buffer.alloc(80), Buffer.alloc(80)], 100)
  for (const value of values) {
    assert.ok(value <= 1, `value ${value} exceeded 1`)
  }
  assert.equal(values.at(-1), 1)
})
