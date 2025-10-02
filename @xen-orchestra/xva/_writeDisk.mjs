import { formatBlockPath } from './_formatBlockPath.mjs'
import { fromCallback } from 'promise-toolbox'
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

export async function writeDisk(pack, disk, basePath) {
  let counter = 0
  let lastBlockWrittenAt = Date.now()
  const MAX_INTERVAL_BETWEEN_BLOCKS = 60 * 1000
  const empty = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)
  let previousIndex = -1
  for await (const { index, data } of disk.diskBlocks()) {
    if (index <= previousIndex) {
      throw new Error('Block must be sent in ascending order')
    }
    previousIndex = index
    if (data.length > XVA_DISK_CHUNK_LENGTH) {
      throw new Error(`Block must be at most ${XVA_DISK_CHUNK_LENGTH} bytes, got ${data.length}`)
    }
    if (
      // write first block
      counter === 0 ||
      // write all non empty blocks
      !data.equals(empty) ||
      // write one block from time to time to ensure there is no timeout
      // occurring while passing empty blocks
      Date.now() - lastBlockWrittenAt > MAX_INTERVAL_BETWEEN_BLOCKS
    ) {
      await writeBlock(pack, data, formatBlockPath(basePath, counter))
      lastBlockWrittenAt = Date.now()
    }
    counter++
  }
  const lastBlockCounter = Math.floor(disk.getVirtualSize() / XVA_DISK_CHUNK_LENGTH) - 1
  if (counter === 0) {
    // last block must be present
    await writeBlock(pack, empty, formatBlockPath(basePath, 1))
  }
  if (counter < lastBlockCounter) {
    // last block must be present
    await writeBlock(pack, empty, formatBlockPath(basePath, lastBlockCounter))
  }
}
