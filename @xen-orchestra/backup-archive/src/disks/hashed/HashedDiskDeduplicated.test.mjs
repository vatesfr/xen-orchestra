import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

import tmp from 'tmp'
import * as uuid from 'uuid'
import { getHandler, NotImplementedError } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import {
  asBlockHash,
  BlockAllocationTable,
  blockRelPath,
  buildBlockHeader,
  CODEC_BROTLI,
  CODEC_RAW,
  decodeBlock,
  HASH_SIZE,
  HashedDiskDeduplicated,
  HBD_HEADER_SIZE,
  HBD_MAGIC,
  parseBlockHeader,
  sha256hex,
} from '@xen-orchestra/backup-archive/disks/hashed'

const { beforeEach, afterEach, describe } = test

const BLOCK_SIZE = 4096
const VIRTUAL_SIZE = BLOCK_SIZE * 10
const DISK_UUID = '3a0c1f6e-2b7d-4e58-9f21-6c8d4b0a7e13'

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
    uuid: DISK_UUID,
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

  test('BlockAllocationTable.set refuses a hash it would only write partially', () => {
    const bat = BlockAllocationTable.allocate(2)
    const hash = sha256hex(Buffer.from('x'))
    bat.set(0, hash)

    // a short or non-hex hash writes a prefix and leaves the rest of the entry
    for (const bad of ['deadbeef', 'Z'.repeat(64), hash.toUpperCase(), hash + '00', '../../..']) {
      assert.throws(() => bat.set(0, bad), /not a valid block hash/)
    }

    assert.equal(bat.get(0), hash, 'a rejected set leaves the entry untouched')
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
    assert.equal(disk.getPath(), `/${diskPath}`, 'paths are normalized on the way in')
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

  test('every init failure names the file it is about', async () => {
    const disk = await createDisk()
    const { hashesPath } = disk.getMetadata()
    const reopen = () => new HashedDiskDeduplicated({ handler, path: diskPath }).init()
    const writeHbd = metadata => handler.writeFile(diskPath, JSON.stringify(metadata), { flags: 'w' })

    // the odd one out: the offending file is the hashes file, not the hbd
    await handler.writeFile(`${diskDir}/${hashesPath}`, Buffer.alloc(HASH_SIZE), { flags: 'w' })
    await assert.rejects(reopen, error => {
      assert.equal(error.path, `/${diskDir}/${hashesPath}`)
      assert.match(error.message, /unexpected hashes file size/)
      return true
    })

    await writeHbd({ ...disk.getMetadata(), version: '99.0.0' })
    await assert.rejects(reopen, error => {
      assert.equal(error.path, `/${diskPath}`)
      assert.match(error.message, /Unsupported hbd version 99\.0\.0/)
      return true
    })

    await writeHbd({ ...disk.getMetadata(), blockSize: 0 })
    await assert.rejects(reopen, error => {
      assert.equal(error.path, `/${diskPath}`)
      assert.match(error.message, /invalid blockSize 0/)
      return true
    })

    await handler.writeFile(diskPath, '{ not json', { flags: 'w' })
    await assert.rejects(reopen, error => {
      assert.equal(error.path, `/${diskPath}`)
      assert.ok(error.cause instanceof SyntaxError, 'the original error is kept as the cause')
      return true
    })

    await assert.rejects(
      () => new HashedDiskDeduplicated({ handler, path: `${diskDir}/absent.hbd` }).init(),
      error => error.path === `/${diskDir}/absent.hbd`
    )
  })

  test('refuses to open a disk whose metadata points outside of its own data directory', async () => {
    const disk = await createDisk()
    const metadata = disk.getMetadata()
    const reopen = () => new HashedDiskDeduplicated({ handler, path: diskPath }).init()
    const writeHbd = patch => handler.writeFile(diskPath, JSON.stringify({ ...metadata, ...patch }), { flags: 'w' })
    const escapes = dir => new RegExp(`escapes ${dir} \\(in `)

    await writeHbd({ hashesPath: '../../../../hashes.1.hash' })
    await assert.rejects(reopen, escapes(`/${diskDir}/data/${DISK_UUID}`))

    // inside the disk directory, but belonging to a sibling disk of the chain
    await writeHbd({ hashesPath: `data/${uuid.v4()}/hashes.1.hash` })
    await assert.rejects(reopen, escapes(`/${diskDir}/data/${DISK_UUID}`))

    // the data dir is named from the blocks path, which must still sit in it
    await writeHbd({ localBlocksPath: `elsewhere/${DISK_UUID}/blocks/` })
    await assert.rejects(reopen, escapes(`/${diskDir}/data/${DISK_UUID}`))

    // `.` and `..` resolve back to a directory holding other disks, and a
    // containment check accepts them: only the uuid format rules them out
    for (const broken of ['..', '.', 'not-a-uuid']) {
      await writeHbd({ localBlocksPath: `data/${broken}/blocks/` })
      await assert.rejects(reopen, new RegExp(`not a valid uuid: ${broken.replace(/\./g, '\\.')} \\(in `))
    }

    // and the whole disk directory is still there
    await writeHbd({})
    await reopen()
  })

  test('a disk whose uuid changed still finds its data directory', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.close()

    // what a merge does: the parent takes its child's uuid
    const metadata = { ...disk.getMetadata(), uuid: uuid.v4() }
    await handler.writeFile(diskPath, JSON.stringify(metadata), { flags: 'w' })

    const reopened = new HashedDiskDeduplicated({ handler, path: diskPath })
    await reopened.init()
    assert.ok((await reopened.readBlock(0)).data.equals(block(0xaa)))
    assert.deepEqual(await reopened.listAssociatedFiles('xo-vm-backups'), [
      `/${diskPath}`,
      `/${diskDir}/data/${DISK_UUID}`,
    ])
  })

  test('a failed init leaves the disk closed, so a retry really retries', async () => {
    const disk = await createDisk()
    const { hashesPath } = disk.getMetadata()
    const truncated = await handler.readFile(`${diskDir}/${hashesPath}`)

    await handler.writeFile(`${diskDir}/${hashesPath}`, Buffer.alloc(HASH_SIZE), { flags: 'w' })
    const reopened = new HashedDiskDeduplicated({ handler, path: diskPath })
    await assert.rejects(() => reopened.init(), /unexpected hashes file size/)

    // the disk must not consider itself open: fix the file, init again
    await handler.writeFile(`${diskDir}/${hashesPath}`, truncated, { flags: 'w' })
    await reopened.init()

    assert.equal(reopened.getMaxBlockCount(), 10)
    assert.deepEqual(reopened.getBlockIndexes(), [])
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

  test('flushMetadata writes a new hashes file, then removes the previous one', async () => {
    const disk = await createDisk()
    const first = disk.getMetadata().hashesPath

    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()
    const second = disk.getMetadata().hashesPath

    assert.notEqual(second, first)
    const hashesFiles = (await listFiles('xo-vm-backups')).filter(file => file.endsWith('.hash'))
    assert.deepEqual(hashesFiles, [`/${diskDir}/${second}`])
  })

  test('two flushes in a row get distinct hashes files', async () => {
    const disk = await createDisk()
    await disk.flushMetadata()
    const first = disk.getMetadata().hashesPath
    await disk.flushMetadata()

    assert.notEqual(disk.getMetadata().hashesPath, first)
  })

  test('a previous hashes file that cannot be removed does not fail the flush', async () => {
    const disk = await createDisk()
    handler.unlink = async () => {
      throw new Error('unlink failed')
    }

    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()

    const reopened = new HashedDiskDeduplicated({ handler, path: diskPath })
    await reopened.init()
    assert.ok((await reopened.readBlock(0)).data.equals(block(0xaa)))
  })

  test('overwriting an index leaves the block it dropped on the remote', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()

    await disk.writeBlock({ index: 0, data: block(0xbb) })
    await disk.flushMetadata()

    assert.equal(await countBlockFiles(), 1)
    assert.ok((await disk.readBlock(0)).data.equals(block(0xbb)))
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

  test('listAssociatedFiles claims the data dir as a whole, not one entry per block', async () => {
    const disk = await createDisk()
    for (let index = 0; index < 5; index++) {
      await disk.writeBlock({ index, data: block(index) })
    }

    const claimed = await disk.listAssociatedFiles('xo-vm-backups')

    // 5 blocks on disk, still 2 claims: the hbd and the directory holding them
    assert.deepEqual(claimed, [`/${diskPath}`, `/${diskDir}/data/${DISK_UUID}`])
  })

  test('listAssociatedFiles drops what falls outside the requested dir', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })

    assert.deepEqual(await disk.listAssociatedFiles('/somewhere/else'), [])
  })

  test('unlink removes every file of the disk', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.close()

    await disk.unlink()

    assert.deepEqual(await listFiles('xo-vm-backups'), [])
  })
})

