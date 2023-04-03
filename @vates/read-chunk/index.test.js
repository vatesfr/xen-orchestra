'use strict'

const { describe, it } = require('test')
const assert = require('node:assert').strict

const { Readable } = require('stream')

const { readChunk, readChunkStrict, skip, skipStrict } = require('./')

const makeStream = it => Readable.from(it, { objectMode: false })
makeStream.obj = Readable.from

const rejectionOf = promise =>
  promise.then(
    value => {
      throw value
    },
    error => error
  )

describe('readChunk', () => {
  it('rejects if size is less than or equal to 0', async () => {
    const error = await rejectionOf(readChunk(makeStream([]), 0))
    assert.strictEqual(error.code, 'ERR_ASSERTION')
  })

  it('rejects if size is greater than or equal to 1 GiB', async () => {
    const error = await rejectionOf(readChunk(makeStream([]), 1024 * 1024 * 1024))
    assert.strictEqual(error.code, 'ERR_ASSERTION')
  })

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
  })

  describe('with object stream', () => {
    it('returns the first chunk of data verbatim', async () => {
      const chunks = [{}, {}]
      assert.strictEqual(await readChunk(makeStream.obj(chunks)), chunks[0])
    })
  })
})

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

describe('skip', function () {
  it('returns 0 if size is 0', async () => {
    assert.strictEqual(await skip(makeStream(['foo']), 0), 0)
  })

  it('returns 0 if the stream is already ended', async () => {
    const stream = await makeStream([])
    await readChunk(stream)

    assert.strictEqual(await skip(stream, 10), 0)
  })

  it('skips a number of bytes', async () => {
    const stream = makeStream('foo bar')

    assert.strictEqual(await skip(stream, 4), 4)
    assert.deepEqual(await readChunk(stream, 4), Buffer.from('bar'))
  })

  it('returns less size if stream ends', async () => {
    assert.deepEqual(await skip(makeStream('foo bar'), 10), 7)
  })
})

describe('skipStrict', function () {
  it('throws if stream ends with not enough data', async () => {
    const error = await rejectionOf(skipStrict(makeStream('foo bar'), 10))

    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data')
    assert.deepEqual(error.bytesSkipped, 7)
  })
})
