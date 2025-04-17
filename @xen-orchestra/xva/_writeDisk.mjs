import { formatBlockPath } from './_formatBlockPath.mjs'
import { fromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
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

export default async function addDisk(pack, rawStream, basePath) {
  let counter = 0
  let written
  let lastBlockWrittenAt = Date.now()
  const MAX_INTERVAL_BETWEEN_BLOCKS = 60 * 1000
  const empty = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)
  let lastBlockLength
  const diskSize = vhd.footer.currentSize
  let remaining = diskSize
  while (remaining > 0) {
    lastBlockLength = Math.min(XVA_DISK_CHUNK_LENGTH, remaining)
    const data = await readChunkStrict(rawStream, lastBlockLength)
    remaining -= lastBlockLength
    if (
      // write first block
      counter === 0 ||
      // write all non empty blocks
      !data.equals(empty) ||
      // write one block from time to time to ensure there is no timeout
      // occurring while passing empty blocks
      Date.now() - lastBlockWrittenAt > MAX_INTERVAL_BETWEEN_BLOCKS
    ) {
      written = true
      await writeBlock(pack, data, formatBlockPath(basePath, counter))
      lastBlockWrittenAt = Date.now()
    } else {
      written = false
    }
    counter++
  }
  if (!written) {
    // last block must be present
    await writeBlock(pack, empty, formatBlockPath(basePath, counter - 1))
  }
}
