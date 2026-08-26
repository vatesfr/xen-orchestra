import assert from 'node:assert'
import { DiskBlock, RandomAccessDisk } from './Disk.mjs'
import { RandomDiskPassthrough } from './DiskPassthrough.mjs'
import { DiskChain } from './DiskChain.mjs'

export class DiskLargerBlock extends RandomDiskPassthrough {
  #blockSize
  #parent?: RandomAccessDisk

  /**
   * @param source Must already be initialized: DiskLargerBlock never calls source.init() itself,
   * it relies on RandomDiskPassthrough's default init(), which only opens a source that wasn't
   * already provided via this constructor.
   */
  constructor(source: RandomAccessDisk, blockSize: number) {
    super(source)
    assert.ok(
      blockSize >= source.getBlockSize(),
      `target block size ${blockSize} must be bigger than the source block size ${source.getBlockSize()} `
    )

    assert.strictEqual(
      blockSize % source.getBlockSize(),
      0,
      `target block size ${blockSize} must be a multiple of the source block size ${source.getBlockSize()} `
    )
    this.#blockSize = blockSize
  }
  openSource(): Promise<RandomAccessDisk> {
    // not an issue since source MUST BE passed to the constructor
    throw new Error('Method not implemented.')
  }
  async readBlock(index: number): Promise<DiskBlock> {
    if (!this.hasBlock(index)) {
      throw new Error(`Block ${index} not present in this disk`)
    }
    // @todo handle partial block at the end
    const source = this.source
    const destinationBlockData = Buffer.alloc(this.getBlockSize(), 0)
    const blockRatio = this.#blockSize / source.getBlockSize()
    const firstSourceBlockIndex = index * blockRatio
    for (let i = firstSourceBlockIndex; i < firstSourceBlockIndex + blockRatio; i++) {
      let data: Buffer | undefined
      if (source.hasBlock(i)) {
        data = (await source.readBlock(i)).data
      } else {
        if (this.isDifferencing()) {
          if (this.#parent === undefined) {
            const directParent = (await source.openParent()) as RandomAccessDisk
            const chain = await DiskChain.openFromChild(directParent)
            this.#parent = chain
          }
          const parent = this.#parent!
          data = (await parent.readBlock(i)).data
        }
      }
      if (data !== undefined) {
        data.copy(destinationBlockData, (i - firstSourceBlockIndex) * source.getBlockSize())
      }
    }
    return {
      index,
      data: destinationBlockData,
    }
  }

  getBlockSize(): number {
    return this.#blockSize
  }

  getBlockIndexes(): Array<number> {
    const maxBlock = Math.ceil(this.getVirtualSize() / this.getBlockSize())
    const indexes = []
    for (let i = 0; i < maxBlock; i++) {
      if (this.hasBlock(i)) {
        indexes.push(i)
      }
    }
    return indexes
  }

  getBlockIndexesCount(): number {
    let count = 0
    const maxBlock = Math.ceil(this.getVirtualSize() / this.getBlockSize())
    for (let i = 0; i < maxBlock; i++) {
      if (this.hasBlock(i)) {
        count++
      }
    }
    return count
  }

  hasBlock(index: number): boolean {
    const source = this.source
    let maxBlockSource = Math.ceil(source.getVirtualSize() / source.getBlockSize())
    let blockRatio = this.#blockSize / this.source.getBlockSize()
    for (let i = index * blockRatio; i < Math.min((index + 1) * blockRatio, maxBlockSource); i++) {
      if (this.source.hasBlock(i)) {
        return true
      }
    }
    return false
  }
}
