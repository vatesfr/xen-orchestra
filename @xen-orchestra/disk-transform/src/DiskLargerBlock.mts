import assert from 'node:assert'
import { DiskBlock, RandomAccessDisk } from './Disk.mjs'
import { RandomDiskPassthrough } from './DiskPassthrough.mjs'
import { DiskChain } from './DiskChain.mjs'

export class DiskLargerBlock extends RandomAccessDisk {
  #blockSize
  #source: RandomAccessDisk
  #parent?: RandomAccessDisk
  get source(): RandomAccessDisk {
    return this.#source
  }

  constructor(source: RandomAccessDisk, blockSize: number) {
    super()
    this.#source = source
    assert.ok(
      blockSize >= source.getBlockSize(),
      `target block size ${blockSize} must be bigger the source block size ${source.getBlockSize()} `
    )

    assert.strictEqual(
      blockSize % this.source.getBlockSize(),
      0,
      `target block size ${blockSize} must be a multiple of the source block size ${source.getBlockSize()} `
    )
    this.#blockSize = blockSize
  }
  openSource(): Promise<RandomAccessDisk> {
    // not a issue since source MUST BE passed to the constructor
    throw new Error('Method not implemented.')
  }
  async readBlock(index: number): Promise<DiskBlock> {
    // @todo handle partial block at the end
    const source = this.source
    const destinationBlock = Buffer.alloc(this.getBlockSize(), 0)
    const blockRatio = this.#blockSize / source.getBlockSize()
    for (let i = index * blockRatio; i < (index + 1) * blockRatio; i++) {
      let data: Buffer | undefined
      if (source.hasBlock(i)) {
        data = (await source.readBlock(i)).data
      } else {
        if (this.isDifferencing()) {
          if (this.#parent === undefined) {
            const directParent = (await this.#source.openParent()) as RandomAccessDisk
            const chain = await DiskChain.openFromChild(directParent)
            this.#parent = chain
          }
          const parent = this.#parent!
          data = (await parent.readBlock(i)).data
        }
      }
      if (data !== undefined) {
        data.copy(destinationBlock, i * source.getBlockSize())
      }
    }
    return {
      index,
      data: destinationBlock,
    }
  }

  getBlockSize(): number {
    return this.#blockSize
  }

  getBlockIndexes(): Array<number> {
    const maxBlock = Math.ceil(this.getVirtualSize() / this.getBlockSize())
    const blockRatio = this.getBlockSize() / this.source.getBlockSize()
    const indexes = []
    for (let i = 0; i < maxBlock; i++) {
      for (let j = 0; j < blockRatio; j++) {
        if (this.source.hasBlock(i * blockRatio + j)) {
          indexes.push(i)
          break
        }
      }
    }
    return indexes
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

  getVirtualSize(): number {
    return this.source.getVirtualSize()
  }
  init(): Promise<void> {
    return this.source.init()
  }
  close(): Promise<void> {
    return this.source.close()
  }
  isDifferencing(): boolean {
    return this.source.isDifferencing()
  }
}
