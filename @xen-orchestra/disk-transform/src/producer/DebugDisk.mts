import { Disk, DiskBlock, RandomAccessDisk } from '../Disk.mjs'

/**
 * utility class that generate a random disk
 */
export class DebugDisk extends RandomAccessDisk {
  #nbBlocks: number
  #blockSize: number
  #fillRate: number // 0 - 100
  #blocks: Array<boolean> = []
  constructor({ nbBlocks, blockSize, fillRate }) {
    super()
    this.#nbBlocks = nbBlocks
    this.#blockSize = blockSize
    this.#fillRate = fillRate
  }
  getVirtualSize(): number {
    return this.#blockSize * this.#nbBlocks
  }
  getBlockSize(): number {
    return this.#blockSize
  }
  async init(): Promise<void> {
    for (let i = 0; i < this.#nbBlocks; i++) {
      this.#blocks.push(Math.random() < this.#fillRate / 100)
    }
    console.log(this.#blocks)
  }
  async close(): Promise<void> {}
  isDifferencing(): boolean {
    return false
  }
  openParent(): Promise<Disk> {
    throw new Error('Method not implemented.')
  }
  getBlockIndexes(): Array<number> {
    const indexes = []
    for (let i = 0; i < this.#nbBlocks; i++) {
      if (this.#blocks[i]) {
        indexes.push(i)
      }
    }
    return indexes
  }
  hasBlock(index: number): boolean {
    return this.#blocks[index]
  }
  async readBlock(index: number): Promise<DiskBlock> {
    return {
      index,
      data: Buffer.allocUnsafe(this.getBlockSize()),
    }
  }
}
