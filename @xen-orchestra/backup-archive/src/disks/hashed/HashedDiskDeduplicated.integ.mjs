import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

import tmp from 'tmp'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { MergeRemoteDisk } from '@xen-orchestra/backup-archive/disks'
import { HashedDiskDeduplicated } from '@xen-orchestra/backup-archive/disks/hashed'
// not exported by the package: built by the `test-integration` script
import { RemoteDiskLineage } from '../../../dist/RemoteDiskLineage.mjs'

const BLOCK_SIZE = 2 * 1024 * 1024
const BLOCK_COUNT = 100
const UNIQUE_PAYLOADS = 70

async function listFiles(handler, dir) {
  const found = []
  for (const entry of await handler.list(dir, { prependDir: true })) {
    try {
      found.push(...(await listFiles(handler, entry)))
    } catch (error) {
      if (error.code !== 'ENOTDIR') {
        throw error
      }
      found.push(entry)
    }
  }
  return found
}

// index i holds payload (i % UNIQUE_PAYLOADS), so the last 30 blocks repeat earlier content
const payloadOf = index => Buffer.alloc(BLOCK_SIZE, (index % UNIQUE_PAYLOADS) % 256)

test('a full disk round trips, and duplicate payloads are stored once', async () => {
  const tempDir = await pFromCallback(cb => tmp.dir(cb))
  const handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()

  try {
    const path = 'xo-vm-backups/VMUUID/vdis/job/vdi/20260814T120000000Z.hbd'
    const disk = await HashedDiskDeduplicated.create({
      handler,
      path,
      virtualSize: BLOCK_SIZE * BLOCK_COUNT,
      blockSize: BLOCK_SIZE,
      uuid: '7d1e4c92-3f60-4a8b-b5c7-1e9f08d2a643',
    })

    for (let index = 0; index < BLOCK_COUNT; index++) {
      assert.equal(await disk.writeBlock({ index, data: payloadOf(index) }), BLOCK_SIZE)
    }

    assert.equal(disk.getBlockIndexes().length, BLOCK_COUNT)
    assert.equal(disk.getSizeOnDisk(), BLOCK_COUNT * BLOCK_SIZE)

    // the repeated payloads share a hash, so they share a file
    assert.equal(disk.getBlockHashAt(0), disk.getBlockHashAt(UNIQUE_PAYLOADS))

    await disk.close()

    // reopen from scratch: nothing may be kept in memory
    const reopened = new HashedDiskDeduplicated({ handler, path })
    await reopened.init()

    assert.equal(reopened.getBlockIndexes().length, BLOCK_COUNT)
    for (let index = 0; index < BLOCK_COUNT; index++) {
      const { data } = await reopened.readBlock(index)
      assert.ok(data.equals(payloadOf(index)), `block ${index} differs`)
    }

    const blockFiles = (await listFiles(handler, 'xo-vm-backups')).filter(file => file.includes('/blocks/'))
    assert.equal(blockFiles.length, UNIQUE_PAYLOADS, `${BLOCK_COUNT} blocks stored as ${UNIQUE_PAYLOADS} files`)

    await reopened.unlink()
    assert.deepEqual(await listFiles(handler, 'xo-vm-backups'), [])
  } finally {
    await handler.forget()
    await rimraf(tempDir)
  }
})

// ---------------------------------------------------------------- merge

const STORE = 'xo-block-store'
const VDI_DIR = 'xo-vm-backups/VMUUID/vdis/job/vdi'
const PARENT = { path: `${VDI_DIR}/20260814T120000000Z.hbd`, uuid: '0b3f2c7e-8a41-4d5f-9c26-7e1a5b8d3f04' }
const CHILD = { path: `${VDI_DIR}/20260815T120000000Z.hbd`, uuid: 'c4e9a1d2-6b7f-4e83-a5c0-2d8f9b1e6a37' }
const MERGE_BLOCKS = 5
// 3 changed, 2 shared with the parent
const parentContent = index => Buffer.alloc(BLOCK_SIZE, index + 1)
const childContent = index => (index % 2 === 0 ? Buffer.alloc(BLOCK_SIZE, 0x80 + index) : parentContent(index))

