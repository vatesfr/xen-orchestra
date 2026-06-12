import { DiskLargerBlock, DiskSmallerBlock } from '@xen-orchestra/disk-transform'
import { formatBlockPath } from './_formatBlockPath.mjs'

export const XVA_DISK_CHUNK_LENGTH = 1024 * 1024
export default async function addDisk(pack, disk, basePath) {
  let diskXvaChunk
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
    let writeBlock = false
    let block
    if (counter === 0 || counter === nbBlocks - 1) {
      writeBlock = true // first and last block must be present in xva disks
    }
    if (writeBlock || diskXvaChunk.hasBlock(counter)) {
      block = await diskXvaChunk.readBlock(counter)
      // ignore empty chunks that are not first or last
      writeBlock = writeBlock || !block.data.equals(empty)
    }
    if (writeBlock) {
      await writeBlock(pack, block.data, formatBlockPath(basePath, counter))
    }
  }
}
