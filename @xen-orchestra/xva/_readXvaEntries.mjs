import { createGunzip, createZstdDecompress } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import { readChunk, readChunkStrict } from '@vates/read-chunk'
import tar from 'tar-stream'

const GZIP_MAGIC = Buffer.from([0x1f, 0x8b])
const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])

const noop = Function.prototype

/**
 * detect the compression of a XVA from its first bytes, which are put back in the stream
 *
 * xapi exports a plain tar, or a gzip/zstd compressed one depending on `use_compression`
 *
 * @param {import('node:stream').Readable} stream
 * @returns {Promise<'gzip'|'zstd'|undefined>}
 */
export async function detectCompression(stream) {
  // read(size) is not supported by all the streams (e.g. the pack of tar-stream): read what is available
  let head = await readChunkStrict(stream)
  let more
  while (head.length < ZSTD_MAGIC.length && (more = await readChunk(stream)) !== null) {
    head = Buffer.concat([head, more])
  }
  stream.unshift(head)
  if (head.subarray(0, GZIP_MAGIC.length).equals(GZIP_MAGIC)) {
    return 'gzip'
  }
  if (head.subarray(0, ZSTD_MAGIC.length).equals(ZSTD_MAGIC)) {
    return 'zstd'
  }
}

/**
 * iterate over the entries of a XVA, decompressing it if needed
 *
 * the stream of an entry must be consumed before moving to the next entry
 *
 * @param {import('node:stream').Readable} stream
 * @returns {AsyncGenerator<{ name: string, size: number, stream: import('node:stream').Readable }>}
 */
export async function* readXvaEntries(stream) {
  const compression = await detectCompression(stream)
  const extract = tar.extract()
  const streams = [stream]
  if (compression === 'gzip') {
    streams.push(createGunzip())
  } else if (compression === 'zstd') {
    streams.push(createZstdDecompress())
  }
  streams.push(extract)
  // an error in any stream (or an early end of the iteration) destroys all of them:
  // it reaches the consumer through the iteration on extract, nothing more to do with the promise
  pipeline(streams).catch(noop)

  for await (const entry of extract) {
    yield { name: entry.header.name, size: entry.header.size, stream: entry }
  }
}
