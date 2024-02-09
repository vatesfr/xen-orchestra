'use strict'
const { finished, Readable } = require('node:stream')
const { readChunkStrict, skipStrict } = require('@vates/read-chunk')
const { unpackHeader } = require('./Vhd/_utils')
const {
  FOOTER_SIZE,
  HEADER_SIZE,
  PARENT_LOCATOR_ENTRIES,
  SECTOR_SIZE,
  BLOCK_UNUSED,
  DEFAULT_BLOCK_SIZE,
  PLATFORMS,
} = require('./_constants')
const { fuHeader, checksumStruct } = require('./_structs')
const assert = require('node:assert')

const NBD_DEFAULT_BLOCK_SIZE = 64 * 1024
const MAX_DURATION_BETWEEN_PROGRESS_EMIT = 5e3
const MIN_TRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT = 1

exports.createNbdRawStream = function createRawStream(nbdClient) {
  const exportSize = Number(nbdClient.exportSize)
  const chunkSize = 2 * 1024 * 1024

  const indexGenerator = function* () {
    const nbBlocks = Math.ceil(exportSize / chunkSize)
    for (let index = 0; index < nbBlocks; index++) {
      yield { index, size: chunkSize }
    }
  }
  const stream = Readable.from(nbdClient.readBlocks(indexGenerator), { objectMode: false })

  stream.on('error', () => nbdClient.disconnect())
  stream.on('end', () => nbdClient.disconnect())
  return stream
}

function batContainsBlock(bat, blockId) {
  const entry = bat.readUInt32BE(blockId * 4)
  if (entry !== BLOCK_UNUSED) {
    return [{ blockId, size: DEFAULT_BLOCK_SIZE }]
  }
}
// one 2MB VHD block is in 32 blocks of 64KB
// 32 bits are written in 8 4bytes uint32
const EMPTY_NBD_BUFFER = Buffer.alloc(NBD_DEFAULT_BLOCK_SIZE, 0)
function cbtContainsBlock(cbt, blockId) {
  const subBlocks = []
  let hasOne = false
  for (let i = 0; i < 32; i++) {
    const position = blockId * 32 + i
    const bitOffset = position & 7 // in byte
    const byteIndex = position >> 3 // in buffer
    const bit = (cbt[byteIndex] >> bitOffset) & 1
    if (bit === 1) {
      subBlocks.push({ blockId: position, size: NBD_DEFAULT_BLOCK_SIZE })
      hasOne = true
    } else {
      // don't read empty blocks
      subBlocks.push({ buffer: EMPTY_NBD_BUFFER })
    }
  }
  if (hasOne) {
    return subBlocks
  }
}
exports.createNbdVhdStream = async function createVhdStream(
  nbdClient,
  sourceStream,
  {
    changedBlocks,
    maxDurationBetweenProgressEmit = MAX_DURATION_BETWEEN_PROGRESS_EMIT,
    minTresholdPercentBetweenProgressEmit = MIN_TRESHOLD_PERCENT_BETWEEN_PROGRESS_EMIT,
  } = {}
) {
  const bufFooter = await readChunkStrict(sourceStream, FOOTER_SIZE)

  const header = unpackHeader(await readChunkStrict(sourceStream, HEADER_SIZE))
  // compute BAT in order
  const batSize = Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
  // skip space between header and beginning of the table
  await skipStrict(sourceStream, header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
  // new table offset
  header.tableOffset = FOOTER_SIZE + HEADER_SIZE
  let streamBat
  if (changedBlocks === undefined) {
    streamBat = await readChunkStrict(sourceStream, batSize)
  }
  let offset = FOOTER_SIZE + HEADER_SIZE + batSize
  // check if parentlocator are ordered
  let precLocator = 0
  for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
    header.parentLocatorEntry[i] = {
      ...header.parentLocatorEntry[i],
      platformDataOffset: offset,
    }
    offset += header.parentLocatorEntry[i].platformDataSpace * SECTOR_SIZE
    if (header.parentLocatorEntry[i].platformCode !== PLATFORMS.NONE) {
      assert(
        precLocator < offset,
        `locator must be ordered. numer ${i} is  at ${offset}, precedent is at ${precLocator}`
      )
      precLocator = offset
    }
  }
  const rawHeader = fuHeader.pack(header)
  checksumStruct(rawHeader, fuHeader)

  // BAT
  const bat = Buffer.allocUnsafe(batSize)
  let offsetSector = offset / SECTOR_SIZE
  const blockSizeInSectors = DEFAULT_BLOCK_SIZE / SECTOR_SIZE + 1 /* bitmap */
  // compute a BAT with the position that the block will have in the resulting stream
  // blocks starts directly after parent locator entries
  const entries = []
  for (let blockId = 0; blockId < header.maxTableEntries; blockId++) {
    const subBlocks = changedBlocks ? cbtContainsBlock(changedBlocks, blockId) : batContainsBlock(streamBat, blockId)
    if (subBlocks !== undefined) {
      bat.writeUInt32BE(offsetSector, blockId * 4)
      entries.push({ blockId, subBlocks })
      offsetSector += blockSizeInSectors
    } else {
      bat.writeUInt32BE(BLOCK_UNUSED, blockId * 4)
    }
  }

  const totalLength = (offsetSector + 1) /* end footer */ * SECTOR_SIZE

  let lengthRead = 0
  let lastUpdate = 0
  let lastLengthRead = 0

  function throttleEmitProgress() {
    const now = Date.now()

    if (
      lengthRead - lastLengthRead > (minTresholdPercentBetweenProgressEmit / 100) * totalLength ||
      (now - lastUpdate > maxDurationBetweenProgressEmit && lengthRead !== lastLengthRead)
    ) {
      stream.emit('progress', lengthRead / totalLength)
      lastUpdate = now
      lastLengthRead = lengthRead
    }
  }

  function trackAndGet(buffer) {
    lengthRead += buffer.length
    throttleEmitProgress()
    return buffer
  }

  async function* iterator() {
    yield trackAndGet(bufFooter)
    yield trackAndGet(rawHeader)
    yield trackAndGet(bat)

    let precBlocOffset = FOOTER_SIZE + HEADER_SIZE + batSize
    for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
      const parentLocatorOffset = header.parentLocatorEntry[i].platformDataOffset
      const space = header.parentLocatorEntry[i].platformDataSpace * SECTOR_SIZE
      if (space > 0) {
        await skipStrict(sourceStream, parentLocatorOffset - precBlocOffset)
        const data = await readChunkStrict(sourceStream, space)
        precBlocOffset = parentLocatorOffset + space
        yield trackAndGet(data)
      }
    }

    // close export stream we won't use it anymore
    sourceStream.destroy()

    // yield  blocks from nbd
    const nbdIterator = nbdClient.readBlocks(function* () {
      for (const { subBlocks } of entries) {
        for (const { blockId, buffer, size } of subBlocks) {
          yield { index: blockId, buffer, size }
        }
      }
    })
    const bitmap = Buffer.alloc(SECTOR_SIZE, 255)
    for await (const block of nbdIterator) {
      yield trackAndGet(bitmap) // don't forget the bitmap before the block
      yield trackAndGet(block)
    }
    yield trackAndGet(bufFooter)
  }

  const stream = Readable.from(iterator(), { objectMode: false })
  stream.length = totalLength
  stream._nbd = true
  finished(stream, () => {
    clearInterval(interval)
    nbdClient.disconnect()
  })
  const interval = setInterval(throttleEmitProgress, maxDurationBetweenProgressEmit)

  return stream
}
