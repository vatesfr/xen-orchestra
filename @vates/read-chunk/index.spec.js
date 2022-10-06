'use strict'

/* eslint-env jest */

const { Readable } = require('stream')

const { readChunk, readChunkStrict } = require('./')

const makeStream = it => Readable.from(it, { objectMode: false })
makeStream.obj = Readable.from

describe('readChunk', () => {
  it('returns null if stream is empty', async () => {
    expect(await readChunk(makeStream([]))).toBe(null)
  })

  it('returns null if the stream is already ended', async () => {
    const stream = await makeStream([])
    await readChunk(stream)

    expect(await readChunk(stream)).toBe(null)
  })

  describe('with binary stream', () => {
    it('returns the first chunk of data', async () => {
      expect(await readChunk(makeStream(['foo', 'bar']))).toEqual(Buffer.from('foo'))
    })

    it('returns a chunk of the specified size (smaller than first)', async () => {
      expect(await readChunk(makeStream(['foo', 'bar']), 2)).toEqual(Buffer.from('fo'))
    })

    it('returns a chunk of the specified size (larger than first)', async () => {
      expect(await readChunk(makeStream(['foo', 'bar']), 4)).toEqual(Buffer.from('foob'))
    })

    it('returns less data if stream ends', async () => {
      expect(await readChunk(makeStream(['foo', 'bar']), 10)).toEqual(Buffer.from('foobar'))
    })

    it('returns an empty buffer if the specified size is 0', async () => {
      expect(await readChunk(makeStream(['foo', 'bar']), 0)).toEqual(Buffer.alloc(0))
    })
  })

  describe('with object stream', () => {
    it('returns the first chunk of data verbatim', async () => {
      const chunks = [{}, {}]
      expect(await readChunk(makeStream.obj(chunks))).toBe(chunks[0])
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
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('stream has ended without data')
    expect(error.chunk).toEqual(undefined)
  })

  it('throws if stream ends with not enough data', async () => {
    const error = await rejectionOf(readChunkStrict(makeStream(['foo', 'bar']), 10))
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('stream has ended with not enough data')
    expect(error.chunk).toEqual(Buffer.from('foobar'))
  })
})
