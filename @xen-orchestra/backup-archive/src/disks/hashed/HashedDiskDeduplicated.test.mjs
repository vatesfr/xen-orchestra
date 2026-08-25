import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { HashedDiskDeduplicated } from './HashedDiskDeduplicated.mts'
import {
  asBlockHash,
  BlockAllocationTable,
  blockRelPath,
  buildBlockHeader,
  CODEC_BROTLI,
  CODEC_RAW,
  decodeBlock,
  HASH_SIZE,
  HBD_HEADER_SIZE,
  HBD_MAGIC,
  parseBlockHeader,
  sha256hex,
} from './hbdPaths.mts'

const { beforeEach, afterEach, describe } = test

const BLOCK_SIZE = 4096
const VIRTUAL_SIZE = BLOCK_SIZE * 10

let tempDir, handler, diskDir, diskPath

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  diskDir = `xo-vm-backups/VMUUID/vdis/${uuid.v4()}`
  diskPath = `${diskDir}/20260814T120000000Z.hbd`
})

afterEach(async () => {
  await handler.forget()
  await rimraf(tempDir)
})

const createDisk = (opts = {}) =>
  HashedDiskDeduplicated.create({
    handler,
    path: diskPath,
    virtualSize: VIRTUAL_SIZE,
    blockSize: BLOCK_SIZE,
    uuid: 'disk-uuid',
    ...opts,
  })

const block = byte => Buffer.alloc(BLOCK_SIZE, byte)

const countBlockFiles = () =>
  handler
    .list(`xo-vm-backups/VMUUID/vdis`, { prependDir: true })
    .then(() => listFiles('xo-vm-backups'))
    .then(files => files.filter(file => file.includes('/blocks/')).length)

async function listFiles(dir) {
  const found = []
  for (const entry of await handler.list(dir, { prependDir: true })) {
    try {
      found.push(...(await listFiles(entry)))
    } catch (error) {
      if (error.code !== 'ENOTDIR') {
        throw error
      }
      found.push(entry)
    }
  }
  return found
}

describe('hbdPaths', () => {
  test('blockRelPath splits the hash into 4 segments of 16 chars', () => {
    const hash = sha256hex(Buffer.from('x'))
    const segments = blockRelPath(hash).split('/')
    assert.equal(segments.length, 4)
    segments.forEach(segment => assert.equal(segment.length, 16))
    assert.equal(segments.join(''), hash)
  })

  test('asBlockHash rejects anything that is not a lowercase sha256 hex', () => {
    assert.throws(() => asBlockHash('deadbeef'), /not a valid block hash/)
    assert.throws(() => asBlockHash('Z'.repeat(64)), /not a valid block hash/)
    assert.doesNotThrow(() => asBlockHash(sha256hex(Buffer.from('x'))))
  })

  test('block header round trips, and its magic reads as HBD in a dump', () => {
    const hash = sha256hex(Buffer.from('payload'))
    const header = buildBlockHeader(hash, CODEC_BROTLI, 1786807233123)

    assert.equal(header.length, HBD_HEADER_SIZE)
    assert.equal(header.subarray(0, 4).toString('latin1'), 'HBD\0')

    assert.deepEqual(parseBlockHeader(header), {
      magic: HBD_MAGIC,
      codec: CODEC_BROTLI,
      verifiedAt: 1786807233123,
      payloadHash: hash,
    })

    // reserved ranges must stay zeroed
    assert.ok(header.subarray(5, 8).every(byte => byte === 0))
    assert.ok(header.subarray(48, HBD_HEADER_SIZE).every(byte => byte === 0))
  })

  test('buildBlockHeader defaults to raw, never verified', () => {
    const header = parseBlockHeader(buildBlockHeader(sha256hex(Buffer.from('x'))))
    assert.equal(header.codec, CODEC_RAW)
    assert.equal(header.verifiedAt, 0)
  })

  test('decodeBlock returns the payload, and rejects every way it can be wrong', () => {
    const data = block(0x42)
    const hash = sha256hex(data)
    const valid = Buffer.concat([buildBlockHeader(hash), data])

    assert.ok(decodeBlock(valid, BLOCK_SIZE, hash).payload.equals(data))

    assert.throws(() => decodeBlock(valid.subarray(0, valid.length - 1), BLOCK_SIZE, hash), /truncated block/)

    const badMagic = Buffer.from(valid)
    badMagic.writeUInt32BE(0xdeadbeef, 0)
    assert.throws(() => decodeBlock(badMagic, BLOCK_SIZE, hash), /not a hbd block/)

    // right path, content of another hash
    assert.throws(() => decodeBlock(valid, BLOCK_SIZE, sha256hex(block(0x43))), /block hash mismatch/)

    // payload rotted while the header still claims the old hash
    const corrupted = Buffer.from(valid)
    corrupted[HBD_HEADER_SIZE + 10] ^= 0xff
    assert.throws(() => decodeBlock(corrupted, BLOCK_SIZE, hash), /block corruption on read/)
  })

  test('BlockAllocationTable stores hashes per entry, not per byte', () => {
    const bat = BlockAllocationTable.allocate(10)
    const hash = sha256hex(Buffer.from('x'))

    assert.ok(bat.isEmpty(0))
    assert.equal(bat.countAllocated(), 0)
    assert.deepEqual(bat.indexes(), [])

    bat.set(9, hash)
    assert.equal(bat.get(9), hash)
    assert.ok(!bat.isEmpty(9))
    assert.ok(bat.isEmpty(8), 'writing entry 9 must not touch entry 8')
    assert.deepEqual(bat.indexes(), [9])
    assert.equal(bat.toBuffer().length, 10 * HASH_SIZE)

    assert.throws(() => bat.get(10), /out of range/)
    assert.throws(() => bat.get(-1), /out of range/)
  })

  test('BlockAllocationTable.fromBuffer refuses a size mismatch unless forced', () => {
    const short = Buffer.alloc(5 * HASH_SIZE)
    assert.throws(() => BlockAllocationTable.fromBuffer(short, 10), /unexpected hashes file size/)

    const forced = BlockAllocationTable.fromBuffer(short, 10, true)
    assert.equal(forced.indexes().length, 0)
    assert.throws(() => forced.get(5), /out of range/, 'the smaller count is authoritative')
  })
})