describe('HashedDiskDeduplicated with a block store', () => {
  const STORE = 'xo-block-store'

  const createSharedDisk = async ({ blockStorePath = STORE } = {}) => {
    const dir = `xo-vm-backups/VMUUID/vdis/${uuid.v4()}`
    const diskUuid = uuid.v4()
    const path = `${dir}/20260814T120000000Z.hbd`
    const disk = await HashedDiskDeduplicated.create({
      handler,
      path,
      virtualSize: VIRTUAL_SIZE,
      blockSize: BLOCK_SIZE,
      uuid: diskUuid,
      dedupType: 'PER_BACKUP_REPOSITORY',
      blockStorePath,
    })
    return { disk, path, tmpDir: `${dir}/data/${diskUuid}/blocks/.tmp` }
  }

  const nlink = async path => (await stat(join(tempDir, path))).nlink

  test('create refuses PER_BACKUP_REPOSITORY without a blockStorePath, and writes nothing', async () => {
    await assert.rejects(
      () => createDisk({ dedupType: 'PER_BACKUP_REPOSITORY' }),
      /Can't init PER_BACKUP_REPOSITORY without blockStorePath/
    )
    await assert.rejects(() => listFiles('xo-vm-backups'), { code: 'ENOENT' })
  })

  test('create records the dedup type in the metadata, but not the store path', async () => {
    const { disk } = await createSharedDisk()
    const metadata = disk.getMetadata()

    assert.equal(metadata.dedupType, 'PER_BACKUP_REPOSITORY')
    assert.ok(!JSON.stringify(metadata).includes(STORE), 'the store location must not be remote-controlled')
  })

  test('two disks writing the same payload share one inode', async () => {
    const { disk: a } = await createSharedDisk()
    const { disk: b } = await createSharedDisk()
    const data = block(0xaa)

    await a.writeBlock({ index: 0, data })
    await b.writeBlock({ index: 3, data })

    const storeFiles = await listFiles(STORE)
    assert.equal(storeFiles.length, 1)
    assert.equal(await nlink(storeFiles[0]), 3, 'store copy + one link per disk')

    assert.ok((await a.readBlock(0)).data.equals(data))
    assert.ok((await b.readBlock(3)).data.equals(data))
  })

  test('five writes of three unique payloads across two disks give three store files', async () => {
    const { disk: a } = await createSharedDisk()
    const { disk: b } = await createSharedDisk()

    await a.writeBlock({ index: 0, data: block(1) })
    await a.writeBlock({ index: 1, data: block(2) })
    await b.writeBlock({ index: 0, data: block(1) })
    await b.writeBlock({ index: 1, data: block(3) })
    await b.writeBlock({ index: 2, data: block(2) })

    assert.equal((await listFiles(STORE)).length, 3)
    // disk side: 2 links in a, 3 in b
    assert.equal(await countBlockFiles(), 5)
  })

  test('the same payload at two indexes of one disk is linked once', async () => {
    const { disk } = await createSharedDisk()
    const data = block(0xaa)

    await disk.writeBlock({ index: 0, data })
    await disk.writeBlock({ index: 7, data })

    const storeFiles = await listFiles(STORE)
    assert.equal(storeFiles.length, 1)
    assert.equal(await nlink(storeFiles[0]), 2, 'the second index hits EEXIST on the disk link')
    assert.equal(await countBlockFiles(), 1)
  })

  test('the temporary file of a store miss is removed', async () => {
    const { disk, tmpDir } = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })

    assert.deepEqual(await listFiles(tmpDir), [])
  })

  test('reads go through the disk link, never the store path', async () => {
    const { disk } = await createSharedDisk()
    const data = block(0xaa)
    await disk.writeBlock({ index: 0, data })

    const [storeFile] = await listFiles(STORE)
    await handler.unlink(storeFile, { checksum: false })

    assert.ok((await disk.readBlock(0)).data.equals(data))
  })

  test('a disk reopened without a store can still be read, but not written', async () => {
    const { disk, path } = await createSharedDisk()
    const data = block(0xaa)
    await disk.writeBlock({ index: 0, data })
    await disk.close()

    const reopened = new HashedDiskDeduplicated({ handler, path })
    await reopened.init()

    assert.ok((await reopened.readBlock(0)).data.equals(data))
    await assert.rejects(() => reopened.writeBlock({ index: 1, data: block(0xbb) }), /no blockStorePath was given/)
  })

  test('a handler without link fails at write time', async () => {
    const { disk } = await createSharedDisk()
    handler.link = async () => {
      throw new NotImplementedError()
    }

    await assert.rejects(() => disk.writeBlock({ index: 0, data: block(0xaa) }), NotImplementedError)
  })
})

