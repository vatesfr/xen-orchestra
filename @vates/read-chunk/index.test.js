'use strict'

const { describe, it } = require('test')
const assert = require('node:assert').strict

const { Readable } = require('stream')

const { readChunk, readChunkStrict } = require('./')

const makeStream = it => Readable.from(it, { objectMode: false })
makeStream.obj = Readable.from

describe('readChunk', () => {
  it('returns null if stream is empty', async () => {
    assert.strictEqual(await readChunk(makeStream([])), null)
  })

  it('returns null if the stream is already ended', async () => {
    const stream = await makeStream([])
    await readChunk(stream)

    assert.strictEqual(await readChunk(stream), null)
  })

  describe('with binary stream', () => {
    it('returns the first chunk of data', async () => {
      assert.deepEqual(await readChunk(makeStream(['foo', 'bar'])), Buffer.from('foo'))
    })

    it('returns a chunk of the specified size (smaller than first)', async () => {
      assert.deepEqual(await readChunk(makeStream(['foo', 'bar']), 2), Buffer.from('fo'))
    })

    it('returns a chunk of the specified size (larger than first)', async () => {
      assert.deepEqual(await readChunk(makeStream(['foo', 'bar']), 4), Buffer.from('foob'))
    })

    it('returns less data if stream ends', async () => {
      assert.deepEqual(await readChunk(makeStream(['foo', 'bar']), 10), Buffer.from('foobar'))
    })

    it('returns an empty buffer if the specified size is 0', async () => {
      assert.deepEqual(await readChunk(makeStream(['foo', 'bar']), 0), Buffer.alloc(0))
    })
  })

  describe('with object stream', () => {
    it('returns the first chunk of data verbatim', async () => {
      const chunks = [{}, {}]
      assert.strictEqual(await readChunk(makeStream.obj(chunks)), chunks[0])
    })
  })
})

const rejectionOf = promise =>
  promise.then(
    value => {
      throw value
    },
    error => error
  )

describe('readChunkStrict', function () {
  it('throws if stream is empty', async () => {
    const error = await rejectionOf(readChunkStrict(makeStream([])))
    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended without data')
    assert.strictEqual(error.chunk, undefined)
  })

  it('throws if stream ends with not enough data', async () => {
    const error = await rejectionOf(readChunkStrict(makeStream(['foo', 'bar']), 10))
    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data')
    assert.deepEqual(error.chunk, Buffer.from('foobar'))
  })
})
