import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { VHDFOOTER, VHDHEADER } from '../tests.fixtures.mjs'
import { VhdFile, Constants, VhdDirectory, VhdAbstract } from 'vhd-lib'
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'
import { dirname, basename } from 'node:path'
import { rimraf } from 'rimraf'
import { MergeRemoteDisk } from './MergeRemoteDisk.mjs'

const { beforeEach, afterEach, describe } = test

let tempDir, handler, jobId, vdiId, basePath, relativePath
const rootPath = 'xo-vm-backups/VMUUID'

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  jobId = uniqueId()
  vdiId = uniqueId()
  relativePath = `vdis/${jobId}/${vdiId}`
  basePath = `${rootPath}/${relativePath}`
  await fs.mkdirp(`${tempDir}/${basePath}`)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

const uniqueId = () => uuid.v1()
const uniqueIdBuffer = () => uuid.v1({}, Buffer.alloc(16))

async function generateVhd(path, opts = {}) {
  let vhd

  let dataPath = path
  if (opts.useAlias) {
    await handler.mkdir(dirname(path) + '/data/')
    dataPath = dirname(path) + '/data/' + basename(path)
  }
  if (opts.mode === 'directory') {
    await handler.mkdir(dataPath)
    vhd = new VhdDirectory(handler, dataPath)
  } else {
    const fd = await handler.openFile(dataPath, 'wx')
    vhd = new VhdFile(handler, fd)
  }

  vhd.header = { ...VHDHEADER, ...opts.header }
  vhd.footer = { ...VHDFOOTER, ...opts.footer, uuid: uniqueIdBuffer() }

  if (vhd.header.parentUuid) {
    vhd.footer.diskType = Constants.DISK_TYPES.DIFFERENCING
  } else {
    vhd.footer.diskType = Constants.DISK_TYPES.DYNAMIC
  }

  if (opts.useAlias === true) {
    await VhdAbstract.createAlias(handler, path + '.alias.vhd', dataPath)
  }

  if (opts.blocks) {
    for (const blockId of opts.blocks) {
      await vhd.writeEntireBlock({ id: blockId, buffer: Buffer.alloc(2 * 1024 * 1024 + 512, blockId) })
    }
  }
  await vhd.writeBlockAllocationTable()
  await vhd.writeHeader()
  await vhd.writeFooter()
  return vhd
}

/**
 * RemoteVhdDisk
 */
describe('tests RemoteVhdDisk', { concurrency: 1 }, () => {
  test('RemoteVhdDisk should read block', async () => {
    // Create VHD disk
    await generateVhd(`${basePath}/disk.vhd`, { blocks: [0, 1] })

    const disk = new RemoteVhdDisk({ handler, path: `${basePath}/disk.vhd` })

    await disk.init({ force: false })

    const readBlock = await disk.readBlock(1)

    assert.equal(readBlock.data.length, 2097152, 'block should be readable')
  })

  test('RemoteVhdDisk should write block', async () => {
    // Create VHD disk
    await generateVhd(`${basePath}/disk.vhd`, { blocks: [0, 1] })

    const disk = new RemoteVhdDisk({ handler, path: `${basePath}/disk.vhd` })

    await disk.init({ force: false })

    const blockId = 2
    await disk.writeBlock({ index: blockId, data: Buffer.alloc(2 * 1024 * 1024, blockId) })
    const readBlock = await disk.readBlock(blockId)

    assert.equal(readBlock.data.length, 2097152, 'block should be readable')
  })

  test('RemoteVhdDisk should read block on VHD directory', async () => {
    // Create VHD disk
    await generateVhd(`${basePath}/directory.vhd`, { blocks: [0, 1], mode: 'directory', useAlias: true })

    const directory = new RemoteVhdDisk({ handler, path: `${basePath}/directory.vhd.alias.vhd` })

    await directory.init({ force: false })

    const readBlock = await directory.readBlock(1)

    assert.equal(readBlock.data.length, 2097152, 'block should be readable')
  })

  test('RemoteVhdDisk should write block on VHD directory', async () => {
    // Create VHD disk
    await generateVhd(`${basePath}/directory.vhd`, { blocks: [0, 1], mode: 'directory', useAlias: true })

    const directory = new RemoteVhdDisk({ handler, path: `${basePath}/directory.vhd.alias.vhd` })

    await directory.init({ force: false })

    const blockId = 2
    await directory.writeBlock({ index: blockId, data: Buffer.alloc(2 * 1024 * 1024, blockId) })
    const readBlock = await directory.readBlock(blockId)

    assert.equal(readBlock.data.length, 2097152, 'block should be readable')
  })

  test('RemoteVhdDisk should not support non alias VHD directory', async () => {
    // Create VHD directory
    await generateVhd(`${basePath}/directory.vhd`, { blocks: [0, 1], mode: 'directory' })

    const directory = new RemoteVhdDisk({ handler, path: `${basePath}/directory.vhd` })

    try {
      await directory.init({ force: true })
    } catch (err) {
      assert.strictEqual(
        err.code,
        'NOT_SUPPORTED',
        'Initializing a vhd directory without using alias should raise a not supported error'
      )
      return
    }

    assert.strictEqual(
      true,
      false,
      'Initializing a vhd directory without using alias should raise a not supported error'
    )
  })

  test('RemoteVhdDisk closes disk on init error', async () => {
    // Create VHD disk
    await generateVhd(`${basePath}/disk.vhd`, { blocks: [0] })

    const disk = new RemoteVhdDisk({ handler, path: `${basePath}/disk.vhd` })

    // Override the disk close method to monitor its execution
    let diskClosed = false
    const originalClose = disk.close.bind(disk)
    disk.close = async () => {
      diskClosed = true
      await originalClose()
    }

    // Make isDirectory throw an error to simulate init failure
    disk.isDirectory = async () => {
      throw new Error('simulated write error')
    }

    // Run init and expect it to throw
    let threw = false
    try {
      await disk.init()
    } catch (err) {
      threw = true
      assert.equal(err.message, 'simulated write error')
    }

    assert.equal(threw, true, 'merge should throw')
    assert.equal(diskClosed, true, 'disk disk should be closed on error')
  })
})

