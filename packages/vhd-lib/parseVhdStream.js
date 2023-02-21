'use strict'

const { BLOCK_UNUSED, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } = require('./_constants')
const { readChunk } = require('@vates/read-chunk')
const assert = require('assert')
const { unpackFooter, unpackHeader, computeFullBlockSize } = require('./Vhd/_utils')
const { asyncEach } = require('@vates/async-each')

const cappedBufferConcat = (buffers, maxSize) => {
  let buffer = Buffer.concat(buffers)
  if (buffer.length > maxSize) {
    buffer = buffer.slice(buffer.length - maxSize)
  }
  return buffer
}

function readLastSector(stream) {
  return new Promise((resolve, reject) => {
    let bufFooterEnd = Buffer.alloc(0)
    stream.on('data', chunk => {
      if (chunk.length > 0) {
        bufFooterEnd = cappedBufferConcat([bufFooterEnd, chunk], SECTOR_SIZE)
      }
    })

    stream.on('end', () => resolve(bufFooterEnd))
    stream.on('error', reject)
  })
}

class StreamParser {
  #bufFooter
  _bitmapSize = 0
  _bytesRead = 0
  _stream = null
  _index = []
  constructor(stream) {
    this._stream = stream
  }

  async _read(offset, size) {
    assert(this._bytesRead <= offset, `offset is ${offset} but we already read ${this._bytesRead} bytes`)
    if (this._bytesRead < offset) {
      // empty spaces
      await this._read(this._bytesRead, offset - this._bytesRead)
    }
    const buf = await readChunk(this._stream, size)
    assert.strictEqual(buf.length, size, `read ${buf.length} instead of ${size}`)
    this._bytesRead += size
    return buf
  }

  async *headers() {
    this.#bufFooter = await this._read(0, FOOTER_SIZE)

    const footer = unpackFooter(this.#bufFooter)

    yield { type: 'footer', footer, offset: 0 }
    const bufHeader = await this._read(FOOTER_SIZE, HEADER_SIZE)
    const header = unpackHeader(bufHeader, footer)

    yield { type: 'header', header, offset: SECTOR_SIZE }
    const blockSize = header.blockSize
    assert.strictEqual(blockSize % SECTOR_SIZE, 0)
    const fullBlockSize = computeFullBlockSize(blockSize)
    this._bitmapSize = fullBlockSize - blockSize

    let batFound = false

    for (const parentLocatorId in header.parentLocatorEntry) {
      const parentLocatorEntry = header.parentLocatorEntry[parentLocatorId]
      // empty parent locator entry, does not exist in the content
      if (parentLocatorEntry.platformDataSpace === 0) {
        continue
      }
      this._index.push({
        ...parentLocatorEntry,
        type: 'parentLocator',
        offset: parentLocatorEntry.platformDataOffset,
        size: parentLocatorEntry.platformDataLength,
        id: parentLocatorId,
      })
    }

    const batOffset = header.tableOffset
    const batSize = Math.max(1, Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE)) * SECTOR_SIZE

    this._index.push({
      type: 'bat',
      offset: batOffset,
      size: batSize,
    })

    // sometimes some parent locator are before the BAT
    this._index.sort((a, b) => a.offset - b.offset)

    while (!batFound) {
      const item = this._index.shift()
      const buffer = await this._read(item.offset, item.size)
      item.buffer = buffer

      const { type } = item
      if (type === 'bat') {
        // found the BAT : read it and add block to index

        let blockCount = 0
        for (let blockCounter = 0; blockCounter < header.maxTableEntries; blockCounter++) {
          const batEntrySector = buffer.readUInt32BE(blockCounter * 4)
          // unallocated block, no need to export it
          if (batEntrySector !== BLOCK_UNUSED) {
            const batEntryBytes = batEntrySector * SECTOR_SIZE
            // ensure the block is not before the bat
            assert.ok(batEntryBytes >= batOffset + batSize)
            this._index.push({
              type: 'block',
              id: blockCounter,
              offset: batEntryBytes,
              size: fullBlockSize,
            })
            blockCount++
          }
        }
        // sort again index to ensure block and parent locator are in the right order
        this._index.sort((a, b) => a.offset - b.offset)
        item.blockCount = blockCount
        batFound = true
      }
      yield item
    }
  }

  async *blocks() {
    while (this._index.length > 0) {
      const item = this._index.shift()
      const buffer = await this._read(item.offset, item.size)

      item.bitmap = buffer.slice(0, this._bitmapSize)
      item.data = buffer.slice(this._bitmapSize)
      item.buffer = buffer
      yield item
    }
    /**
     * the second footer is at filesize - 512 , there can be empty spaces between last block
     * and the start of the footer
     *
     * we read till the end of the stream, and use the last 512 bytes as the footer
     */
    const bufFooterEnd = await readLastSector(this._stream)
    assert(this.#bufFooter.equals(bufFooterEnd), 'footer1 !== footer2')
  }

  async *parse() {
    yield* this.headers()
    yield* this.blocks()
  }
}

// hybrid mode : read the headers from the vhd stream, and read the blocks from nbd
class StreamNbdParser extends StreamParser {
  #nbdClient = null
  #concurrency = 16

  constructor(stream, nbdClient = {}) {
    super(stream)
    this.#nbdClient = nbdClient
  }

  async _readBlockData(item) {
    const SECTOR_BITMAP = Buffer.alloc(512, 255)
    const client = this.#nbdClient
    // we read in a raw file, so the block position is id x length, and have nothing to do with the offset
    // in the vhd stream
    const rawDataLength = item.size - SECTOR_BITMAP.length
    const data = await client.readBlock(item.id, rawDataLength)

    // end of file , non aligned vhd block
    const buffer = Buffer.concat([SECTOR_BITMAP, data])
    const block = {
      ...item,
      size: rawDataLength,
      bitmap: SECTOR_BITMAP,
      data,
      buffer,
    }
    return block
  }

  async *blocks() {
    // at most this array will be this.#concurrency long
    const blocksReady = []
    let waitingForBlock
    let done = false
    let error

    function waitForYield(block) {
      return new Promise(resolve => {
        blocksReady.push({
          block,
          yielded: resolve,
        })
        if (waitingForBlock !== undefined) {
          const resolver = waitingForBlock
          waitingForBlock = undefined
          resolver()
        }
      })
    }

    asyncEach(
      this._index,
      async blockId => {
        const block = await this._readBlockData(blockId)
        await waitForYield(block)
      },
      { concurrency: this.#concurrency }
    )
      .then(() => {
        done = true
        waitingForBlock?.()
      })
      .catch(err => {
        // will keep only the last error if multiple throws
        error = err
        waitingForBlock?.()
      })
    // eslint-disable-next-line no-unmodified-loop-condition
    while (!done) {
      if (error) {
        throw error
      }
      if (blocksReady.length > 0) {
        const { block, yielded } = blocksReady.shift()
        yielded()
        yield block
      } else {
        await new Promise(resolve => {
          waitingForBlock = resolve
        })
      }
    }
  }

  async *parse() {
    yield* this.headers()

    // the VHD stream is no longer necessary, destroy it
    //
    // - not destroying it would leave other writers stuck
    // - resuming it would download the whole stream unnecessarily if not other writers
    this._stream.destroy()

    yield* this.blocks()
  }
}

exports.parseVhdStream = async function* parseVhdStream(stream, nbdClient) {
  let parser
  if (nbdClient) {
    parser = new StreamNbdParser(stream, nbdClient)
  } else {
    parser = new StreamParser(stream)
  }
  yield* parser.parse()
}
