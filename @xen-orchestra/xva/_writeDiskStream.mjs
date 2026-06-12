import { formatBlockPath } from './_formatBlockPath.mjs'
import { readChunkStrict } from '@vates/read-chunk'
import { writeChunk } from './_writeChunkInXva.mjs'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

export default async function addDisk(pack, vhd, basePath) {
  let counter = 0
  let written
  let lastBlockWrittenAt = Date.now()
  const MAX_INTERVAL_BETWEEN_BLOCKS = 60 * 1000
  const empty = Buffer.alloc(XVA_DISK_CHUNK_LENGTH, 0)
  const stream = await vhd.rawContent()
  let lastBlockLength
  const diskSize = vhd.footer.currentSize
  let remaining = diskSize
  while (remaining > 0) {
    lastBlockLength = Math.min(XVA_DISK_CHUNK_LENGTH, remaining)
    const data = await readChunkStrict(stream, lastBlockLength)
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
      await writeChunk(pack, data, formatBlockPath(basePath, counter))
      lastBlockWrittenAt = Date.now()
    } else {
      written = false
    }
    counter++
  }
  if (!written) {
    // last block must be present
    await writeChunk(pack, empty, formatBlockPath(basePath, counter - 1))
  }
}
