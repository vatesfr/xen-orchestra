import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { normalize } from '@xen-orchestra/fs/path'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { HashedDiskChain, HashedDiskDeduplicated, HbdFileError } from '@xen-orchestra/backup-archive/disks/hashed'

const { beforeEach, afterEach, describe } = test

const BLOCK_SIZE = 4096
const BLOCK_COUNT = 4

const block = byte => Buffer.alloc(BLOCK_SIZE, byte)

let tempDir, handler, diskDir

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  diskDir = `xo-vm-backups/VMUUID/vdis/job/${uuid.v4()}`
})

afterEach(async () => {
  await handler.forget()
  await rimraf(tempDir)
})

const diskPath = n => `${diskDir}/2026081${n}T120000000Z.hbd`

/**
 * Writes a chain of hbd disks, oldest first: `contents[n]` maps index -> fill byte of disk n
 * @returns the paths and uuids, oldest first
 */
async function writeChain(contents) {
  const disks = []
  for (const [n, content] of contents.entries()) {
    const path = diskPath(n)
    const diskUuid = uuid.v4()
    const parent = disks[n - 1]
    const disk = await HashedDiskDeduplicated.create({
      handler,
      path,
      virtualSize: BLOCK_SIZE * BLOCK_COUNT,
      blockSize: BLOCK_SIZE,
      uuid: diskUuid,
      parentUuid: parent?.uuid,
      parentPath: parent === undefined ? undefined : `./2026081${n - 1}T120000000Z.hbd`,
      dedupType: 'PER_BACKUP_REPOSITORY',
    })
    for (const [index, byte] of Object.entries(content)) {
      await disk.writeBlock({ index: Number(index), data: block(byte) })
    }
    await disk.close()
    disks.push({ path, uuid: diskUuid })
  }
  return disks
}

async function openChain(paths) {
  const disks = []
  for (const path of paths) {
    const disk = new HashedDiskDeduplicated({ handler, path })
    await disk.init()
    disks.push(disk)
  }
  return new HashedDiskChain({ disks })
}

// 3 disks: index 0 only in the base, 1 rewritten by each disk, 2 only in the middle one, 3 nowhere
const CHAIN_OF_3 = [{ 0: 0x10, 1: 0x11 }, { 1: 0x21, 2: 0x22 }, { 1: 0x31 }]

describe('HashedDiskChain', () => {
  test('reads each block from the newest disk holding it', async () => {
    const written = await writeChain(CHAIN_OF_3)
    const chain = await openChain(written.map(_ => _.path))

    assert.deepEqual([...chain.getBlockIndexes()].sort(), [0, 1, 2])
    assert.equal(chain.hasBlock(3), false)
    for (const [index, byte] of [
      [0, 0x10],
      [1, 0x31],
      [2, 0x22],
    ]) {
      assert.ok((await chain.readBlock(index)).data.equals(block(byte)), `block ${index}`)
    }
    await assert.rejects(() => chain.readBlock(3), /not found in chain/)
  })

  test('getBlockHashAt and getBlockPath come from the newest disk holding the block', async () => {
    const written = await writeChain(CHAIN_OF_3)
    const chain = await openChain(written.map(_ => _.path))
    const [base, middle, top] = chain.disks

    assert.equal(chain.getBlockHashAt(1), top.getBlockHashAt(1))
    assert.equal(chain.getBlockPath(1), top.getBlockPath(1))
    assert.equal(chain.getBlockHashAt(2), middle.getBlockHashAt(2))
    assert.equal(chain.getBlockPath(2), middle.getBlockPath(2))
    assert.equal(chain.getBlockPath(0), base.getBlockPath(0))
    // the path is a real file, holding the block of that disk
    await handler.readFile(chain.getBlockPath(2))

    assert.throws(() => chain.getBlockHashAt(3), /not found in chain/)
    assert.throws(() => chain.getBlockPath(3), /not found in chain/)
  })

  test('exposes the newest disk identity and the summed size', async () => {
    const written = await writeChain(CHAIN_OF_3)
    const chain = await openChain(written.map(_ => _.path))

    assert.equal(chain.getUuid(), written[2].uuid)
    assert.equal(chain.getPath(), normalize(written[2].path))
    assert.deepEqual(
      chain.getPaths(),
      written.map(_ => normalize(_.path))
    )
    assert.equal(chain.getRootDisk(), chain.disks[0])
    assert.equal(chain.getSizeOnDisk(), (2 + 2 + 1) * BLOCK_SIZE)
    assert.equal(await chain.canMergeConcurently(), true)
  })

  test('init refuses a broken parentage, and closes the disks', async () => {
    const written = await writeChain(CHAIN_OF_3)
    // the middle disk is skipped: the top one is not a child of the base
    const disks = [written[0], written[2]].map(({ path }) => new HashedDiskDeduplicated({ handler, path }))
    const closed = []
    for (const disk of disks) {
      disk.close = async () => closed.push(disk)
    }

    await assert.rejects(() => new HashedDiskChain({ disks }).init(), { code: 'NOT_SUPPORTED' })
    assert.equal(closed.length, 2)
  })
})