async function withRemote(fn) {
  const tempDir = await pFromCallback(cb => tmp.dir(cb))
  const handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  try {
    await fn(handler, tempDir)
  } finally {
    await handler.forget()
    await rimraf(tempDir)
  }
}

async function createChain(handler) {
  const common = {
    handler,
    virtualSize: BLOCK_SIZE * MERGE_BLOCKS,
    blockSize: BLOCK_SIZE,
    dedupType: 'PER_BACKUP_REPOSITORY',
    blockStorePath: STORE,
  }
  const parent = await HashedDiskDeduplicated.create({ ...common, ...PARENT })
  const child = await HashedDiskDeduplicated.create({
    ...common,
    ...CHILD,
    parentUuid: PARENT.uuid,
    parentPath: './20260814T120000000Z.hbd',
  })
  for (let index = 0; index < MERGE_BLOCKS; index++) {
    await parent.writeBlock({ index, data: parentContent(index) })
    await child.writeBlock({ index, data: childContent(index) })
  }
  await parent.close()
  await child.close()
}

const openDisk = async (handler, path) => {
  const disk = new HashedDiskDeduplicated({ handler, path, blockStorePath: STORE })
  await disk.init()
  return disk
}

// what is left after a merge: the child content, under the child name and uuid
async function assertMerged(handler, tempDir) {
  const merged = await openDisk(handler, CHILD.path)
  assert.equal(merged.getUuid(), CHILD.uuid)
  assert.equal(merged.isDifferencing(), false, 'the merged disk keeps the parent own (absent) parent')
  for (let index = 0; index < MERGE_BLOCKS; index++) {
    assert.ok((await merged.readBlock(index)).data.equals(childContent(index)), `block ${index} differs`)
  }

  await assert.rejects(() => handler.readFile(PARENT.path), { code: 'ENOENT' })
  const files = await listFiles(handler, VDI_DIR)
  assert.equal(
    files.some(file => file.includes(`/data/${CHILD.uuid}/`)),
    false,
    'the child data dir is gone'
  )
  assert.equal(
    files.some(file => file.endsWith('.merge.json')),
    false,
    'no merge state left'
  )

  // one store file per block still referenced, each held by the store copy and the merged disk only
  const storeFiles = await listFiles(handler, STORE)
  assert.equal(storeFiles.length, MERGE_BLOCKS)
  for (const storeFile of storeFiles) {
    assert.equal((await stat(join(tempDir, storeFile))).nlink, 2, storeFile)
  }
}

test('MergeRemoteDisk merges a hashed child into its parent', async () => {
  await withRemote(async (handler, tempDir) => {
    await createChain(handler)

    const merger = new MergeRemoteDisk(handler, { removeUnused: true })
    await merger.merge(await openDisk(handler, PARENT.path), await openDisk(handler, CHILD.path))

    await assertMerged(handler, tempDir)
  })
})

test('MergeRemoteDisk resumes a hashed merge interrupted before the parent was flushed', async () => {
  await withRemote(async (handler, tempDir) => {
    await createChain(handler)

    // first run: dies on the 4th block, like a killed process, so nothing is flushed
    const parent = await openDisk(handler, PARENT.path)
    const mergeBlock = parent.mergeBlock.bind(parent)
    let calls = 0
    parent.mergeBlock = (...args) => {
      if (++calls === 4) {
        throw new Error('crash')
      }
      return mergeBlock(...args)
    }
    parent.close = async () => {}
    const firstRun = new MergeRemoteDisk(handler, { removeUnused: true, mergeBlockConcurrency: 1, writeStateDelay: 0 })
    const child = await openDisk(handler, CHILD.path)
    await assert.rejects(() => firstRun.merge(parent, child), /crash/)
    assert.ok(
      (await listFiles(handler, VDI_DIR)).some(file => file.endsWith('.merge.json')),
      'the merge state is kept'
    )

    // second run: fresh disks, restarts from the saved block and skips the ones before
    const resumed = new MergeRemoteDisk(handler, { removeUnused: true })
    await resumed.merge(await openDisk(handler, PARENT.path), await openDisk(handler, CHILD.path))

    await assertMerged(handler, tempDir)
  })
})

