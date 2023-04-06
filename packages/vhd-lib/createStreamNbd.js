'use strict'
const { readChunkStrict, skipStrict } = require('@vates/read-chunk')
const { Readable } = require('node:stream')
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

exports.createNbdRawStream = async function createRawStream(nbdClient) {
  const stream = Readable.from(nbdClient.readBlocks())

  stream.on('error', () => nbdClient.disconnect())
  stream.on('end', () => nbdClient.disconnect())
  return stream
}

exports.createNbdVhdStream = async function createVhdStream(nbdClient, sourceStream) {
  const bufFooter = await readChunkStrict(sourceStream, FOOTER_SIZE)

  const header = unpackHeader(await readChunkStrict(sourceStream, HEADER_SIZE))
  // compute BAT in order
  const batSize = Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
  await skipStrict(sourceStream, header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
  const streamBat = await readChunkStrict(sourceStream, batSize)
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
  header.tableOffset = FOOTER_SIZE + HEADER_SIZE
  const rawHeader = fuHeader.pack(header)
  checksumStruct(rawHeader, fuHeader)

  // BAT
  const bat = Buffer.allocUnsafe(batSize)
  let offsetSector = offset / SECTOR_SIZE
  const blockSizeInSectors = DEFAULT_BLOCK_SIZE / SECTOR_SIZE + 1 /* bitmap */
  // compute a BAT with the position that the block will have in the resulting stream
  // blocks starts directly after parent locator entries
  const entries = []
  for (let i = 0; i < header.maxTableEntries; i++) {
    const entry = streamBat.readUInt32BE(i * 4)
    if (entry !== BLOCK_UNUSED) {
      bat.writeUInt32BE(offsetSector, i * 4)
      offsetSector += blockSizeInSectors
      entries.push(i)
    } else {
      bat.writeUInt32BE(BLOCK_UNUSED, i * 4)
    }
  }

  async function* iterator() {
    yield bufFooter
    yield rawHeader
    yield bat

    let precBlocOffset = FOOTER_SIZE + HEADER_SIZE + batSize
    for (let i = 0; i < PARENT_LOCATOR_ENTRIES; i++) {
      const parentLocatorOffset = header.parentLocatorEntry[i].platformDataOffset
      const space = header.parentLocatorEntry[i].platformDataSpace * SECTOR_SIZE
      if (space > 0) {
        await skipStrict(sourceStream, parentLocatorOffset - precBlocOffset)
        const data = await readChunkStrict(sourceStream, space)
        precBlocOffset = parentLocatorOffset + space
        yield data
      }
    }

    // close export stream we won't use it anymore
    sourceStream.destroy()

    // yield  blocks from nbd
    const nbdIterator = nbdClient.readBlocks(function* () {
      for (const entry of entries) {
        yield { index: entry, size: DEFAULT_BLOCK_SIZE }
      }
    })
    const bitmap = Buffer.alloc(SECTOR_SIZE, 255)
    for await (const block of nbdIterator) {
      yield bitmap // don't forget the bitmap before the block
      yield block
    }
    yield bufFooter
  }

  const stream = Readable.from(iterator())
  stream.length = (offsetSector + blockSizeInSectors + 1) /* end footer */ * SECTOR_SIZE
  stream._nbd = true
  stream.on('error', () => nbdClient.disconnect())
  stream.on('end', () => nbdClient.disconnect())
  return stream
}
