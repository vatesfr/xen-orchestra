import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert'
import { DebugDisk } from './utils/DebugDisk.mjs'

test('Disk class', async t => {
  const blockSize = 1024
  const nbBlocks = 20
  let disk: DebugDisk
  beforeEach(async () => {
    disk = new DebugDisk({ nbBlocks, blockSize, fillRate: 0 })

    await disk.init()
  })
  afterEach(async () => {
    await disk.close()
  })
  await t.test('getVirtualSize', () => {
    assert.strictEqual(disk.getVirtualSize(), blockSize * nbBlocks)
  })

  await t.test('getBlockSize', () => {
    assert.strictEqual(disk.getBlockSize(), blockSize)
  })

  await t.test('diskBlocks generator', async () => {
    const keys = [4, 15]
    for (const key of keys) {
      disk.blocks[key] = true
    }
    const foundKeys = []
    for await (const block of await disk.diskBlocks()) {
      foundKeys.push(block.index)
      assert.strictEqual(block.data.length, blockSize)
    }

    assert.strictEqual(disk.yieldedDiskBlocks, 2)

    keys.sort()
    foundKeys.sort()
    assert.deepStrictEqual(keys, foundKeys)
  })
})
