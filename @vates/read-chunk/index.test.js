'use strict'

const { describe, it } = require('node:test')
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

const makeErrorTests = fn => {
  it('rejects if the stream errors', async () => {
    const error = new Error()
    const stream = makeStream([])

    const pError = rejectionOf(fn(stream, 10))
    stream.destroy(error)

    assert.strict(await pError, error)
  })

  // only supported for Node >= 18
  if (process.versions.node.split('.')[0] >= 18) {
    it('rejects if the stream has already errored', async () => {
      const error = new Error()
      const stream = makeStream([])

      await new Promise(resolve => {
        stream.once('error', resolve).destroy(error)
      })

      assert.strict(await rejectionOf(fn(stream, 10)), error)
    })
  }
}

describe('readChunk', () => {
  it('rejects if size is less than or equal to 0', async () => {
    const error = await rejectionOf(readChunk(makeStream([]), 0))
    assert.strictEqual(error.code, 'ERR_ASSERTION')
  })

  it('rejects if size is greater than or equal to 1 GiB', async () => {
    const error = await rejectionOf(readChunk(makeStream([]), 1024 * 1024 * 1024))
    assert.strictEqual(error.code, 'ERR_ASSERTION')
  })

  makeErrorTests(readChunk)

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

  it('throws if stream ends with not enough data, utf8', async () => {
    const error = await rejectionOf(readChunkStrict(makeStream(['foo', 'bar']), 10))
    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data (actual: 6, expected: 10)')
    assert.strictEqual(error.text, 'foobar')
    assert.deepEqual(error.chunk, Buffer.from('foobar'))
  })

  it('throws if stream ends with not enough data, non utf8 ', async () => {
    const source = [Buffer.alloc(10, 128), Buffer.alloc(10, 128)]
    const error = await rejectionOf(readChunkStrict(makeStream(source), 30))
    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data (actual: 20, expected: 30)')
    assert.strictEqual(error.text, undefined)
    assert.deepEqual(error.chunk, Buffer.concat(source))
  })

  it('throws if stream ends with not enough data,  utf8 , long data', async () => {
    const source = Buffer.from('a'.repeat(1500))
    const error = await rejectionOf(readChunkStrict(makeStream([source]), 2000))
    assert(error instanceof Error)
    assert.strictEqual(error.message, `stream has ended with not enough data (actual: 1500, expected: 2000)`)
    assert.strictEqual(error.text, undefined)
    assert.deepEqual(error.chunk, source)
  })

  it('succeed', async () => {
    const source = Buffer.from('a'.repeat(20))
    const chunk = await readChunkStrict(makeStream([source]), 10)
    assert.deepEqual(source.subarray(10), chunk)
  })
})

describe('skip', function () {
  makeErrorTests(skip)

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

  it('put back if it read too much', async () => {
    let source = makeStream(['foo', 'bar'])
    await skip(source, 1) // read part of data chunk
    const chunk = (await readChunkStrict(source, 2)).toString('utf-8')
    assert.strictEqual(chunk, 'oo')

    source = makeStream(['foo', 'bar'])
    assert.strictEqual(await skip(source, 3), 3) // read aligned with data chunk
  })
})

describe('skipStrict', function () {
  it('throws if stream ends with not enough data', async () => {
    const error = await rejectionOf(skipStrict(makeStream('foo bar'), 10))

    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data (actual: 7, expected: 10)')
    assert.deepEqual(error.bytesSkipped, 7)
  })
  it('succeed', async () => {
    const source = makeStream(['foo', 'bar', 'baz'])
    const res = await skipStrict(source, 4)
    assert.strictEqual(res, undefined)
  })
})
