'use strict'

const assert = require('assert')
const asyncIteratorToStream = require('async-iterator-to-stream')
const forEachRight = require('lodash/forEachRight.js')

const computeGeometryForSize = require('./_computeGeometryForSize')
const { createFooter, createHeader } = require('./_createFooterHeader')
const {
  BLOCK_UNUSED,
  DEFAULT_BLOCK_SIZE: VHD_BLOCK_SIZE_BYTES,
  DISK_TYPES,
  FOOTER_SIZE,
  HEADER_SIZE,
  SECTOR_SIZE,
} = require('./_constants')

const { set: setBitmap } = require('./_bitmap')

const VHD_BLOCK_SIZE_SECTORS = VHD_BLOCK_SIZE_BYTES / SECTOR_SIZE

/**
 * Looks once backwards to collect the last fragment of each VHD block (they could be interleaved),
 * then allocates the blocks in a forwards pass.
 * @returns currentVhdPositionSector the first free sector after the data
 */
function createBAT({ firstBlockPosition, fragmentLogicAddressList, fragmentSize, bat, bitmapSize }) {
  let currentVhdPositionSector = firstBlockPosition / SECTOR_SIZE
  const lastFragmentPerBlock = new Map()
  forEachRight(fragmentLogicAddressList, fragmentLogicAddress => {
    assert.strictEqual((fragmentLogicAddress * fragmentSize) % SECTOR_SIZE, 0)
    const vhdTableIndex = Math.floor((fragmentLogicAddress * fragmentSize) / VHD_BLOCK_SIZE_BYTES)
    if (!lastFragmentPerBlock.has(vhdTableIndex)) {
      lastFragmentPerBlock.set(vhdTableIndex, fragmentLogicAddress * fragmentSize)
    }
  })
  const lastFragmentPerBlockArray = [...lastFragmentPerBlock]
  // lastFragmentPerBlock is from last to first, so we go the other way around
  forEachRight(lastFragmentPerBlockArray, ([vhdTableIndex, _fragmentVirtualAddress]) => {
    if (bat.readUInt32BE(vhdTableIndex * 4) === BLOCK_UNUSED) {
      bat.writeUInt32BE(currentVhdPositionSector, vhdTableIndex * 4)
      currentVhdPositionSector += (bitmapSize + VHD_BLOCK_SIZE_BYTES) / SECTOR_SIZE
    }
  })
  return [currentVhdPositionSector, lastFragmentPerBlock]
}

/**
 *  Receives an iterator of constant sized fragments, and a list of their address in virtual space, and returns
 *  a stream representing the VHD file of this disk.
 *  The fragment size should be an integer divider of the VHD block size.
 *  "fragment" designate a chunk of incoming data (ie probably a VMDK grain), and "block" is a VHD block.
 * @param diskSize
 * @param fragmentSize
 * @param fragmentLogicAddressList an iterable returning LBAs in multiple of fragmentSize
 * @param fragmentIterator
 * @returns {Promise<Function>}
 */

module.exports = async function createReadableStream(
  diskSize,
  fragmentSize,
  fragmentLogicAddressList,
  fragmentIterator
) {
  const ratio = VHD_BLOCK_SIZE_BYTES / fragmentSize
  if (ratio % 1 !== 0) {
    throw new Error(
      `Can't import file, grain size (${fragmentSize}) is not a divider of VHD block size ${VHD_BLOCK_SIZE_BYTES}`
    )
  }
  if (ratio > 53) {
    throw new Error(`Can't import file, grain size / block size ratio is > 53 (${ratio})`)
  }

  const maxTableEntries = Math.ceil(diskSize / VHD_BLOCK_SIZE_BYTES) + 1
  const tablePhysicalSizeBytes = Math.ceil((maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE

  const batPosition = FOOTER_SIZE + HEADER_SIZE
  const firstBlockPosition = batPosition + tablePhysicalSizeBytes
  const geometry = computeGeometryForSize(diskSize)
  const actualSize = geometry.actualSize
  const footer = createFooter(actualSize, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC)
  const header = createHeader(maxTableEntries, batPosition, VHD_BLOCK_SIZE_BYTES)
  const bitmapSize = Math.ceil(VHD_BLOCK_SIZE_SECTORS / 8 / SECTOR_SIZE) * SECTOR_SIZE
  const bat = Buffer.alloc(tablePhysicalSizeBytes, 0xff)
  const [endOfData, lastFragmentPerBlock] = createBAT({
    firstBlockPosition,
    fragmentLogicAddressList,
    fragmentSize,
    bat,
    bitmapSize,
  })
  const fileSize = endOfData * SECTOR_SIZE + FOOTER_SIZE
  let position = 0

  function* yieldAndTrack(buffer, expectedPosition, reason) {
    if (expectedPosition !== undefined) {
      assert.strictEqual(position, expectedPosition, `${reason} (${position}|${expectedPosition})`)
    }
    if (buffer.length > 0) {
      yield buffer
      position += buffer.length
    }
  }

  function insertFragmentInBlock(fragment, blockWithBitmap) {
    const fragmentOffsetInBlock = (fragment.logicalAddressBytes / SECTOR_SIZE) % VHD_BLOCK_SIZE_SECTORS
    for (let bitPos = 0; bitPos < VHD_BLOCK_SIZE_SECTORS / ratio; bitPos++) {
      setBitmap(blockWithBitmap, fragmentOffsetInBlock + bitPos)
    }
    fragment.data.copy(blockWithBitmap, bitmapSize + (fragment.logicalAddressBytes % VHD_BLOCK_SIZE_BYTES))
  }

  async function* generateBlocks(fragmentIterator, bitmapSize) {
    let currentFragmentIndex = -1
    // store blocks waiting for some of their fragments.
    const batIndexToBlockMap = new Map()
    for await (const fragment of fragmentIterator) {
      currentFragmentIndex++
      const batIndex = Math.floor(fragment.logicalAddressBytes / VHD_BLOCK_SIZE_BYTES)
      let currentBlockWithBitmap = batIndexToBlockMap.get(batIndex)
      if (currentBlockWithBitmap === undefined) {
        currentBlockWithBitmap = Buffer.alloc(bitmapSize + VHD_BLOCK_SIZE_BYTES)
        batIndexToBlockMap.set(batIndex, currentBlockWithBitmap)
      }
      insertFragmentInBlock(fragment, currentBlockWithBitmap)
      const batEntry = bat.readUInt32BE(batIndex * 4)
      assert.notStrictEqual(batEntry, BLOCK_UNUSED)
      const batPosition = batEntry * SECTOR_SIZE
      if (lastFragmentPerBlock.get(batIndex) === fragment.logicalAddressBytes) {
        batIndexToBlockMap.delete(batIndex)
        yield* yieldAndTrack(currentBlockWithBitmap, batPosition, `VHD block start index: ${currentFragmentIndex}`)
      }
    }
  }

  async function* iterator() {
    yield* yieldAndTrack(footer, 0)
    yield* yieldAndTrack(header, FOOTER_SIZE)
    yield* yieldAndTrack(bat, FOOTER_SIZE + HEADER_SIZE)
    yield* generateBlocks(fragmentIterator, bitmapSize)
    yield* yieldAndTrack(footer)
  }

  const stream = asyncIteratorToStream(iterator())
  stream.length = fileSize
  return stream
}