describe('HashedDiskDeduplicated reference cleanup', () => {
  const STORE = 'xo-block-store'

  const createSharedDisk = async () => {
    const dir = `xo-vm-backups/VMUUID/vdis/${uuid.v4()}`
    return HashedDiskDeduplicated.create({
      handler,
      path: `${dir}/20260814T120000000Z.hbd`,
      virtualSize: VIRTUAL_SIZE,
      blockSize: BLOCK_SIZE,
      uuid: uuid.v4(),
      dedupType: 'PER_BACKUP_REPOSITORY',
      blockStorePath: STORE,
    })
  }

  // store directories are never removed, only their files
  const listStore = () =>
    listFiles(STORE).catch(error => {
      if (error.code === 'ENOENT') {
        return []
      }
      throw error
    })

  const nlink = async path => (await stat(join(tempDir, path))).nlink

  // the store holds exactly one file per hash still referenced by a live disk
  async function assertStoreConsistent(...disks) {
    const referenced = new Set()
    for (const disk of disks) {
      for (const index of disk.getBlockIndexes()) {
        referenced.add(disk.getBlockHashAt(index))
      }
    }
    assert.equal((await listStore()).length, referenced.size)
  }

  test('overwrite then flush releases the old block, store file included', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()

    await disk.writeBlock({ index: 0, data: block(0xbb) })
    await disk.flushMetadata()

    const storeFiles = await listStore()
    assert.equal(storeFiles.length, 1)
    assert.equal(await nlink(storeFiles[0]), 2)
    assert.equal(await countBlockFiles(), 1)
    assert.ok((await disk.readBlock(0)).data.equals(block(0xbb)))
    await assertStoreConsistent(disk)
  })

  test('the old block is released on the flush that follows the overwrite', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()
    await disk.writeBlock({ index: 0, data: block(0xbb) })

    assert.equal((await listStore()).length, 2, 'nothing is released before the flush')

    await disk.flushMetadata()
    assert.equal((await listStore()).length, 1)
  })

  test('overwriting one of two indexes holding a hash keeps its block', async () => {
    const disk = await createSharedDisk()
    const shared = block(0xaa)
    await disk.writeBlock({ index: 0, data: shared })
    await disk.writeBlock({ index: 5, data: shared })
    await disk.flushMetadata()

    await disk.writeBlock({ index: 0, data: block(0xbb) })
    await disk.flushMetadata()

    assert.ok((await disk.readBlock(5)).data.equals(shared))
    await assertStoreConsistent(disk)
  })

  test('a hash that moved to another index keeps its block', async () => {
    const disk = await createSharedDisk()
    const moved = block(0xaa)
    await disk.writeBlock({ index: 0, data: moved })
    await disk.flushMetadata()

    await disk.writeBlock({ index: 1, data: moved })
    await disk.writeBlock({ index: 0, data: block(0xbb) })
    await disk.flushMetadata()

    assert.ok((await disk.readBlock(1)).data.equals(moved))
    await assertStoreConsistent(disk)
  })

  test('a hash replaced before its first flush is released too', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.writeBlock({ index: 0, data: block(0xbb) })
    await disk.flushMetadata()

    assert.equal(await countBlockFiles(), 1)
    await assertStoreConsistent(disk)
  })

  test('a hash replaced then written back before the flush keeps its block', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.writeBlock({ index: 0, data: block(0xbb) })
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()

    assert.ok((await disk.readBlock(0)).data.equals(block(0xaa)))
    await assertStoreConsistent(disk)
  })

  test('a flush with no change leaves every link in place', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.flushMetadata()
    await disk.flushMetadata()

    const [storeFile] = await listStore()
    assert.equal(await nlink(storeFile), 2)
  })

  test('releasing a block shared with another disk keeps the store file', async () => {
    const a = await createSharedDisk()
    const b = await createSharedDisk()
    await a.writeBlock({ index: 0, data: block(0xaa) })
    await b.writeBlock({ index: 0, data: block(0xaa) })
    await a.flushMetadata()

    await a.writeBlock({ index: 0, data: block(0xbb) })
    await a.flushMetadata()

    assert.ok((await b.readBlock(0)).data.equals(block(0xaa)))
    await assertStoreConsistent(a, b)
  })

  test('unlinking disks releases the store file only with the last one', async () => {
    const a = await createSharedDisk()
    const b = await createSharedDisk()
    const shared = block(0xaa)
    await a.writeBlock({ index: 0, data: shared })
    await b.writeBlock({ index: 2, data: shared })
    await a.close()
    await b.close()

    await a.unlink()
    const [storeFile] = await listStore()
    assert.equal(await nlink(storeFile), 2, 'store copy + b')
    assert.ok((await b.readBlock(2)).data.equals(shared))

    await b.unlink()
    assert.deepEqual(await listStore(), [])
  })

  test('unlink releases blocks that were never flushed', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })

    await disk.unlink()

    assert.deepEqual(await listStore(), [])
    assert.deepEqual(await listFiles('xo-vm-backups'), [])
  })

  test('unlink releases a hash held at several indexes once', async () => {
    const disk = await createSharedDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.writeBlock({ index: 1, data: block(0xaa) })
    await disk.writeBlock({ index: 2, data: block(0xbb) })

    await disk.unlink()

    assert.deepEqual(await listStore(), [])
  })
})

