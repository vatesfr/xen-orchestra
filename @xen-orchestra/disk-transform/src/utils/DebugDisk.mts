import { Disk, DiskBlock, RandomAccessDisk } from '../Disk.mjs'

/**
 * utility class that generate a random disk
 */
export class DebugDisk extends RandomAccessDisk {
  #nbBlocks: number
  #blockSize: number
  #fillRate: number // 0 - 100
  #filledBy: number // 0 255
  blocks: Array<boolean> = []
  closeDone = false
  initDone = false
  constructor({
    nbBlocks,
    blockSize,
    fillRate,
    filledBy = 0,
  }: {
    nbBlocks: number
    blockSize: number
    fillRate: number
    filledBy?: number
  }) {
    super()
    this.#nbBlocks = nbBlocks
    this.#blockSize = blockSize
    this.#fillRate = fillRate
    this.#filledBy = filledBy
  }
  getVirtualSize(): number {
    return this.#blockSize * this.#nbBlocks
  }
  getBlockSize(): number {
    return this.#blockSize
  }
  async init(): Promise<void> {
    for (let i = 0; i < this.#nbBlocks; i++) {
      this.blocks.push(Math.random() <= this.#fillRate / 100)
    }
    this.initDone = true
  }
  async close(): Promise<void> {
    this.closeDone = true
  }
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): Array<number> {
    const indexes = []
    for (let i = 0; i < this.#nbBlocks; i++) {
      if (this.blocks[i]) {
        indexes.push(i)
      }
    }
    return indexes
  }
  hasBlock(index: number): boolean {
    return this.blocks[index]
  }
  async readBlock(index: number): Promise<DiskBlock> {
    return {
      index,
      data: Buffer.alloc(this.getBlockSize(), this.#filledBy),
    }
  }
}