// ---------------------------------------------------------------- merge through RemoteDiskLineage

// what a backup cleanup does: the lineage opens the merge child with openDiskChain, so the
// child is a HashedDiskChain, never a bare disk
const GRANDCHILD = { path: `${VDI_DIR}/20260816T120000000Z.hbd`, uuid: 'e2a7c5b1-9d34-4f6e-8b02-5c1d7a9e3f48' }
const grandchildContent = index => (index === 1 ? Buffer.alloc(BLOCK_SIZE, 0xc1) : childContent(index))

async function addGrandchild(handler) {
  const grandchild = await HashedDiskDeduplicated.create({
    handler,
    ...GRANDCHILD,
    virtualSize: BLOCK_SIZE * MERGE_BLOCKS,
    blockSize: BLOCK_SIZE,
    dedupType: 'PER_BACKUP_REPOSITORY',
    blockStorePath: STORE,
    parentUuid: CHILD.uuid,
    parentPath: './20260815T120000000Z.hbd',
  })
  await grandchild.writeBlock({ index: 1, data: grandchildContent(1) })
  await grandchild.close()
}

const LINEAGE_OPTS = { remove: true, merge: true, logInfo: () => {}, logWarn: () => {} }

// only `activePath` is still referenced by a backup: every older disk is merged into it
async function cleanLineage(handler, activePath, opts = {}) {
  const lineage = new RemoteDiskLineage(handler, VDI_DIR, { ...LINEAGE_OPTS, ...opts })
  await lineage.init()
  lineage.addActiveDiskPath(activePath)
  return lineage.clean()
}

test('RemoteDiskLineage merges a chain of 2 hbd disks', async () => {
  await withRemote(async (handler, tempDir) => {
    await createChain(handler)

    const { merge } = await cleanLineage(handler, CHILD.path)

    assert.equal(merge, true)
    await assertMerged(handler, tempDir)
  })
})

test('RemoteDiskLineage merges a chain of 3 hbd disks', async () => {
  await withRemote(async handler => {
    await createChain(handler)
    await addGrandchild(handler)

    await cleanLineage(handler, GRANDCHILD.path)

    assert.deepEqual(
      (await handler.list(VDI_DIR)).filter(name => name.endsWith('.hbd')),
      ['20260816T120000000Z.hbd'],
      'only the active disk is left'
    )
    const merged = await openDisk(handler, GRANDCHILD.path)
    assert.equal(merged.getUuid(), GRANDCHILD.uuid)
    assert.equal(merged.isDifferencing(), false)
    for (let index = 0; index < MERGE_BLOCKS; index++) {
      assert.ok((await merged.readBlock(index)).data.equals(grandchildContent(index)), `block ${index} differs`)
    }
    // the store only holds what the merged disk still references
    const referenced = new Set(merged.getBlockIndexes().map(index => merged.getBlockHashAt(index)))
    assert.equal((await listFiles(handler, STORE)).length, referenced.size)
  })
})

test('RemoteDiskLineage resumes an interrupted merge of a hbd chain', async () => {
  await withRemote(async (handler, tempDir) => {
    await createChain(handler)

    // first run: dies on the 4th block, like a killed process
    const { mergeBlock } = HashedDiskDeduplicated.prototype
    let calls = 0
    HashedDiskDeduplicated.prototype.mergeBlock = function (...args) {
      if (++calls === 4) {
        throw new Error('crash')
      }
      return mergeBlock.apply(this, args)
    }
    try {
      await assert.rejects(() => cleanLineage(handler, CHILD.path, { mergeBlockConcurrency: 1 }), /crash/)
    } finally {
      HashedDiskDeduplicated.prototype.mergeBlock = mergeBlock
    }
    assert.ok(
      (await listFiles(handler, VDI_DIR)).some(file => file.endsWith('.merge.json')),
      'the merge state is kept'
    )

    // second run: a fresh lineage finds the merge state and resumes it
    await cleanLineage(handler, CHILD.path)

    await assertMerged(handler, tempDir)
  })
})
