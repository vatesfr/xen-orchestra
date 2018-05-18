import assert from 'assert'
import asyncIteratorToStream from 'async-iterator-to-stream'

import computeGeometryForSize from './_computeGeometryForSize'
import { createFooter, createHeader } from './_createFooterHeader'
import {
  BLOCK_UNUSED,
  DEFAULT_BLOCK_SIZE as VHD_BLOCK_SIZE_BYTES,
  DISK_TYPE_DYNAMIC,
  FOOTER_SIZE,
  HEADER_SIZE,
  SECTOR_SIZE,
} from './_constants'

import { set as setBitmap } from './_bitmap'

const VHD_BLOCK_SIZE_SECTORS = VHD_BLOCK_SIZE_BYTES / SECTOR_SIZE

/**
 * @returns {Array} an array of occupation bitmap, each bit mapping an input block size of bytes
 */
function createBAT (
  firstBlockPosition,
  blockAddressList,
  ratio,
  bat,
  bitmapSize
) {
  let currentVhdPositionSector = firstBlockPosition / SECTOR_SIZE
  blockAddressList.forEach(blockPosition => {
    assert.strictEqual(blockPosition % SECTOR_SIZE, 0)
    const vhdTableIndex = Math.floor(blockPosition / VHD_BLOCK_SIZE_BYTES)
    if (bat.readUInt32BE(vhdTableIndex * 4) === BLOCK_UNUSED) {
      bat.writeUInt32BE(currentVhdPositionSector, vhdTableIndex * 4)
      currentVhdPositionSector +=
        (bitmapSize + VHD_BLOCK_SIZE_BYTES) / SECTOR_SIZE
    }
  })
}

export default asyncIteratorToStream(async function * (
  diskSize,
  incomingBlockSize,
  blockAddressList,
  blockIterator
) {
  const ratio = VHD_BLOCK_SIZE_BYTES / incomingBlockSize
  if (ratio % 1 !== 0) {
    throw new Error(
      `Can't import file, grain size (${incomingBlockSize}) is not a divider of VHD block size ${VHD_BLOCK_SIZE_BYTES}`
    )
  }
  if (ratio > 53) {
    throw new Error(
      `Can't import file, grain size / block size ratio is > 53 (${ratio})`
    )
  }

  const maxTableEntries = Math.ceil(diskSize / VHD_BLOCK_SIZE_BYTES) + 1
  const tablePhysicalSizeBytes =
    Math.ceil(maxTableEntries * 4 / SECTOR_SIZE) * SECTOR_SIZE

  const batPosition = FOOTER_SIZE + HEADER_SIZE
  const firstBlockPosition = batPosition + tablePhysicalSizeBytes
  const geometry = computeGeometryForSize(diskSize)
  const actualSize = geometry.actualSize
  const footer = createFooter(
    actualSize,
    Math.floor(Date.now() / 1000),
    geometry,
    FOOTER_SIZE,
    DISK_TYPE_DYNAMIC
  )
  const header = createHeader(
    maxTableEntries,
    batPosition,
    VHD_BLOCK_SIZE_BYTES
  )
  const bitmapSize =
    Math.ceil(VHD_BLOCK_SIZE_SECTORS / 8 / SECTOR_SIZE) * SECTOR_SIZE
  const bat = Buffer.alloc(tablePhysicalSizeBytes, 0xff)
  createBAT(firstBlockPosition, blockAddressList, ratio, bat, bitmapSize)
  let position = 0
  function * yieldAndTrack (buffer, expectedPosition) {
    if (expectedPosition !== undefined) {
      assert.strictEqual(position, expectedPosition)
    }
    if (buffer.length > 0) {
      yield buffer
      position += buffer.length
    }
  }
  async function * generateFileContent (blockIterator, bitmapSize, ratio) {
    let currentBlock = -1
    let currentVhdBlockIndex = -1
    let currentBlockWithBitmap = Buffer.alloc(0)
    for await (const next of blockIterator) {
      currentBlock++
      assert.strictEqual(blockAddressList[currentBlock], next.offsetBytes)
      const batIndex = Math.floor(next.offsetBytes / VHD_BLOCK_SIZE_BYTES)
      if (batIndex !== currentVhdBlockIndex) {
        if (currentVhdBlockIndex >= 0) {
          yield * yieldAndTrack(
            currentBlockWithBitmap,
            bat.readUInt32BE(currentVhdBlockIndex * 4) * SECTOR_SIZE
          )
        }
        currentBlockWithBitmap = Buffer.alloc(bitmapSize + VHD_BLOCK_SIZE_BYTES)
        currentVhdBlockIndex = batIndex
      }
      const blockOffset =
        (next.offsetBytes / SECTOR_SIZE) % VHD_BLOCK_SIZE_SECTORS
      for (let bitPos = 0; bitPos < VHD_BLOCK_SIZE_SECTORS / ratio; bitPos++) {
        setBitmap(currentBlockWithBitmap, blockOffset + bitPos)
      }
      next.data.copy(
        currentBlockWithBitmap,
        bitmapSize + next.offsetBytes % VHD_BLOCK_SIZE_BYTES
      )
    }
    yield * yieldAndTrack(currentBlockWithBitmap)
  }
  yield * yieldAndTrack(footer, 0)
  yield * yieldAndTrack(header, FOOTER_SIZE)
  yield * yieldAndTrack(bat, FOOTER_SIZE + HEADER_SIZE)
  yield * generateFileContent(blockIterator, bitmapSize, ratio)
  yield * yieldAndTrack(footer)
})
