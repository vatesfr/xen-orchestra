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
  const vhdOccupationTable = []
  let currentVhdPositionSector = firstBlockPosition / SECTOR_SIZE
  blockAddressList.forEach(blockPosition => {
    const scaled = blockPosition / VHD_BLOCK_SIZE_BYTES
    const vhdTableIndex = Math.floor(scaled)
    if (bat.readUInt32BE(vhdTableIndex * 4) === BLOCK_UNUSED) {
      bat.writeUInt32BE(currentVhdPositionSector, vhdTableIndex * 4)
      currentVhdPositionSector +=
        (bitmapSize + VHD_BLOCK_SIZE_BYTES) / SECTOR_SIZE
    }
    // not using bit operators to avoid the int32 coercion, that way we can go to 53 bits
    vhdOccupationTable[vhdTableIndex] =
      (vhdOccupationTable[vhdTableIndex] || 0) +
      Math.pow(2, (scaled % 1) * ratio)
  })
  return vhdOccupationTable
}

function createBitmap (bitmapSize, ratio, vhdOccupationBucket) {
  const bitmap = Buffer.alloc(bitmapSize)
  for (let i = 0; i < VHD_BLOCK_SIZE_SECTORS / ratio; i++) {
    // do not shift to avoid int32 coercion
    if ((vhdOccupationBucket * Math.pow(2, -i)) & 1) {
      for (let j = 0; j < ratio; j++) {
        setBitmap(bitmap, i * ratio + j)
      }
    }
  }
  return bitmap
}

function * yieldIfNotEmpty (buffer) {
  if (buffer.length > 0) {
    yield buffer
  }
}

async function * generateFileContent (
  blockIterator,
  bitmapSize,
  ratio,
  vhdOccupationTable
) {
  let currentVhdBlockIndex = -1
  let currentBlockBuffer = Buffer.alloc(0)
  for await (const next of blockIterator) {
    const batEntry = Math.floor(next.offsetBytes / VHD_BLOCK_SIZE_BYTES)
    if (batEntry !== currentVhdBlockIndex) {
      yield * yieldIfNotEmpty(currentBlockBuffer)
      currentBlockBuffer = Buffer.alloc(VHD_BLOCK_SIZE_BYTES)
      currentVhdBlockIndex = batEntry
      yield createBitmap(bitmapSize, ratio, vhdOccupationTable[batEntry])
    }
    next.data.copy(currentBlockBuffer, next.offsetBytes % VHD_BLOCK_SIZE_BYTES)
  }
  yield * yieldIfNotEmpty(currentBlockBuffer)
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
  const tablePhysicalSizeBytes = Math.ceil(maxTableEntries * 4 / 512) * 512

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
  const vhdOccupationTable = createBAT(
    firstBlockPosition,
    blockAddressList,
    ratio,
    bat,
    bitmapSize
  )
  yield footer
  yield header
  yield bat
  yield * generateFileContent(
    blockIterator,
    bitmapSize,
    ratio,
    vhdOccupationTable
  )
  yield footer
})
