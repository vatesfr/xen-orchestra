'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert').strict

const { Readable } = require('stream')

const StreamReader = require('./index.js')

const makeStream = it => Readable.from(it, { objectMode: false })
makeStream.obj = Readable.from

const rejectionOf = promise =>
  promise.then(
    value => {
      throw value
    },
    error => error
  )

const makeErrorTests = method => {
  it('rejects if the stream errors', async () => {
    const error = new Error()
    const stream = makeStream([])

    const pError = rejectionOf(new StreamReader(stream)[method](10))
    stream.destroy(error)

    assert.strict(await pError, error)
  })

  it('rejects if the stream has already errored', async () => {
    const error = new Error()
    const stream = makeStream([])

    await new Promise(resolve => {
      stream.once('error', resolve).destroy(error)
    })

    assert.strict(await rejectionOf(new StreamReader(stream)[method](10)), error)
  })
}

describe('read()', () => {
  it('rejects if size is less than or equal to 0', async () => {
    const error = await rejectionOf(new StreamReader(makeStream([])).read(0))
    assert.strictEqual(error.code, 'ERR_ASSERTION')
  })

  it('returns null if stream is empty', async () => {
    assert.strictEqual(await new StreamReader(makeStream([])).read(), null)
  })

  makeErrorTests('read')

  it('returns null if the stream is already ended', async () => {
    const reader = new StreamReader(makeStream([]))

    await reader.read()

    assert.strictEqual(await reader.read(), null)
  })

  describe('with binary stream', () => {
    it('returns the first chunk of data', async () => {
      assert.deepEqual(await new StreamReader(makeStream(['foo', 'bar'])).read(), Buffer.from('foo'))
    })

    it('returns a chunk of the specified size (smaller than first)', async () => {
      assert.deepEqual(await new StreamReader(makeStream(['foo', 'bar'])).read(2), Buffer.from('fo'))
    })

    it('returns a chunk of the specified size (larger than first)', async () => {
      assert.deepEqual(await new StreamReader(makeStream(['foo', 'bar'])).read(4), Buffer.from('foob'))
    })

    it('returns less data if stream ends', async () => {
      assert.deepEqual(await new StreamReader(makeStream(['foo', 'bar'])).read(10), Buffer.from('foobar'))
    })
  })

  describe('with object stream', () => {
    it('returns the first chunk of data verbatim', async () => {
      const chunks = [{}, {}]
      assert.strictEqual(await new StreamReader(makeStream.obj(chunks)).read(), chunks[0])
    })
  })
})

describe('readStrict()', function () {
  it('throws if stream is empty', async () => {
    const error = await rejectionOf(new StreamReader(makeStream([])).readStrict())
    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended without data')
    assert.strictEqual(error.chunk, undefined)
  })

  it('throws if stream ends with not enough data', async () => {
    const error = await rejectionOf(new StreamReader(makeStream(['foo', 'bar'])).readStrict(10))
    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data (actual: 6, expected: 10)')
    assert.deepEqual(error.chunk, Buffer.from('foobar'))
  })
})

describe('skip()', function () {
  makeErrorTests('skip')

  it('returns 0 if size is 0', async () => {
    assert.strictEqual(await new StreamReader(makeStream(['foo'])).skip(0), 0)
  })

  it('returns 0 if the stream is already ended', async () => {
    const reader = new StreamReader(makeStream([]))

    await reader.read()

    assert.strictEqual(await reader.skip(10), 0)
  })

  it('skips a number of bytes', async () => {
    const reader = new StreamReader(makeStream('foo bar'))

    assert.strictEqual(await reader.skip(4), 4)
    assert.deepEqual(await reader.read(4), Buffer.from('bar'))
  })

  it('returns less size if stream ends', async () => {
    assert.deepEqual(await new StreamReader(makeStream('foo bar')).skip(10), 7)
  })
})

describe('skipStrict()', function () {
  it('throws if stream ends with not enough data', async () => {
    const error = await rejectionOf(new StreamReader(makeStream('foo bar')).skipStrict(10))

    assert(error instanceof Error)
    assert.strictEqual(error.message, 'stream has ended with not enough data (actual: 7, expected: 10)')
    assert.deepEqual(error.bytesSkipped, 7)
  })
})
