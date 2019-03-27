import assert from 'assert'
import { Transform } from 'stream'
import { pipeline } from 'readable-stream'

import checkFooter from './_checkFooter'
import checkHeader from './_checkHeader'
import getFirstAndLastBlocks from './_getFirstAndLastBlocks'
import { FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from './_constants'
import { fuFooter, fuHeader } from './_structs'

class EndCutterStream extends Transform {
  constructor(footerOffset, footerBuffer) {
    super()
    this._footerOffset = footerOffset
    this._footerBuffer = footerBuffer
    this._position = 0
    this._done = false
  }

  _transform(data, encoding, callback) {
    if (!this._done) {
      if (this._position + data.length >= this._footerOffset) {
        this._done = true
        const difference = this._footerOffset - this._position
        data = data.slice(0, difference)
        this.push(data)
        this.push(this._footerBuffer)
      } else {
        this.push(data)
      }
      this._position += data.length
    }
    callback()
  }
}

async function readChunk(stream, n) {
  if (n === 0) {
    return Buffer.alloc(0)
  }
  return new Promise((resolve, reject) => {
    const chunks = []
    let i = 0

    function clean() {
      stream.removeListener('readable', onReadable)
      stream.removeListener('end', onEnd)
      stream.removeListener('error', onError)
    }

    function resolve2() {
      clean()
      resolve(Buffer.concat(chunks, i))
    }

    function onEnd() {
      resolve2()
      clean()
    }

    function onError(error) {
      reject(error)
      clean()
    }

    function onReadable() {
      const chunk = stream.read(n - i)
      if (chunk === null) {
        return // wait for more data
      }
      i += chunk.length
      chunks.push(chunk)
      if (i >= n) {
        resolve2()
      }
    }

    stream.on('end', onEnd)
    stream.on('error', onError)
    stream.on('readable', onReadable)

    if (stream.readable) {
      onReadable()
    }
  })
}

export default async function createVhdStreamWithLength(stream) {
  const readBuffers = []
  let streamPosition = 0

  async function readStream(length) {
    const chunk = await readChunk(stream, length)
    assert.strictEqual(chunk.length, length)
    streamPosition += chunk.length
    readBuffers.push(chunk)
    return chunk
  }

  const chunk = await readStream(FOOTER_SIZE + HEADER_SIZE)
  const footerBuffer = chunk.slice(0, FOOTER_SIZE)
  const footer = fuFooter.unpack(footerBuffer)
  checkFooter(footer)
  const header = fuHeader.unpack(
    chunk.slice(FOOTER_SIZE, FOOTER_SIZE + HEADER_SIZE)
  )
  checkHeader(header, footer)
  const bitmapSizeBytes =
    Math.ceil(header.blockSize / 8 / SECTOR_SIZE / SECTOR_SIZE) * SECTOR_SIZE
  const blockAndBitmapSizeBytes = header.blockSize + bitmapSizeBytes
  await readStream(header.tableOffset - streamPosition)
  const table = await readStream(header.maxTableEntries * 4)
  const lastBlock = getFirstAndLastBlocks(table).lastSector
  const footerOffset = lastBlock * SECTOR_SIZE + blockAndBitmapSizeBytes
  const fileSize = footerOffset + FOOTER_SIZE
  readBuffers.reverse()
  for (const buf of readBuffers) {
    stream.unshift(buf)
  }
  const newStream = new EndCutterStream(footerOffset, footerBuffer)
  newStream.length = fileSize
  pipeline(stream, newStream)
  return newStream
}
