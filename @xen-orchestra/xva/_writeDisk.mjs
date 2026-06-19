import { DiskLargerBlock, DiskSmallerBlock } from '@xen-orchestra/disk-transform'
import { formatBlockPath } from './_formatBlockPath.mjs'
import { writeChunk } from './_writeChunkInXva.mjs'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

export default async function addDisk(pack, disk, basePath) {
  let diskXvaChunk
  let lastBlockWrittenAt = Date.now()
  const MAX_INTERVAL_BETWEEN_BLOCKS = 60 * 1000
  if (disk.getBlockSize() < XVA_DISK_CHUNK_LENGTH) {
    diskXvaChunk = new DiskLargerBlock(disk, XVA_DISK_CHUNK_LENGTH)
  } else if (disk.getBlockSize() > XVA_DISK_CHUNK_LENGTH) {
    diskXvaChunk = new DiskSmallerBlock(disk, XVA_DISK_CHUNK_LENGTH)
  } else {
    diskXvaChunk = disk
  }
  const empty = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)
  const nbBlocks = Math.ceil(diskXvaChunk.getVirtualSize() / diskXvaChunk.getBlockSize())

  for (let counter = 0; counter < nbBlocks; counter++) {
    let mustWriteBlock = false
    let block
    if (counter === 0 || counter === nbBlocks - 1) {
      mustWriteBlock = true // first and last block must be present in xva disks
    }
    // write one block from time to time to ensure there is no timeout
    // occurring while passing empty blocks
    if (Date.now() - lastBlockWrittenAt > MAX_INTERVAL_BETWEEN_BLOCKS) {
      mustWriteBlock = true
      lastBlockWrittenAt = Date.now()
    }
    if (mustWriteBlock || diskXvaChunk.hasBlock(counter)) {
      block = await diskXvaChunk.readBlock(counter)
      // ignore empty chunks that are not first or last
      mustWriteBlock = mustWriteBlock || !block.data.equals(empty)
    }
    if (mustWriteBlock) {
      await writeChunk(pack, block.data, formatBlockPath(basePath, counter))
    }
  }
}