describe('resize', () => {
  test('grows: old blocks kept, new indexes empty and writable', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 3, data: block(0xaa) })

    await disk.resize(20)

    assert.equal(disk.getMaxBlockCount(), 20)
    assert.ok((await disk.readBlock(3)).data.equals(block(0xaa)))
    assert.equal(disk.hasBlock(15), false)
    await disk.writeBlock({ index: 15, data: block(0xbb) })
    assert.ok((await disk.readBlock(15)).data.equals(block(0xbb)))
  })

  test('shrinks: dropped blocks are released by the next flush', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 2, data: block(0xaa) })
    await disk.writeBlock({ index: 8, data: block(0xbb) })
    await disk.flushMetadata()

    await disk.resize(5)
    await disk.flushMetadata()

    assert.equal(disk.getMaxBlockCount(), 5)
    assert.deepEqual(disk.getBlockIndexes(), [2])
    assert.equal(await countBlockFiles(), 1)
  })

  test('shrinking keeps a hash still used below the new size', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 2, data: block(0xaa) })
    await disk.writeBlock({ index: 8, data: block(0xaa) })
    await disk.flushMetadata()

    await disk.resize(5)
    await disk.flushMetadata()

    assert.ok((await disk.readBlock(2)).data.equals(block(0xaa)))
  })

  test('a resized and flushed disk reopens', async () => {
    const disk = await createDisk()
    await disk.resize(20)
    await disk.flushMetadata()

    const reopened = new HashedDiskDeduplicated({ handler, path: diskPath })
    await reopened.init()
    assert.equal(reopened.getMaxBlockCount(), 20)
  })

  test('the same size changes nothing', async () => {
    const disk = await createDisk()
    const before = disk.getMetadata()

    await disk.resize(10)

    assert.deepEqual(disk.getMetadata(), before)
  })
})