describe('HashedDiskDeduplicated', () => {
  test('create then init exposes an empty disk', async () => {
    const disk = await createDisk()

    assert.equal(disk.getVirtualSize(), VIRTUAL_SIZE)
    assert.equal(disk.getBlockSize(), BLOCK_SIZE)
    assert.equal(disk.getMaxBlockCount(), 10)
    assert.equal(disk.getPath(), diskPath)
    assert.equal(disk.isDifferencing(), false)
    assert.deepEqual(disk.getBlockIndexes(), [])
    assert.equal(disk.getSizeOnDisk(), 0)
    assert.equal(disk.hasBlock(0), false)
  })

  test('a differencing disk reports its parent', async () => {
    const disk = await createDisk({ parentUuid: 'parent-uuid', parentPath: './parent.hbd' })
    assert.equal(disk.isDifferencing(), true)
    assert.equal(disk.getParentUuid(), 'parent-uuid')
    // relative to the hbd file's directory, normalized with a leading slash
    assert.equal(disk.getParentPath(), `/${diskDir}/parent.hbd`)
  })

  test('writes and reads back the exact bytes', async () => {
    const disk = await createDisk()
    const data = block(0xaa)

    assert.equal(await disk.writeBlock({ index: 3, data }), BLOCK_SIZE)

    assert.ok(disk.hasBlock(3))
    assert.deepEqual(disk.getBlockIndexes(), [3])
    assert.ok((await disk.readBlock(3)).data.equals(data))
  })

  test('the same payload at two indexes is stored once', async () => {
    const disk = await createDisk()
    const shared = block(0xaa)

    await disk.writeBlock({ index: 0, data: shared })
    await disk.writeBlock({ index: 1, data: block(0xbb) })
    await disk.writeBlock({ index: 7, data: shared })

    assert.equal(disk.getBlockHashAt(0), disk.getBlockHashAt(7))
    assert.equal(await countBlockFiles(), 2, '3 writes, 2 unique payloads')

    // virtual usage, not the deduplicated footprint
    assert.equal(disk.getSizeOnDisk(), 3 * BLOCK_SIZE)
  })

  test('rejects a block that is not exactly blockSize, and an unallocated read', async () => {
    const disk = await createDisk()

    await assert.rejects(() => disk.writeBlock({ index: 0, data: Buffer.alloc(10) }), /expected a 4096 bytes block/)
    await assert.rejects(() => disk.readBlock(0), /no block at index 0/)
  })

  test('close flushes, and a reopened disk sees the same blocks', async () => {
    const disk = await createDisk()
    const data = block(0xaa)
    await disk.writeBlock({ index: 2, data })
    await disk.close()

    const reopened = new HashedDiskDeduplicated({ handler, path: diskPath })
    await reopened.init()

    assert.deepEqual(reopened.getBlockIndexes(), [2])
    assert.ok((await reopened.readBlock(2)).data.equals(data))
  })

  test('flushMetadata writes a new hashes file and never overwrites the previous one', async () => {
    const disk = await createDisk()
    const first = disk.getMetadata().hashesPath

    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()
    const second = disk.getMetadata().hashesPath

    assert.notEqual(second, first)
    const hashesFiles = (await listFiles('xo-vm-backups')).filter(file => file.endsWith('.hash'))
    assert.equal(hashesFiles.length, 2, 'the file the hbd used to point at is left for check()')
  })

  test('a corrupted block file is detected on read', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })

    const [blockFile] = (await listFiles('xo-vm-backups')).filter(file => file.includes('/blocks/'))
    const buffer = await handler.readFile(blockFile)
    buffer[HBD_HEADER_SIZE + 1] ^= 0xff
    await handler.writeFile(blockFile, buffer, { flags: 'w' })

    await assert.rejects(() => disk.readBlock(0), /block corruption on read/)
  })

  test('unlink removes every file of the disk', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.close()

    await disk.unlink()

    assert.deepEqual(await listFiles('xo-vm-backups'), [])
  })

  test('the merge lifecycle is not implemented yet', async () => {
    const disk = await createDisk()
    await assert.rejects(() => disk.mergeBlock(disk, 0, false), /must be implemented/)
    await assert.rejects(() => disk.rename('other.hbd'), /must be implemented/)
  })
})
