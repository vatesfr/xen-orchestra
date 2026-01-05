import assert, { throws } from 'node:assert'
import { RandomAccessDisk, type Disk, type DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export class DiskSmallerBlock extends DiskPassthrough {
  #blockSize
  #generatedDiskBlocks = 0
  #blockCache?: DiskBlock
  #blockRatio: number
  #maxBlockIndex: number

  constructor(source: Disk, blockSize: number) {
    super(source)
    assert.ok(
      blockSize <= source.getBlockSize(),
      `target block size ${blockSize} must be smaller than the source block size ${source.getBlockSize()} `
    )

    assert.strictEqual(
      source.getBlockSize() % blockSize,
      0,
      `source block size ${blockSize} must be a multiple of the target block size ${source.getBlockSize()} `
    )
    this.#blockSize = blockSize
    this.#blockRatio = source.getBlockSize() / blockSize
    this.#maxBlockIndex = Math.ceil(this.getVirtualSize() / this.getBlockSize())
  }

  openSource(): Promise<Disk> {
    // not an issue since source MUST BE passed to the constructor
    throw new Error('Method not implemented.')
  }

  getNbGeneratedBlock(): number {
    return this.#generatedDiskBlocks
  }

  async *diskBlocks(): AsyncGenerator<DiskBlock> {
    try {
      const blockRatio = this.source.getBlockSize() / this.#blockSize
      const sourceGenerator = this.source.diskBlocks()
      // we don't reuse getBlockIndexes here since we want don't want to force
      // a use of source.readblock that would limit the use of this class to RandomeAccessDisk
      // thus we generate block based on the source block generator
      for await (const { data: sourceData, index: sourceIndex } of sourceGenerator) {
        for (let i = 0; i < blockRatio; i++) {
          this.#generatedDiskBlocks++
          const data = sourceData.subarray(i * this.#blockSize, (i + 1) * this.#blockSize)
          const index = sourceIndex * blockRatio + i
          if (this.#isBlockBeforeEnd(index)) {
            yield {
              index,
              data,
            }
          }
        }
      }
    } finally {
      await this.progressHandler?.done()
      await this.close()
    }
  }

  getBlockSize(): number {
    return this.#blockSize
  }
  // changing the block size can lead
  // to the last block being incomplete
  // for example going for a block size of 1024 to 512
  // and a virtual size of 1200 means 2 blocks in source,
  // but 3 here
  #isBlockBeforeEnd(blockIndex: number): boolean {
    return blockIndex < this.#maxBlockIndex
  }
  getBlockIndexes(): Array<number> {
    const blockRatio = this.source.getBlockSize() / this.getBlockSize()
    const sourceIndexes = this.source.getBlockIndexes()
    const indexes: Array<number> = []
    for (const sourceIndex of sourceIndexes) {
      for (let i = 0; i < blockRatio; i++) {
        const index = sourceIndex * blockRatio + i
        if (this.#isBlockBeforeEnd(index)) {
          indexes.push(index)
        }
      }
    }
    return indexes
  }

  hasBlock(index: number): boolean {
    // asking for a block after the end of the smaller disk => false
    if (!this.#isBlockBeforeEnd(index)) {
      return false
    }
    const blockRatio = this.source.getBlockSize() / this.getBlockSize()
    const sourceIndex = Math.floor(index / blockRatio)
    return this.source.hasBlock(sourceIndex)
  }

  /**
   * handle gracefully readblock if the source is a RandomAccessDisk
   * @param index
   * @returns Promise<DiskBlock>
   */

  async readBlock(index: number): Promise<DiskBlock> {
    if (this.source instanceof RandomAccessDisk) {
      if (!this.#isBlockBeforeEnd(index)) {
        throw new Error(
          `Read after the end, asking for ${index}, last block is ${this.#maxBlockIndex - 1}, vitual size is ${this.getVirtualSize()}, blockSize : ${this.getBlockSize()}`
        )
      }
      const blockRatio = this.source.getBlockSize() / this.getBlockSize()
      const sourceBlockIndex = Math.floor(index / blockRatio)
      const indexInblock = index % blockRatio
      let block = this.#blockCache
      if (block?.index !== sourceBlockIndex) {
        this.#blockCache = block = await this.source.readBlock(sourceBlockIndex)
      }

      const data = block.data.subarray(indexInblock * this.#blockSize, (indexInblock + 1) * this.#blockSize)

      return {
        index,
        data,
      }
    } else {
      throw new Error('not implemented')
    }
  }
}
