import assert from 'assert'
import { pipeline, Transform } from 'readable-stream'
import { readChunk } from '@vates/read-chunk'

import checkFooter from './_checkFooter'
import checkHeader from './_checkHeader'
import noop from './_noop'
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

  const footerBuffer = await readStream(FOOTER_SIZE)
  const footer = fuFooter.unpack(footerBuffer)
  checkFooter(footer)

  const header = fuHeader.unpack(await readStream(HEADER_SIZE))
  checkHeader(header, footer)

  await readStream(header.tableOffset - streamPosition)

  const table = await readStream(header.maxTableEntries * 4)

  readBuffers.reverse()
  for (const buf of readBuffers) {
    stream.unshift(buf)
  }

  const firstAndLastBlocks = getFirstAndLastBlocks(table)
  const footerOffset =
    firstAndLastBlocks !== undefined
      ? firstAndLastBlocks.lastSector * SECTOR_SIZE +
        Math.ceil(header.blockSize / SECTOR_SIZE / 8 / SECTOR_SIZE) * SECTOR_SIZE +
        header.blockSize
      : Math.ceil(streamPosition / SECTOR_SIZE) * SECTOR_SIZE

  // ignore any data after footerOffset and push footerBuffer
  //
  // this is necessary to ignore any blank space between the last block and the
  // final footer which would invalidate the size we computed
  const newStream = new EndCutterStream(footerOffset, footerBuffer)
  pipeline(stream, newStream, noop)

  newStream.length = footerOffset + FOOTER_SIZE
  return newStream
}
