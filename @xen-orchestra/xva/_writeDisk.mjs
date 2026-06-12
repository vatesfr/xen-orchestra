import { DiskLargerBlock, DiskSmallerBlock } from '@xen-orchestra/disk-transform'
import { fromCallback } from 'promise-toolbox'
import { formatBlockPath } from './_formatBlockPath.mjs'
import { xxhash64 } from 'hash-wasm'

export const XVA_DISK_CHUNK_LENGTH = 1024 * 1024
async function addEntry(pack, name, buffer) {
  await fromCallback.call(pack, pack.entry, { name }, buffer)
}

async function writeBlock(pack, data, name) {
  if (data.length < XVA_DISK_CHUNK_LENGTH) {
    data = Buffer.concat([data, Buffer.alloc(XVA_DISK_CHUNK_LENGTH - data.length, 0)])
  }
  await addEntry(pack, name, data)
  // weirdly, ocaml and xxhash return the bytes in reverse order to each other
  const hash = (await xxhash64(data)).toString('hex').toUpperCase()
  await addEntry(pack, `${name}.xxhash`, Buffer.from(hash, 'utf8'))
}

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
    let mustWriteBlock = false
    let block
    if (counter === 0 || counter === nbBlocks - 1) {
      mustWriteBlock = true // first and last block must be present in xva disks
    }
    if (mustWriteBlock || diskXvaChunk.hasBlock(counter)) {
      block = await diskXvaChunk.readBlock(counter)
      // ignore empty chunks that are not first or last
      mustWriteBlock = mustWriteBlock || !block.data.equals(empty)
    }
    if (mustWriteBlock) {
      await writeBlock(pack, block.data, formatBlockPath(basePath, counter))
    }
  }
}
