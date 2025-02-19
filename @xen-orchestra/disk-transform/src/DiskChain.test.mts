import { afterEach, beforeEach, test } from 'node:test'
import assert from 'node:assert'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { DiskChain } from './DiskChain.mjs'

test('Disk class', async t => {
  const blockSize = 1024
  const nbBlocks = 20
  const nbDisks = 5
  const disks: Array<DebugDisk> = []
  let chain: DiskChain
  beforeEach(async () => {
    for (let i = 0; i < nbDisks; i++) {
      const disk = new DebugDisk({ nbBlocks: nbBlocks + 1, blockSize, fillRate: 0, filledBy: i })
      disks.push(disk)
    }
    chain = new DiskChain({ disks })
    await chain.init()
  })
  afterEach(async () => {
    await chain.close()
  })
  await t.test('getVirtualSize', () => {
    // the size of the last one
    assert.strictEqual(chain.getVirtualSize(), disks[disks.length - 1].getVirtualSize())
  })

  await t.test('getBlockSize', () => {
    assert.strictEqual(chain.getBlockSize(), blockSize)
  })

  await t.test('diskBlocks generator read from the right disk', async () => {
    const keys = []

    for (let blockIndex = 0; blockIndex < nbBlocks; blockIndex++) {
      disks[0].blocks[blockIndex] = true //each disk only have one block, its disk index
      keys.push(blockIndex)
    }
    for (let diskIndex = 0; diskIndex < nbDisks; diskIndex++) {
      disks[diskIndex].blocks[diskIndex] = true //each disk only have one block, its disk index
    }

    const foundKeys = []
    for await (const block of await chain.diskBlocks()) {
      foundKeys.push(block.index)
      assert.strictEqual(block.data.length, blockSize)
      if (block.index < nbDisks) {
        assert.strictEqual(block.data.readUInt8(0), block.index)
      } else {
        // read from first
        assert.strictEqual(block.data.readUInt8(0), 0)
      }
    }

    assert.strictEqual(chain.yieldedDiskBlocks, nbBlocks)

    keys.sort()
    foundKeys.sort()
    assert.deepStrictEqual(keys, foundKeys)
  })
})