/**
 * RemoteVhdDiskChain
 */
describe('tests RemoteVhdDiskChain', { concurrency: 1 }, () => {
  test('RemoteVhdDiskChain should read block', async () => {
    // Create parent and child VHDs
    const chainParent = await generateVhd(`${basePath}/parent.vhd`, { blocks: [0] })
    await generateVhd(`${basePath}/child.vhd`, {
      header: {
        parentUnicodeName: 'parent.vhd',
        parentUuid: chainParent.footer.uuid,
      },
      blocks: [1],
    })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/parent.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })
    const diskChain = new RemoteVhdDiskChain({ disks: [parent, child] })

    await diskChain.init({ force: false })

    const readBlock = await diskChain.readBlock(1)

    assert.equal(readBlock.data.length, 2097152, 'block should be readable')
  })

  test('RemoteVhdDiskChain should read block on VHD directory', async () => {
    // Create parent and child VHD directories
    const chainParent = await generateVhd(`${basePath}/parent.vhd`, { blocks: [0], mode: 'directory', useAlias: true })
    await generateVhd(`${basePath}/child.vhd`, {
      header: {
        parentUnicodeName: 'parent.vhd',
        parentUuid: chainParent.footer.uuid,
      },
      blocks: [1],
      mode: 'directory',
      useAlias: true,
    })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/parent.vhd.alias.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd.alias.vhd` })
    const directoryChain = new RemoteVhdDiskChain({ disks: [parent, child] })

    await directoryChain.init({ force: false })

    const readBlock = await directoryChain.readBlock(1)

    assert.equal(readBlock.data.length, 2097152, 'block should be readable')
  })

  test('RemoteVhdDiskChain should closes disks on init error', async () => {
    // Create parent and child VHDs
    const chainParent = await generateVhd(`${basePath}/parent.vhd`, { blocks: [0] })
    await generateVhd(`${basePath}/child.vhd`, {
      header: {
        parentUnicodeName: 'parent.vhd',
        parentUuid: chainParent.footer.uuid,
      },
      blocks: [1],
    })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/parent.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })
    const diskChain = new RemoteVhdDiskChain({ disks: [parent, child] })

    // Override the disks close method to monitor their execution
    let parentClosed = false
    const originalParentClose = parent.close.bind(parent)
    parent.close = async () => {
      parentClosed = true
      await originalParentClose()
    }
    let childClosed = false
    const originalChildClose = child.close.bind(child)
    child.close = async () => {
      childClosed = true
      await originalChildClose()
    }

    // Make isDifferencing throw an error to simulate init failure of the child disk
    child.isDifferencing = () => {
      throw new Error('simulated write error')
    }

    // Run init and expect it to throw
    let threw = false
    try {
      await diskChain.init({ force: false })
    } catch (err) {
      threw = true
      assert.equal(err.message, 'simulated write error')
    }

    assert.equal(threw, true, 'merge should throw')
    assert.equal(parentClosed, true, 'parent disk should be closed on error')
    assert.equal(childClosed, true, 'child disk should be closed on error')
  })

  test('RemoteVhdDiskChain should not support non differencing VHD chain children', async () => {
    // Create VHD chain
    await generateVhd(`${basePath}/disk_1.vhd`, { blocks: [2] })
    await generateVhd(`${basePath}/disk_2.vhd`, { blocks: [3] })

    const disk1 = new RemoteVhdDisk({ handler, path: `${basePath}/disk_1.vhd` })
    const disk2 = new RemoteVhdDisk({ handler, path: `${basePath}/disk_2.vhd` })
    const diskChain = new RemoteVhdDiskChain({ disks: [disk1, disk2] })

    try {
      await diskChain.init({ force: true })
    } catch (err) {
      assert.strictEqual(err.code, 'NOT_SUPPORTED', "Can't init vhd directory with non differencing child disks")
      return
    }
    assert.strictEqual(true, false, "Can't init vhd directory with non differencing child disks")
  })
})

/**
 * MergeVhdChain
 */
describe('tests MergeVhdChain', { concurrency: 1 }, () => {
  test('mergeVhdChain merges a simple ancestor VHD + child VHD', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [2, 3] })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, child)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child.vhd'])

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeVhdChain merges a simple ancestor VHD + child VHD chain', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor and children VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })
    const chainParent = await generateVhd(`${basePath}/child_1.vhd`, { blocks: [2] })
    await generateVhd(`${basePath}/child_2.vhd`, {
      header: {
        parentUnicodeName: 'child_1.vhd',
        parentUuid: chainParent.footer.uuid,
      },
      blocks: [3],
    })
    await generateVhd(`${basePath}/child_3.vhd`, {
      header: {
        parentUnicodeName: 'child_1.vhd',
        parentUuid: chainParent.footer.uuid,
      },
      blocks: [4],
    })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
    const child1 = new RemoteVhdDisk({ handler, path: `${basePath}/child_1.vhd` })
    const child2 = new RemoteVhdDisk({ handler, path: `${basePath}/child_2.vhd` })
    const child3 = new RemoteVhdDisk({ handler, path: `${basePath}/child_3.vhd` })
    const childDiskChain = new RemoteVhdDiskChain({ disks: [child1, child2, child3] })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child1.init({ force: isResumingMerge })
    await child2.init({ force: isResumingMerge })
    await child3.init({ force: isResumingMerge })
    await childDiskChain.init({ force: isResumingMerge })

    const expectedIndexes = parent
      .getBlockIndexes()
      .concat(child1.getBlockIndexes())
      .concat(child2.getBlockIndexes())
      .concat(child3.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, childDiskChain)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child_3.vhd']) // TODO: Check that it's the correct child that is remaining.

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeVhdChain merges an alias ancestor VHD + alias child VHD', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1], useAlias: true })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [2, 3], useAlias: true })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd.alias.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd.alias.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: true })
    await child.init({ force: true })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, child)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child.vhd.alias.vhd', 'data'])

    const remainingDatas = await handler.list(basePath + '/data')
    assert.deepEqual(remainingDatas, ['ancestor.vhd'])

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeVhdChain merges an alias ancestor VHD + alias child VHD chain', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor VHD
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1], useAlias: true })

    // Create child VHD chain
    const chainParent = await generateVhd(`${basePath}/child_1.vhd`, { blocks: [2], useAlias: true })
    await generateVhd(`${basePath}/child_2.vhd`, {
      header: {
        parentUnicodeName: 'child_1.vhd',
        parentUuid: chainParent.footer.uuid,
      },
      blocks: [3],
      useAlias: true,
    })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd.alias.vhd` })
    const child1 = new RemoteVhdDisk({ handler, path: `${basePath}/child_1.vhd.alias.vhd` })
    const child2 = new RemoteVhdDisk({ handler, path: `${basePath}/child_2.vhd.alias.vhd` })
    const childDiskChain = new RemoteVhdDiskChain({ disks: [child1, child2] })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child1.init({ force: isResumingMerge })
    await child2.init({ force: isResumingMerge })
    await childDiskChain.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child1.getBlockIndexes()).concat(child2.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, childDiskChain)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child_2.vhd.alias.vhd', 'data'])

    const remainingDatas = await handler.list(basePath + '/data')
    assert.deepEqual(remainingDatas, ['ancestor.vhd'])

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeVhdChain merges an alias ancestor VHD + child VHD', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1], useAlias: true })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [2, 3] })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd.alias.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, child)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child.vhd', 'data'])

    const remainingDatas = await handler.list(basePath + '/data')
    assert.deepEqual(remainingDatas, ['ancestor.vhd'])

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeVhdChain merges an ancestor VHD + alias child VHD', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [2, 3], useAlias: true })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd.alias.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, child)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child.vhd.alias.vhd', 'data'])

    const remainingDatas = await handler.list(basePath + '/data')
    assert.deepEqual(remainingDatas, [])

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeVhdChain merges a alias ancestor VHD directory + alias child VHD directory', async () => {
    let progressCalls = 0
    const onProgress = () => {
      progressCalls++
    }

    // Create ancestor and child VHD directories
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1], mode: 'directory', useAlias: true })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [2, 3], mode: 'directory', useAlias: true })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd.alias.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd.alias.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { onProgress, removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    const result = await mergeRemoteDisk.merge(parent, child)

    assert.ok(result.finalDiskSize > 0, 'merged disks should have non-zero size')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')
    assert.ok(progressCalls > 0, 'onProgress should have been called')

    // Check that ancestor was renamed to child
    const remainingDisks = await handler.list(basePath)
    assert.deepEqual(remainingDisks, ['child.vhd.alias.vhd', 'data'])

    const remainingDatas = await handler.list(basePath + '/data')
    assert.deepEqual(remainingDatas, ['ancestor.vhd'])

    const parentIndexes = parent.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')

    const ancestorData = await handler.list(`${basePath}/data/ancestor.vhd`)
    assert.ok(ancestorData.length > 0, 'ancestor.vhd directory should contain blocks')
  })

  test('mergeVhdChain closes disks on error', async () => {
    // Create parent and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0] })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [1] })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { removeUnused: true })

    const isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    // Override the disks close method to monitor their execution
    let parentClosed = false
    let childClosed = false
    const originalParentClose = parent.close.bind(parent)
    parent.close = async () => {
      parentClosed = true
      await originalParentClose()
    }
    const originalChildClose = child.close.bind(child)
    child.close = async () => {
      childClosed = true
      await originalChildClose()
    }

    // Make writeBlock throw an error to simulate failure
    parent.writeBlock = async () => {
      throw new Error('simulated write error')
    }

    // Run merge and expect it to throw
    let threw = false
    try {
      await mergeRemoteDisk.merge(parent, child)
    } catch (err) {
      threw = true
      assert.equal(err.message, 'simulated write error')
    }

    assert.equal(threw, true, 'merge should throw')
    assert.equal(parentClosed, true, 'parent disk should be closed on error')
    assert.equal(childClosed, true, 'child disk should be closed on error')
  })

  test('mergeRemoteDisk resumes after interruption', async () => {
    // Create parent and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1] })
    await generateVhd(`${basePath}/child.vhd`, { blocks: [2, 3, 4, 5, 6, 7, 8, 9, 10] })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, { removeUnused: true, writeStateDelay: 0 })

    let isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    // Track write progress
    let blocksWritten = 0
    const originalWriteBlock = parent.writeBlock.bind(parent)

    // Make writeBlock fail on the second block
    parent.writeBlock = async diskBlock => {
      if (blocksWritten === 5) {
        throw new Error('simulated interruption')
      }
      blocksWritten++
      return originalWriteBlock(diskBlock)
    }

    // First merge attempt should throw
    let threw = false
    try {
      await mergeRemoteDisk.merge(parent, child)
    } catch (err) {
      threw = true
      assert.equal(err.message, 'simulated interruption')
    }
    assert.equal(threw, true, 'merge should throw on simulated interruption')

    // Verify that state file exists
    assert.ok(
      (await handler.list(dirname(parent.getPath()))).includes(`.${basename(parent.getPath())}.merge.json`),
      'merge state file should exist after failure'
    )

    // Recreate new remoteDisks to simulate a new operation
    const parent2 = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd` })
    const child2 = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd` })

    isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(isResumingMerge, 'merge is resuming')

    await parent2.init({ force: isResumingMerge })
    await child2.init({ force: isResumingMerge })

    const originalWriteBlock2 = parent2.writeBlock.bind(parent2)

    // Make writeBlock fail on the second block
    parent2.writeBlock = async diskBlock => {
      blocksWritten++
      return originalWriteBlock2(diskBlock)
    }

    // Resume merge
    const result = await mergeRemoteDisk.merge(parent2, child2)

    // Verify merge completed
    assert.ok(result.finalDiskSize > 0, 'final disk size should be > 0')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')

    // Verify state file removed after successful resume
    assert.equal(
      (await handler.list(dirname(parent2.getPath()))).includes(`.${basename(parent2.getPath())}.merge.json`),
      false,
      'merge state file should be removed after successful resume'
    )

    // Verify all blocks present in parent
    const parentIndexes = parent2.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')
  })

  test('mergeRemoteDisk resumes after interruption with VHD directory', async () => {
    // Track write progress
    let blocksWritten = 0

    // Create parent and child VHDs
    await generateVhd(`${basePath}/ancestor.vhd`, { blocks: [0, 1], useAlias: true, mode: 'directory' })
    await generateVhd(`${basePath}/child.vhd`, {
      blocks: [2, 3, 4, 5, 6, 7, 8, 9, 10],
      useAlias: true,
      mode: 'directory',
    })

    const parent = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd.alias.vhd` })
    const child = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd.alias.vhd` })

    const mergeRemoteDisk = new MergeRemoteDisk(handler, {
      removeUnused: true,
      writeStateDelay: 0,
      mergeBlockConcurrency: 4,
    })

    let isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(!isResumingMerge, 'merge is not resuming')

    await parent.init({ force: isResumingMerge })
    await child.init({ force: isResumingMerge })

    const expectedIndexes = parent.getBlockIndexes().concat(child.getBlockIndexes())

    const originalMergeBlock = parent.mergeBlock.bind(parent)

    // Make writeBlock fail on the second block
    parent.mergeBlock = async (disk, index, isResumingMerge) => {
      if (blocksWritten === 4) {
        throw new Error('simulated interruption')
      }
      blocksWritten++

      return originalMergeBlock(disk, index, isResumingMerge)
    }

    // First merge attempt should throw
    let threw = false
    try {
      await mergeRemoteDisk.merge(parent, child)
    } catch (err) {
      threw = true
      assert.equal(err.message, 'simulated interruption')
    }
    assert.equal(threw, true, 'merge should throw on simulated interruption')

    // Verify that state file exists
    assert.ok(
      (await handler.list(dirname(parent.getPath()))).includes(`.${basename(parent.getPath())}.merge.json`),
      'merge state file should exist after failure'
    )

    // Recreate new remoteDisks to simulate a new operation
    const parent2 = new RemoteVhdDisk({ handler, path: `${basePath}/ancestor.vhd.alias.vhd` })
    const child2 = new RemoteVhdDisk({ handler, path: `${basePath}/child.vhd.alias.vhd` })

    isResumingMerge = await mergeRemoteDisk.isResuming(parent)

    assert.ok(isResumingMerge, 'merge is resuming')

    await parent2.init({ force: isResumingMerge })
    await child2.init({ force: isResumingMerge })

    const originalWriteBlock2 = parent2.writeBlock.bind(parent2)

    // Make writeBlock fail on the second block
    parent2.writeBlock = async diskBlock => {
      blocksWritten++
      return originalWriteBlock2(diskBlock)
    }

    // Resume merge
    const result = await mergeRemoteDisk.merge(parent2, child2)

    // Verify merge completed
    assert.ok(result.finalDiskSize > 0, 'final disk size should be > 0')
    assert.ok(result.mergedDataSize > 0, 'merged data size should be > 0')

    // Verify state file removed after successful resume
    assert.equal(
      (await handler.list(dirname(parent2.getPath()))).includes(`.${basename(parent2.getPath())}.merge.json`),
      false,
      'merge state file should be removed after successful resume'
    )

    // Verify all blocks present in parent BAT
    const parentIndexes = parent2.getBlockIndexes()
    assert.deepEqual(parentIndexes, expectedIndexes, 'all child blocks should be merged into parent')

    // Verify all blocks actually present in parent
    for (const index of expectedIndexes) {
      const parentBlockPath = parent2.getBlockPath(index)

      let size
      try {
        size = await handler.getSize(parentBlockPath)
      } catch {
        assert.fail(`block ${index} is missing from parent directory`)
      }

      assert.ok(size >= parent2.getBlockSize(), `block ${index} complete`)
    }
  })
})
