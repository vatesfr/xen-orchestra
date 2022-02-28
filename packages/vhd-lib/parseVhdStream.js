'use strict'

const { BLOCK_UNUSED, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } = require('./_constants')
const { readChunk } = require('@vates/read-chunk')
const assert = require('assert')
const { unpackFooter, unpackHeader, computeFullBlockSize } = require('./Vhd/_utils')

const cappedBufferConcat = (buffers, maxSize) => {
  let buffer = Buffer.concat(buffers)
  if (buffer.length > maxSize) {
    buffer = buffer.slice(buffer.length - maxSize)
  }
  return buffer
}

exports.parseVhdStream = async function* parseVhdStream(stream) {
  let bytesRead = 0

  // handle empty space between elements
  // ensure we read stream in order
  async function read(offset, size) {
    assert(bytesRead <= offset, `offset is ${offset} but we already read ${bytesRead} bytes`)
    if (bytesRead < offset) {
      // empty spaces
      await read(bytesRead, offset - bytesRead)
    }
    const buf = await readChunk(stream, size)
    assert.strictEqual(buf.length, size, `read ${buf.length} instead of ${size}`)
    bytesRead += size
    return buf
  }

  const bufFooter = await read(0, FOOTER_SIZE)

  const footer = unpackFooter(bufFooter)
  yield { type: 'footer', footer, offset: 0 }

  const bufHeader = await read(FOOTER_SIZE, HEADER_SIZE)
  const header = unpackHeader(bufHeader, footer)

  yield { type: 'header', header, offset: SECTOR_SIZE }
  const blockSize = header.blockSize
  assert.strictEqual(blockSize % SECTOR_SIZE, 0)

  const fullBlockSize = computeFullBlockSize(blockSize)

  const bitmapSize = fullBlockSize - blockSize

  const index = []

  for (const parentLocatorId in header.parentLocatorEntry) {
    const parentLocatorEntry = header.parentLocatorEntry[parentLocatorId]
    // empty parent locator entry, does not exist in the content
    if (parentLocatorEntry.platformDataSpace === 0) {
      continue
    }
    index.push({
      ...parentLocatorEntry,
      type: 'parentLocator',
      offset: parentLocatorEntry.platformDataOffset,
      size: parentLocatorEntry.platformDataLength,
      id: parentLocatorId,
    })
  }

  const batOffset = header.tableOffset
  const batSize = Math.max(1, Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE)) * SECTOR_SIZE

  index.push({
    type: 'bat',
    offset: batOffset,
    size: batSize,
  })

  // sometimes some parent locator are before the BAT
  index.sort((a, b) => a.offset - b.offset)
  while (index.length > 0) {
    const item = index.shift()
    const buffer = await read(item.offset, item.size)
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
          index.push({
            type: 'block',
            id: blockCounter,
            offset: batEntryBytes,
            size: fullBlockSize,
          })
          blockCount++
        }
      }
      // sort again index to ensure block and parent locator are in the right order
      index.sort((a, b) => a.offset - b.offset)
      item.blockCount = blockCount
    } else if (type === 'block') {
      item.bitmap = buffer.slice(0, bitmapSize)
      item.data = buffer.slice(bitmapSize)
    }

    yield item
  }

  /**
   * the second footer is at filesize - 512 , there can be empty spaces between last block
   * and the start of the footer
   *
   * we read till the end of the stream, and use the last 512 bytes as the footer
   */
  const bufFooterEnd = await readLastSector(stream)
  assert(bufFooter.equals(bufFooterEnd), 'footer1 !== footer2')
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
