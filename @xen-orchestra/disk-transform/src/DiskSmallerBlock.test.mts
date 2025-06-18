import assert from 'node:assert'
import { test } from 'node:test'
import { DiskSmallerBlock } from './DiskSmallerBlock.mjs'
import { RandomAccessDisk, DiskBlock, Disk } from './Disk.mjs'

// Mock implementation of RandomAccessDisk for testing
class MockDisk extends RandomAccessDisk {
  private blockSize: number
  private virtualSize: number
  private blocks: Map<number, Buffer>
  public closed: boolean = false
  public initialized: boolean = false
  public isDiff: boolean = false
  public parentDisk: RandomAccessDisk | null = null

  constructor(blockSize: number, virtualSize: number, blocks: [number, Buffer][] = []) {
    super()
    this.blockSize = blockSize
    this.virtualSize = virtualSize
    this.blocks = new Map(blocks)
  }

  async readBlock(index: number): Promise<DiskBlock> {
    if (this.closed) throw new Error('Disk closed')
    if (!this.initialized) throw new Error('Disk not initialized')
    if (!this.blocks.has(index)) {
      if (this.isDiff && this.parentDisk) {
        return this.parentDisk.readBlock(index)
      }
      throw new Error(`Block ${index} not found`)
    }
    return { index, data: this.blocks.get(index)! }
  }

  getVirtualSize(): number {
    return this.virtualSize
  }
  getBlockSize(): number {
    return this.blockSize
  }
  async init(): Promise<void> {
    this.initialized = true
  }
  async close(): Promise<void> {
    this.closed = true
  }
  isDifferencing(): boolean {
    return this.isDiff
  }
  instantiateParent(): RandomAccessDisk {
    if (!this.parentDisk) throw new Error('No parent disk available')
    return this.parentDisk
  }
  getBlockIndexes(): number[] {
    return [...this.blocks.keys()]
  }
  hasBlock(index: number): boolean {
    return this.blocks.has(index) || (this.isDiff && !!this.parentDisk && this.parentDisk.hasBlock(index))
  }
}

// Helper function to create a buffer with pattern
function createPatternBuffer(size: number, pattern: string): Buffer {
  const buf = Buffer.alloc(size)
  for (let i = 0; i < size; i++) {
    buf[i] = pattern.charCodeAt(i % pattern.length)
  }
  return buf
}

// Test suite
test('constructor and initialization', async () => {
  const source = new MockDisk(512, 1024 * 1024)
  const disk = new DiskSmallerBlock(source, 256)

  // Test that blockSize must be a multiple of source blockSize
  await assert.rejects(
    async () => {
      const invalidDisk = new DiskSmallerBlock(source, 452)
      await invalidDisk.init()
    },
    { message: /must be a multiple/ }
  )
  // Test that blockSize must bigger than  source blockSize
  await assert.rejects(
    async () => {
      const invalidDisk = new DiskSmallerBlock(source, 1024 * 2)
      await invalidDisk.init()
    },
    { message: /smaller/ }
  )

  await disk.init()
  assert.strictEqual(disk.getBlockSize(), 256)
  assert.strictEqual(disk.getVirtualSize(), 1024 * 1024)
})

test('readBlock with simple block mapping', async () => {
  // Create source disk with two 512-byte blocks
  const block1 = createPatternBuffer(512, 'A')
  const block2 = createPatternBuffer(512, 'B')
  const source = new MockDisk(512, 1024, [
    [0, block1],
    [1, block2],
  ])
  await source.init()

  const disk = new DiskSmallerBlock(source, 256)
  await disk.init()

  // Read the first block , half
  const result = await disk.readBlock(2)
  assert.strictEqual(result.index, 2)
  assert.strictEqual(result.data.length, 256)

  // Verify the data is correctly combined
  assert.strictEqual(block2.subarray(0, 256).equals(result.data), true)
})
test('readBlock interleaved', async () => {
  // Create source disk with two 512-byte blocks
  const block1 = createPatternBuffer(512, 'A')
  const block2 = createPatternBuffer(512, 'B')
  const source = new MockDisk(512, 1024, [
    [0, block1],
    [1, block2],
  ])
  await source.init()

  const disk = new DiskSmallerBlock(source, 256)
  await disk.init()

  // Read the first block , half
  await disk.readBlock(1)
  // then second block
  await disk.readBlock(2)
  // then back to first
  const result = await disk.readBlock(0)

  // Verify the data is correctly combined
  assert.strictEqual(block1.subarray(0, 256).equals(result.data), true)
})

test('hasBlock behavior', async () => {
  const source = new MockDisk(512, 2048, [
    [0, Buffer.alloc(512)],
    [2, Buffer.alloc(512)],
  ])
  await source.init()

  const disk = new DiskSmallerBlock(source, 256)
  await disk.init()

  assert.strictEqual(disk.hasBlock(0), true)
  assert.strictEqual(disk.hasBlock(1), true)
  assert.strictEqual(disk.hasBlock(2), false)
  assert.strictEqual(disk.hasBlock(3), false)
  assert.strictEqual(disk.hasBlock(4), true)
  assert.strictEqual(disk.hasBlock(5), true)
})

test('getBlockIndexes', async () => {
  const source = new MockDisk(512, 2048, [
    [0, Buffer.alloc(512)],
    [2, Buffer.alloc(512)],
  ])
  await source.init()

  const disk = new DiskSmallerBlock(source, 256)
  await disk.init()

  const indexes = disk.getBlockIndexes()
  assert.deepStrictEqual(indexes, [0, 1, 4, 5])
})

test('close propagation', async () => {
  const source = new MockDisk(512, 1024)
  await source.init()

  const disk = new DiskSmallerBlock(source, 256)
  await disk.init()

  await disk.close()
  assert.strictEqual(source.closed, true)
})
