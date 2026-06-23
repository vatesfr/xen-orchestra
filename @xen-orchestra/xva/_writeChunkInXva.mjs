import { fromCallback } from 'promise-toolbox'
import { xxhash64 } from 'hash-wasm'
import { XVA_DISK_CHUNK_LENGTH } from './_constants.mjs'

async function addEntry(pack, name, buffer) {
  await fromCallback.call(pack, pack.entry, { name }, buffer)
}

export async function writeChunk(pack, data, name) {
  if (data.length < XVA_DISK_CHUNK_LENGTH) {
    data = Buffer.concat([data, Buffer.alloc(XVA_DISK_CHUNK_LENGTH - data.length, 0)])
  }
  await addEntry(pack, name, data)
  const hash = (await xxhash64(data)).toString('hex').toUpperCase()
  await addEntry(pack, `${name}.xxhash`, Buffer.from(hash, 'utf8'))
}
