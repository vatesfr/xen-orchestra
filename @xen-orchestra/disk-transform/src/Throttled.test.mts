import { test } from 'node:test'
import assert from 'node:assert'
import { Throttle } from '@vates/generator-toolbox'
import { DiskBlock } from './Disk.mjs'
import { DebugDisk } from './utils/DebugDisk.mjs'
import { ThrottledDisk } from './Throttled.mjs'

type TaggedDiskBlock = DiskBlock & { compression: string }

// a disk yielding blocks with an additional property, like the raw blocks of a VHD directory
class TaggedDebugDisk extends DebugDisk {
  async readBlock(index: number): Promise<TaggedDiskBlock> {
    return { ...(await super.readBlock(index)), compression: 'brotli' }
  }
}

test('ThrottledDisk keeps the other properties of the blocks', async () => {
  const blockSize = 1024
  const nbBlocks = 5
  const source = new TaggedDebugDisk({ nbBlocks, blockSize, fillRate: 100 })
  await source.init()
  // speed 0 disables the throttling
  const disk = new ThrottledDisk(source, new Throttle(0))

  let nbBlocksRead = 0
  for await (const block of disk.diskBlocks()) {
    assert.strictEqual((block as TaggedDiskBlock).compression, 'brotli')
    assert.strictEqual(block.data.length, blockSize)
    nbBlocksRead++
  }
  assert.strictEqual(nbBlocksRead, nbBlocks)
})

test('ThrottledDisk initializes its source', async () => {
  const source = new DebugDisk({ nbBlocks: 5, blockSize: 1024, fillRate: 100 })
  const disk = new ThrottledDisk(source, new Throttle(0))
  await disk.init()
  assert.strictEqual(source.initDone, true)
})
