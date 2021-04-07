/* eslint-env jest */

const { Readable } = require('stream')

const { readChunk } = require('./')

const makeStream = it => Readable.from(it, { objectMode: false })
makeStream.obj = Readable.from

describe('readChunk', () => {
  it('returns null if stream is empty', async () => {
    expect(await readChunk(makeStream([]))).toBe(null)
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
