import assert, { throws } from 'node:assert'
import { RandomAccessDisk, type Disk, type DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export class DiskSmallerBlock extends DiskPassthrough {
  #blockSize
  #generatedDiskBlocks = 0
  #blockCache?: DiskBlock

  constructor(source: Disk, blockSize: number) {
    super(source)
    assert.ok(
      blockSize <= source.getBlockSize(),
      `target block size ${blockSize} must be smaller than the source block size ${source.getBlockSize()} `
    )

    assert.strictEqual(
      source.getBlockSize() % blockSize,
      0,
      `target block size ${blockSize} must be a multiple of the source block size ${source.getBlockSize()} `
    )
    this.#blockSize = blockSize
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
      for await (const { data: sourceData, index: sourceIndex } of sourceGenerator) {
        for (let i = 0; i < blockRatio; i++) {
          this.#generatedDiskBlocks++
          const data = sourceData.subarray(i * this.#blockSize, (i + 1) * this.#blockSize)
          yield {
            index: sourceIndex * blockRatio + i,
            data,
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
  getBlockIndexes(): Array<number> {
    const blockRatio = this.source.getBlockSize() / this.getBlockSize()
    const sourceIndexes = this.source.getBlockIndexes()
    const indexes: Array<number> = []
    const maxIndex = Math.ceil(this.getVirtualSize() / this.getBlockSize())
    for (const sourceIndex of sourceIndexes) {
      for (let i = 0; i < blockRatio; i++) {
        const index = sourceIndex * blockRatio + i
        if (index < maxIndex) {
          indexes.push(index)
        }
      }
    }
    return indexes
  }

  hasBlock(index: number): boolean {
    const blockRatio = this.source.getBlockSize() / this.getBlockSize()
    const sourceIndex = Math.floor(index / blockRatio)
    return this.source.hasBlock(sourceIndex)
  }

  async readBlock(index: number): Promise<DiskBlock> {
    if (this.source instanceof RandomAccessDisk) {
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