describe('merge', () => {
  const STORE = 'xo-block-store'

  const createSharedDisk = (opts = {}) =>
    HashedDiskDeduplicated.create({
      handler,
      path: `xo-vm-backups/VMUUID/vdis/${uuid.v4()}/20260814T120000000Z.hbd`,
      virtualSize: VIRTUAL_SIZE,
      blockSize: BLOCK_SIZE,
      uuid: uuid.v4(),
      dedupType: 'PER_BACKUP_REPOSITORY',
      blockStorePath: STORE,
      ...opts,
    })

  const nlink = async path => (await stat(join(tempDir, path))).nlink

  async function assertSameContent(disk, expected) {
    assert.deepEqual(disk.getBlockIndexes(), Object.keys(expected).map(Number))
    for (const [index, data] of Object.entries(expected)) {
      assert.ok((await disk.readBlock(Number(index))).data.equals(data), `index ${index}`)
    }
  }

  test('mergeBlock with the same hash on both sides writes nothing', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()
    await parent.writeBlock({ index: 0, data: block(0xaa) })
    await child.writeBlock({ index: 0, data: block(0xaa) })

    assert.equal(await parent.mergeBlock(child, 0, false), 0)

    const [storeFile] = await listFiles(STORE)
    assert.equal(await nlink(storeFile), 3, 'store copy + parent + child, no new link')
  })

  test('mergeBlock takes the child block and returns its size', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()
    await parent.writeBlock({ index: 0, data: block(0xaa) })
    await child.writeBlock({ index: 0, data: block(0xbb) })

    assert.equal(await parent.mergeBlock(child, 0, false), BLOCK_SIZE)

    assert.ok((await parent.readBlock(0)).data.equals(block(0xbb)))
  })

  test('mergeBlock refuses a child with another block size, before writing anything', async () => {
    const parent = await createSharedDisk()
    const child = await HashedDiskDeduplicated.create({
      handler,
      path: `xo-vm-backups/VMUUID/vdis/${uuid.v4()}/20260814T120000000Z.hbd`,
      virtualSize: VIRTUAL_SIZE,
      blockSize: BLOCK_SIZE * 2,
      uuid: uuid.v4(),
      dedupType: 'PER_BACKUP_REPOSITORY',
      blockStorePath: STORE,
    })
    await child.writeBlock({ index: 0, data: Buffer.alloc(BLOCK_SIZE * 2, 0xaa) })

    // refused by writeBlock's own size check, no extra check per mergeBlock
    await assert.rejects(() => parent.mergeBlock(child, 0, false), /expected a 4096 bytes block, got 8192/)
    assert.equal(parent.hasBlock(0), false)
  })

  test('a full merge leaves the child content, a consistent store and no child link', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()
    for (let index = 0; index < 5; index++) {
      await parent.writeBlock({ index, data: block(index) })
    }
    await parent.flushMetadata()
    // 3 changed, 2 shared with the parent
    const childContent = { 0: block(0x10), 1: block(1), 2: block(0x12), 3: block(3), 4: block(0x14) }
    for (const [index, data] of Object.entries(childContent)) {
      await child.writeBlock({ index: Number(index), data })
    }

    for (const index of child.getBlockIndexes()) {
      await parent.mergeBlock(child, index, false)
    }
    await parent.flushMetadata(child)

    await assertSameContent(parent, childContent)
    assert.equal((await listFiles(STORE)).length, 5, 'the 3 replaced parent blocks are released')
    for (const storeFile of await listFiles(STORE)) {
      assert.equal(await nlink(storeFile), 2, 'store copy + parent, the child links are gone')
    }
  })

  test('a resumed merge gets the skipped indexes back on flush', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()
    const childContent = {}
    for (let index = 0; index < 5; index++) {
      childContent[index] = block(0x20 + index)
      await child.writeBlock({ index, data: childContent[index] })
    }

    // a resume restarts at currentBlock: indexes 0 to 2 are never merged
    await parent.mergeBlock(child, 3, true)
    await parent.mergeBlock(child, 4, true)
    await parent.flushMetadata(child)

    await assertSameContent(parent, childContent)
  })

  test('a failed re-sync leaves the parent as it was on the remote', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()
    await child.writeBlock({ index: 0, data: block(0xaa) })
    await parent.flushMetadata()
    const { hashesPath } = parent.getMetadata()
    child.readBlock = async () => {
      throw new Error('child unreadable')
    }

    await assert.rejects(() => parent.flushMetadata(child), /child unreadable/)

    assert.equal(parent.getMetadata().hashesPath, hashesPath, 'no new BAT written')
  })

  test('mergeMetadata takes the child uuid and size, and keeps its own parent', async () => {
    const parent = await createSharedDisk({ parentUuid: 'grandparent-uuid', parentPath: './grandparent.hbd' })
    // fewer bytes, same block count: the exact size must be copied, not rounded
    const child = await createSharedDisk({ virtualSize: VIRTUAL_SIZE - 100 })

    await parent.mergeMetadata(child)

    assert.equal(parent.getUuid(), child.getUuid())
    assert.equal(parent.getVirtualSize(), VIRTUAL_SIZE - 100)
    assert.equal(parent.getParentUuid(), 'grandparent-uuid')

    const reopened = new HashedDiskDeduplicated({ handler, path: parent.getPath(), blockStorePath: STORE })
    await reopened.init()
    assert.equal(reopened.getUuid(), child.getUuid())
  })

  test('a merged disk still reads its blocks once the child is gone', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()
    await parent.writeBlock({ index: 0, data: block(0xaa) })
    await child.writeBlock({ index: 1, data: block(0xbb) })

    for (const index of child.getBlockIndexes()) {
      await parent.mergeBlock(child, index, false)
    }
    await parent.flushMetadata(child)
    await parent.mergeMetadata(child)
    await child.unlink()

    const reopened = new HashedDiskDeduplicated({ handler, path: parent.getPath(), blockStorePath: STORE })
    await reopened.init()
    assert.ok((await reopened.readBlock(0)).data.equals(block(0xaa)))
    assert.ok((await reopened.readBlock(1)).data.equals(block(0xbb)))
  })

  test('mergeMetadata twice gives the same result', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk()

    await parent.mergeMetadata(child)
    const once = parent.getMetadata()
    await parent.mergeMetadata(child)

    assert.deepEqual(parent.getMetadata(), once)
  })

  test('mergeMetadata refuses a parent that was not resized for its child, and writes nothing', async () => {
    const parent = await createSharedDisk()
    const child = await createSharedDisk({ virtualSize: VIRTUAL_SIZE * 2 })
    const before = parent.getMetadata()

    await assert.rejects(() => parent.mergeMetadata(child), /is not sized for its child, resize first/)

    const reopened = new HashedDiskDeduplicated({ handler, path: parent.getPath() })
    await reopened.init()
    assert.deepEqual(reopened.getMetadata(), before)
  })

  test('mergeMetadata refuses a child of another disk type', async () => {
    const parent = await createSharedDisk()

    await assert.rejects(() => parent.mergeMetadata({}), /can't merge different disk types/)
  })
})