describe('merging a chain child into a hbd', () => {
  async function openParentAndChildChain() {
    const written = await writeChain(CHAIN_OF_3)
    const parent = new HashedDiskDeduplicated({ handler, path: written[0].path })
    await parent.init()
    const child = await openChain(written.slice(1).map(_ => _.path))
    return { written, parent, child }
  }

  test('mergeBlock links the block of the newest child disk, and skips identical or absent blocks', async () => {
    const { parent, child } = await openParentAndChildChain()

    assert.equal(await parent.mergeBlock(child, 1, false), BLOCK_SIZE)
    assert.equal(parent.getBlockHashAt(1), child.getBlockHashAt(1))
    assert.ok((await parent.readBlock(1)).data.equals(block(0x31)))

    // already holding the child's content
    assert.equal(await parent.mergeBlock(child, 1, false), 0)
    // nothing in the child at this index
    assert.equal(await parent.mergeBlock(child, 3, false), 0)
  })

  test('flushMetadata(child) re-syncs every index of the chain', async () => {
    const { parent, child } = await openParentAndChildChain()

    await parent.flushMetadata(child)

    for (const [index, byte] of [
      [0, 0x10],
      [1, 0x31],
      [2, 0x22],
    ]) {
      assert.ok((await parent.readBlock(index)).data.equals(block(byte)), `block ${index}`)
    }
  })

  test('mergeMetadata(child) takes the identity of the newest disk of the chain', async () => {
    const { written, parent, child } = await openParentAndChildChain()

    await parent.mergeMetadata(child)

    assert.equal(parent.getUuid(), written[2].uuid)
  })

  test('refuses a child of another type, and never skips the re-sync silently', async () => {
    const { parent } = await openParentAndChildChain()

    await assert.rejects(() => parent.flushMetadata({}), /can't merge different disk types/)
    await assert.rejects(() => parent.mergeMetadata({}), /can't merge different disk types/)
  })
})

describe('openDiskChain on hbd disks', () => {
  test('returns a HashedDiskChain of the whole chain', async () => {
    const written = await writeChain(CHAIN_OF_3)

    const chain = await openDiskChain({ handler, path: written[2].path })
    try {
      assert.ok(chain instanceof HashedDiskChain)
      assert.deepEqual(
        chain.getPaths(),
        written.map(_ => normalize(_.path))
      )
    } finally {
      await chain.close()
    }
  })

  test('stops at `until`, like a merge opens its child', async () => {
    const written = await writeChain(CHAIN_OF_3)

    const chain = await openDiskChain({ handler, path: written[2].path, until: normalize(written[0].path) })
    try {
      assert.ok(chain instanceof HashedDiskChain)
      assert.deepEqual(
        chain.getPaths(),
        written.slice(1).map(_ => normalize(_.path))
      )
    } finally {
      await chain.close()
    }
  })

  test('refuses a hbd whose parent is not a hbd', async () => {
    const written = await writeChain([{ 0: 0x10 }])
    // points the disk at a VHD parent: it is opened as a hbd, and can't be read as one
    const metadata = JSON.parse(await handler.readFile(written[0].path))
    await handler.writeFile(`${diskDir}/parent.vhd`, Buffer.alloc(1024))
    await handler.writeFile(
      written[0].path,
      JSON.stringify({ ...metadata, parentUuid: uuid.v4(), parentPath: './parent.vhd' }),
      { flags: 'w' }
    )

    await assert.rejects(
      () => openDiskChain({ handler, path: written[0].path }),
      error => error instanceof HbdFileError && error.path.endsWith('parent.vhd')
    )
  })
})
