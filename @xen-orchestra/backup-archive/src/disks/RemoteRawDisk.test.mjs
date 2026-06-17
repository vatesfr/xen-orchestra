import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import tmp from 'tmp'
import fs from 'fs-extra'
import * as uuid from 'uuid'
import { getHandler } from '@xen-orchestra/fs'
import { pFromCallback } from 'promise-toolbox'
import { rimraf } from 'rimraf'

import { RemoteRawDisk } from './RemoteRawDisk.mjs'

const { beforeEach, afterEach, describe } = test

const BLOCK_SIZE = 2 * 1024 * 1024 // 2 MiB
const VIRTUAL_SIZE = 10 * BLOCK_SIZE // 10 blocks = 20 MiB

let tempDir, handler, basePath

const rootPath = 'xo-vm-backups/VMUUID'
const uniqueId = () => uuid.v1()

beforeEach(async () => {
  tempDir = await pFromCallback(cb => tmp.dir(cb))
  handler = getHandler({ url: `file://${tempDir}` })
  await handler.sync()
  const jobId = uniqueId()
  const vdiId = uniqueId()
  basePath = `${rootPath}/vdis/${jobId}/${vdiId}`
  await fs.mkdirp(`${tempDir}/${basePath}`)
})

afterEach(async () => {
  await rimraf(tempDir)
  await handler.forget()
})

describe('RemoteRawDisk', { concurrency: 1 }, () => {
  test('create initializes JSON and data file', async () => {
    const diskUuid = uniqueId()
    const diskPath = `${basePath}/snap.raw`
    await RemoteRawDisk.create({ handler, path: diskPath, virtualSize: VIRTUAL_SIZE, uuid: diskUuid })

    // JSON metadata must exist
    const meta = JSON.parse(await handler.readFile(diskPath))
    assert.equal(meta.uuid, diskUuid)
    assert.equal(meta.virtualSize, VIRTUAL_SIZE)
    assert.equal(meta.blockSize, BLOCK_SIZE)

    // Data file must exist with size = maxBlockCount * BLOCK_SIZE
    const expectedFileSize = Math.ceil(VIRTUAL_SIZE / BLOCK_SIZE) * BLOCK_SIZE
    const actualSize = await handler.getSize(diskPath + '.data')
    assert.equal(actualSize, expectedFileSize)
  })

  test('init reads JSON metadata', async () => {
    const diskUuid = uniqueId()
    const diskPath = `${basePath}/snap.raw`
    await RemoteRawDisk.create({ handler, path: diskPath, virtualSize: VIRTUAL_SIZE, uuid: diskUuid })

    const disk = new RemoteRawDisk({ handler, path: diskPath })
    await disk.init()

    assert.equal(disk.getUuid(), diskUuid)
    assert.equal(disk.getVirtualSize(), VIRTUAL_SIZE)
    assert.equal(disk.getBlockSize(), BLOCK_SIZE)
    assert.equal(disk.isDifferencing(), false)
  })

  test('writeBlock and readBlock round-trip', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const blockIndex = 3
    const written = Buffer.alloc(BLOCK_SIZE, blockIndex)
    await disk.writeBlock({ index: blockIndex, data: written })

    const { index, data } = await disk.readBlock(blockIndex)
    assert.equal(index, blockIndex)
    assert.equal(data.length, BLOCK_SIZE)
    assert.ok(data.equals(written), 'read data must equal written data')
  })

  test('unwritten blocks read back as zeros', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const { data } = await disk.readBlock(0)
    assert.ok(data.equals(Buffer.alloc(BLOCK_SIZE, 0)), 'unwritten block must read as zeros')
  })

  test('hasBlock always returns true (V1)', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const blockCount = disk.getMaxBlockCount()
    for (let i = 0; i < blockCount; i++) {
      assert.equal(disk.hasBlock(i), true)
    }
  })

  test('getBlockIndexes covers all blocks', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const indexes = disk.getBlockIndexes()
    const expected = Array.from({ length: disk.getMaxBlockCount() }, (_, i) => i)
    assert.deepEqual(indexes, expected)
  })

  test('resize extends data file and updates JSON', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const newBlockCount = disk.getMaxBlockCount() + 5
    await disk.resize(newBlockCount)

    const newVirtualSize = newBlockCount * BLOCK_SIZE
    assert.equal(disk.getVirtualSize(), newVirtualSize)

    const meta = JSON.parse(await handler.readFile(diskPath))
    assert.equal(meta.virtualSize, newVirtualSize)

    const actualSize = await handler.getSize(diskPath + '.data')
    assert.equal(actualSize, newVirtualSize)
  })

  test('listAssociatedFiles returns JSON and data paths', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const files = await disk.listAssociatedFiles(basePath)
    assert.ok(files.includes(diskPath), 'must include JSON path')
    assert.ok(files.includes(diskPath + '.data'), 'must include data path')
    assert.equal(files.length, 2)
  })

  test('unlink removes both JSON and data files', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    await disk.unlink()

    const files = await handler.list(basePath)
    assert.ok(!files.includes('snap.raw'), 'JSON file must be deleted')
    assert.ok(!files.includes('snap.raw.data'), 'data file must be deleted')
  })

  test('rename moves both files', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })

    const newPath = `${basePath}/snap2.raw`
    await disk.rename(newPath)

    const files = await handler.list(basePath)
    assert.ok(files.includes('snap2.raw'), 'renamed JSON file must exist')
    assert.ok(files.includes('snap2.raw.data'), 'renamed data file must exist')
    assert.ok(!files.includes('snap.raw'), 'old JSON file must be gone')
    assert.ok(!files.includes('snap.raw.data'), 'old data file must be gone')

    assert.equal(disk.getPath(), newPath)
  })

  test('isDifferencing returns false', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })
    assert.equal(disk.isDifferencing(), false)
  })

  test('getParentPath throws', async () => {
    const diskPath = `${basePath}/snap.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: VIRTUAL_SIZE,
      uuid: uniqueId(),
    })
    assert.throws(() => disk.getParentPath(), /no parent/)
  })

  test('last block alignment: virtualSize not a multiple of blockSize', async () => {
    // 10 MiB + 1 byte → 6 blocks needed, file size = 6 * BLOCK_SIZE
    const unalignedSize = 5 * BLOCK_SIZE + 1
    const diskPath = `${basePath}/unaligned.raw`
    const disk = await RemoteRawDisk.create({
      handler,
      path: diskPath,
      virtualSize: unalignedSize,
      uuid: uniqueId(),
    })

    assert.equal(disk.getMaxBlockCount(), 6)
    const actualSize = await handler.getSize(diskPath + '.data')
    assert.equal(actualSize, 6 * BLOCK_SIZE)
    // virtualSize in JSON is the exact (unaligned) value
    assert.equal(disk.getVirtualSize(), unalignedSize)
  })
})
