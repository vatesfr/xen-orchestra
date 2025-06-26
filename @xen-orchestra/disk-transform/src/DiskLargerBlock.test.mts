import assert from 'node:assert'
import { test } from 'node:test'
import { DiskLargerBlock } from './DiskLargerBlock.mjs'
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
  const disk = new DiskLargerBlock(source, 1024)

  // Test that blockSize must be a multiple of source blockSize
  await assert.rejects(
    async () => {
      const invalidDisk = new DiskLargerBlock(source, 513)
      await invalidDisk.init()
    },
    { message: /must be a multiple/ }
  )
  // Test that blockSize must be bigger than source blockSize
  await assert.rejects(
    async () => {
      const invalidDisk = new DiskLargerBlock(source, 128)
      await invalidDisk.init()
    },
    { message: /bigger/ }
  )

  await disk.init()
  assert.strictEqual(disk.getBlockSize(), 1024)
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

  const disk = new DiskLargerBlock(source, 1024)
  await disk.init()

  // Read the combined block (should be block1 + block2)
  const result = await disk.readBlock(0)
  assert.strictEqual(result.index, 0)
  assert.strictEqual(result.data.length, 1024)

  // Verify the data is correctly combined
  assert(result.data.subarray(0, 512).equals(block1))
  assert(result.data.subarray(512).equals(block2))
})

test('hasBlock behavior', async () => {
  const source = new MockDisk(512, 2048, [
    [0, Buffer.alloc(512)],
    [2, Buffer.alloc(512)],
  ])
  await source.init()

  const disk = new DiskLargerBlock(source, 1024)
  await disk.init()

  // Block 0 in disk (1024) covers blocks 0-1 in source (512)
  // Only block 0 exists in source, so hasBlock(0) should return true
  assert.strictEqual(disk.hasBlock(0), true)

  // Block 1 in disk covers blocks 2-3 in source
  // Block 2 exists but 3 doesn't, hasBlock(1) should still return true
  assert.strictEqual(disk.hasBlock(1), true)

  // Block 2 in disk would cover blocks 4-5 which don't exist
  assert.strictEqual(disk.hasBlock(2), false)
})

test('getBlockIndexes', async () => {
  const source = new MockDisk(512, 2048, [
    [0, Buffer.alloc(512)],
    [2, Buffer.alloc(512)],
  ])
  await source.init()

  const disk = new DiskLargerBlock(source, 1024)
  await disk.init()

  // Should return indexes where at least one source block exists in the range
  const indexes = disk.getBlockIndexes()
  assert.deepStrictEqual(indexes, [0, 1])
})

test('partial block handling', async () => {
  // Test when the last block is partial
  const source = new MockDisk(512, 1536, [
    [0, Buffer.alloc(512)],
    [1, Buffer.alloc(512)],
    [2, Buffer.alloc(512)],
  ])
  await source.init()

  const disk = new DiskLargerBlock(source, 1024)
  await disk.init()

  // First block is complete (blocks 0-1)
  const block0 = await disk.readBlock(0)
  assert.strictEqual(block0.data.length, 1024)

  // Second block is partial (only block 2 exists)
  const block1 = await disk.readBlock(1)
  assert.strictEqual(block1.data.length, 1024)

  // The first 512 bytes should be from block 2
  // The remaining 512 bytes should be zeros (since we allocate with zeros)
  assert(block1.data.subarray(512).every(b => b === 0))
  assert(block1.data.subarray(0, 512).equals((await source.readBlock(2)).data))
})

test('differencing disk behavior', async () => {
  // Create parent disk
  const parentBlock = createPatternBuffer(512, 'PARENT')
  const parent = new MockDisk(512, 1024, [[0, parentBlock]])
  await parent.init()

  // Create differencing disk
  const diffBlock = createPatternBuffer(512, 'DIFF')
  const diff = new MockDisk(512, 1024, [[1, diffBlock]])
  diff.isDiff = true
  diff.parentDisk = parent
  await diff.init()

  const disk = new DiskLargerBlock(diff, 1024)
  await disk.init()

  // Block 0 should combine parent block 0 and diff block 1
  const result = await disk.readBlock(0)
  assert.strictEqual(result.data.length, 1024)
  assert(result.data.subarray(0, 512).equals(parentBlock))
  assert(result.data.subarray(512).equals(diffBlock))
})

test('close propagation', async () => {
  const source = new MockDisk(512, 1024)
  await source.init()

  const disk = new DiskLargerBlock(source, 1024)
  await disk.init()

  await disk.close()
  assert.strictEqual(source.closed, true)
})

test('generator', async () => {
  const source = new MockDisk(512, 1024)
  await source.init()

  const disk = new DiskLargerBlock(source, 1024)
  await disk.init()
  for await (const block of disk.diskBlocks()) {
    assert.strictEqual(block.data.length, 1024)
  }
})
