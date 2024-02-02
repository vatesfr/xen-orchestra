import { formatBlockPath } from './_formatBlockPath.mjs'
import { fromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import { xxhash64 } from 'hash-wasm'

async function writeBlock(pack, data, name) {
  await fromCallback.call(pack, pack.entry, { name }, data)
  // weirdly, ocaml and xxhash return the bytes in reverse order to each other
  const hash = (await xxhash64(data)).toString('hex').toUpperCase()
  await fromCallback.call(pack, pack.entry, { name: `${name}.xxhash` }, Buffer.from(hash, 'utf8'))
}
export default async function addDisk(pack, vhd, basePath) {
  let counter = 0
  let written
  let lastBlockWrittenAt = Date.now()
  const MAX_INTERVAL_BETWEEN_BLOCKS = 60 * 1000
  const chunk_length = 1024 * 1024
  const empty = Buffer.alloc(chunk_length, 0)
  const stream = await vhd.rawContent()
  let lastBlockLength
  const diskSize = vhd.footer.currentSize
  let remaining = diskSize
  while (remaining > 0) {
    const data = await readChunkStrict(stream, Math.min(chunk_length, remaining))
    lastBlockLength = data.length
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
    writeBlock(pack, empty.slice(0, lastBlockLength), `${basePath}/${('' + counter).padStart(8, '0')}`)
  }
}