describe('rename', () => {
  const otherName = () => `${diskDir}/20260815T120000000Z.hbd`

  test('moves the hbd inside its directory, the disk reopens from the new path', async () => {
    const disk = await createDisk()
    await disk.writeBlock({ index: 0, data: block(0xaa) })
    await disk.close()

    await disk.rename(otherName())

    assert.equal(disk.getPath(), `/${otherName()}`)
    await assert.rejects(() => handler.readFile(diskPath), { code: 'ENOENT' })
    const reopened = new HashedDiskDeduplicated({ handler, path: otherName() })
    await reopened.init()
    assert.ok((await reopened.readBlock(0)).data.equals(block(0xaa)))
  })

  test('replaces an hbd already at the new path', async () => {
    const disk = await createDisk()
    // what a kept child leaves behind (removeUnused = false)
    await handler.writeFile(otherName(), '{"stale": true}', { flags: 'w' })

    await disk.rename(otherName())

    const reopened = new HashedDiskDeduplicated({ handler, path: otherName() })
    await reopened.init()
    assert.equal(reopened.getUuid(), DISK_UUID)
  })

  test('refuses to leave its directory, and does not move', async () => {
    const disk = await createDisk()

    for (const newPath of [`${diskDir}/sub/x.hbd`, `xo-vm-backups/elsewhere/x.hbd`]) {
      await assert.rejects(() => disk.rename(newPath), /can't move .* out of its directory/)
    }
    assert.equal(disk.getPath(), `/${diskPath}`)
    await handler.readFile(diskPath)
  })
})
