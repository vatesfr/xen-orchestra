import assert from 'node:assert'
import { test } from 'node:test'
import { DiskSmallerBlock, RandomAccessDisk, type DiskBlock } from '@xen-orchestra/disk-transform'
import { toQcow2Stream } from './ConsumerQcowStream.mjs'


class FullyAllocatedMockDisk extends RandomAccessDisk {
  private blockSize: number
  private virtualSize: number
  private blocks: Map<number, Buffer>
  public closed: boolean = false
  public initialized: boolean = false
  public isDiff: boolean = false
  public parentDisk: RandomAccessDisk | null = null
  private readonly nbBlocks: number

  constructor(blockSize: number, virtualSize: number, blocks: [number, Buffer][] = []) {
    super()
    this.blockSize = blockSize
    this.virtualSize = virtualSize
    this.blocks = new Map(blocks)
    this.nbBlocks = Math.ceil(virtualSize / blockSize)
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
    return Array.from({ length: this.nbBlocks }, (_, i) => i)
  }

  hasBlock(index: number): boolean {
    return index >= 0 && index < this.nbBlocks
  }
}

// Regression test linked to ticket #59102
test('does not throw RangeError: Invalid array length on large fully-allocated disk', async () => {
  const VHD_BLOCK_SIZE = 2 * 1024 * 1024 // 2097152
  const QCOW2_CLUSTER_SIZE = 64 * 1024 // 65536
  const DISK_CAPACITY = 7696581394432 // 7.18 TB — exact value from bug report

  const source = new FullyAllocatedMockDisk(VHD_BLOCK_SIZE, DISK_CAPACITY)
  await source.init()
  const disk = new DiskSmallerBlock(source, QCOW2_CLUSTER_SIZE)
  assert.doesNotThrow(() => toQcow2Stream(disk))
})
