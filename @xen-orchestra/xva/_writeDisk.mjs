import assert from 'node:assert'

import { formatBlockPath } from './_formatBlockPath.mjs'
import { writeChunk } from './_writeChunk.mjs'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

// write one chunk from time to time to ensure xapi does not time out
// while we are skipping empty chunks
const MAX_INTERVAL_BETWEEN_CHUNKS = 60 * 1000
const EMPTY_CHUNK = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)

const isEmpty = data => data.equals(EMPTY_CHUNK.subarray(0, data.length))

const isSorted = indexes => indexes.every((index, i) => i === 0 || indexes[i - 1] < index)

const isRandomAccess = disk => typeof disk.readBlock === 'function'

/**
 * xapi expects the chunks of a disk in increasing order
 *
 * the disk generator is used whenever possible (to benefit from read ahead, throttling, ...)
 * a random access disk with unsorted indexes is read block by block in order
 *
 * @param {import('@xen-orchestra/disk-transform').Disk} disk
 * @returns {AsyncGenerator<import('@xen-orchestra/disk-transform').DiskBlock>}
 */
async function* orderedDiskBlocks(disk) {
  if (isRandomAccess(disk)) {
    const indexes = disk.getBlockIndexes()
    if (!isSorted(indexes)) {
      const sortedIndexes = indexes.slice().sort((a, b) => a - b)
      try {
        for (let i = 0; i < sortedIndexes.length; i++) {
          yield await disk.readBlock(sortedIndexes[i])
          await disk.progressHandler.setProgress(i / sortedIndexes.length)
        }
        await disk.progressHandler.setProgress(1)
      } finally {
        await disk.progressHandler.done()
        await disk.close()
      }
      return
    }
  }

  let previousIndex = -1
  for await (const block of disk.diskBlocks()) {
    if (block.index <= previousIndex) {
      throw new Error(
        `disk blocks must be generated in increasing order to be written in a XVA, got block ${block.index} after block ${previousIndex}`
      )
    }
    previousIndex = block.index
    yield block
  }
}

/**
 * convert the disk blocks to XVA chunks, in increasing order
 *
 * @param {import('@xen-orchestra/disk-transform').Disk} disk
 * @returns {AsyncGenerator<{index:number, data:Buffer}>}
 */
async function* xvaChunks(disk) {
  const diskSize = disk.getVirtualSize()
  for await (const chunk of alignedXvaChunks(disk)) {
    const chunkEnd = (chunk.index + 1) * XVA_DISK_CHUNK_LENGTH
    if (chunkEnd > diskSize) {
      // don't leak data the last block may contain past the end of the disk
      const data = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)
      chunk.data.copy(data, 0, 0, diskSize - chunk.index * XVA_DISK_CHUNK_LENGTH)
      chunk.data = data
    }
    yield chunk
  }
}

async function* alignedXvaChunks(disk) {
  const blockSize = disk.getBlockSize()
  const nbChunks = Math.ceil(disk.getVirtualSize() / XVA_DISK_CHUNK_LENGTH)

  if (blockSize <= XVA_DISK_CHUNK_LENGTH) {
    assert.strictEqual(
      XVA_DISK_CHUNK_LENGTH % blockSize,
      0,
      `disk block size ${blockSize} must be a divisor of the XVA chunk size ${XVA_DISK_CHUNK_LENGTH}`
    )
    const blocksPerChunk = XVA_DISK_CHUNK_LENGTH / blockSize
    let chunkIndex = -1
    let chunk
    for await (const { index, data } of orderedDiskBlocks(disk)) {
      const blockChunkIndex = Math.floor(index / blocksPerChunk)
      if (blockChunkIndex >= nbChunks) {
        break
      }
      if (blockChunkIndex !== chunkIndex) {
        if (chunk !== undefined) {
          yield { index: chunkIndex, data: chunk }
        }
        chunkIndex = blockChunkIndex
        // blocks absent from a non differencing disk are empty
        chunk = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)
      }
      data.copy(chunk, (index % blocksPerChunk) * blockSize)
    }
    if (chunk !== undefined) {
      yield { index: chunkIndex, data: chunk }
    }
  } else {
    assert.strictEqual(
      blockSize % XVA_DISK_CHUNK_LENGTH,
      0,
      `disk block size ${blockSize} must be a multiple of the XVA chunk size ${XVA_DISK_CHUNK_LENGTH}`
    )
    const chunksPerBlock = blockSize / XVA_DISK_CHUNK_LENGTH
    for await (const { index, data } of orderedDiskBlocks(disk)) {
      for (let i = 0; i < chunksPerBlock; i++) {
        const chunkIndex = index * chunksPerBlock + i
        if (chunkIndex >= nbChunks) {
          break
        }
        yield { index: chunkIndex, data: data.subarray(i * XVA_DISK_CHUNK_LENGTH, (i + 1) * XVA_DISK_CHUNK_LENGTH) }
      }
    }
  }
}

/**
 * write the full content of a disk in a XVA
 *
 * the disk must already be initialized, it will be closed at the end
 * it must not be a differencing disk: XVA only contains full disks, use a DiskChain if needed
 *
 * @param {import('tar-stream').Pack} pack
 * @param {import('@xen-orchestra/disk-transform').Disk} disk
 * @param {object} vdi
 * @param {string} vdi.basePath the ref of the VDI in ova.xml
 * @param {number} vdi.virtualSize the size of the VDI in ova.xml, can be bigger than the disk
 */
export default async function writeDisk(pack, disk, { basePath, virtualSize }) {
  if (disk.isDifferencing()) {
    // close it since it's the responsibility of this function
    await disk.close()
    throw new Error(`can't write a differencing disk in a XVA, ${basePath}`)
  }
  assert.ok(virtualSize > 0, `VDI ${basePath} must not be empty`)
  assert.ok(
    virtualSize >= disk.getVirtualSize(),
    `VDI ${basePath} size ${virtualSize} can't be smaller than its disk ${disk.getVirtualSize()}`
  )
  // the last chunk of the VDI, not of the disk
  const lastChunkIndex = Math.ceil(virtualSize / XVA_DISK_CHUNK_LENGTH) - 1

  let lastWrittenIndex = -1
  let lastWrittenAt = Date.now()
  async function write(index, data) {
    await writeChunk(pack, data, formatBlockPath(basePath, index))
    lastWrittenIndex = index
    lastWrittenAt = Date.now()
  }

  for await (const { index, data } of xvaChunks(disk)) {
    if (lastWrittenIndex === -1 && index > 0) {
      // first chunk must be present
      await write(0, EMPTY_CHUNK)
    }
    if (
      index === 0 ||
      // last chunk must be present
      index === lastChunkIndex ||
      // ignore empty chunks
      !isEmpty(data) ||
      Date.now() - lastWrittenAt > MAX_INTERVAL_BETWEEN_CHUNKS
    ) {
      await write(index, data)
    }
  }

  if (lastWrittenIndex === -1) {
    await write(0, EMPTY_CHUNK)
  }
  if (lastWrittenIndex < lastChunkIndex) {
    await write(lastChunkIndex, EMPTY_CHUNK)
  }
}
