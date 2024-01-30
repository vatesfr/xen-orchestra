import { fromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import { XXHash64 } from 'xxhash'

async function writeBlock(pack, data, name) {
  await fromCallback.call(pack, pack.entry, { name }, data)
  const hasher = new XXHash64(0)
  hasher.update(data)
  // weirdly, ocaml and xxhash return the bytes in reverse order to each other
  const hash = hasher.digest().reverse().toString('hex').toUpperCase()
  await fromCallback.call(pack, pack.entry, { name: `${name}.xxhash` }, Buffer.from(hash, 'utf8'))
}
export default async function addDisk(pack, vhd, basePath) {
  let counter = 0
  let written
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

    if (counter === 0 || !data.equals(empty)) {
      written = true
      await writeBlock(pack, data, `${basePath}/${('' + counter).padStart(8, '0')}`)
    } else {
      written = false
    }
    counter++
  }
  if (!written) {
    // last block must be present
    writeBlock(pack, empty.slice(0, lastBlockLength), `${basePath}/${counter}`)
  }
}
