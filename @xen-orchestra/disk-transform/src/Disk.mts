import { ProgressHandler } from './ProgressHandler.mjs'

export type DiskBlockData = Buffer
export type DiskBlock = {
  index: number // the index of the block. Offset in raw disk is index * blockSize
  data: DiskBlockData // thue Buffer like data of this block. Must be blockSize length
}

export type BytesLength = number

export abstract class Disk {
  #generatedDiskBlocks = 0
  #parent?: Disk
  progressHandler?: ProgressHandler
  get parent(): Disk | undefined {
    return this.#parent
  }

  abstract getVirtualSize(): number
  abstract getBlockSize(): number
  abstract init(): Promise<void>
  abstract close(): Promise<void>

  abstract isDifferencing(): boolean
  // optional method
  instantiateParent(): Disk {
    throw new Error('Method not implemented.')
  }
  async openParent(): Promise<Disk> {
    if (this.#parent !== undefined) {
      return this.#parent
    }
    if (!this.isDifferencing()) {
      throw new Error("Can't open the parent of a non differencing disk")
    }
    this.#parent = this.instantiateParent()
    await this.#parent.init()
    return this.#parent
  }

  /**
   * return the block without any order nor stability guarantee
   */
  abstract getBlockIndexes(): Array<number>
  // must return true if the block is present in this disk
  // without looking at the parent
  abstract hasBlock(index: number): boolean
  abstract buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> | AsyncGenerator<DiskBlock>
  async *diskBlocks(uid?: string): AsyncGenerator<DiskBlock> {
    try {
      // compute next block while the destination is consuming the current block
      const blockGenerator = await this.buildDiskBlockGenerator()
      let next = blockGenerator.next()
      while (true) {
        const res = await next
        next = blockGenerator.next()
        if (res.done) {
          break
        }
        this.#generatedDiskBlocks++
        yield res.value
      }
    } finally {
      await this.close()
    }
  }

  getNbGeneratedBlock(): number {
    return this.#generatedDiskBlocks
  }
  check() {
    // @todo move here the checks done in cleanVm if possible
    return Promise.resolve(true)
  }

  // @todo readRawData will be needed for file level restore
  // @todo rename will be needed for merge
  // @todo : should the alias part moved from remote/vhd ?
}

/**
 * Disks implementing this class can be accessed in any order
 * For example xva will need to have data in the offset order
 */

export abstract class RandomAccessDisk extends Disk {
  get parent(): RandomAccessDisk | undefined {
    if (super.parent !== undefined && !(super.parent instanceof RandomAccessDisk)) {
      throw new Error('The parent of a random access disk must be a random access disk')
    }
    return super.parent
  }
  // optional method
  instantiateParent(): RandomAccessDisk {
    throw new Error('Method not implemented.')
  }
  // can read data parent if block size are not aligned
  // but only if this disk has data on this block
  abstract readBlock(index: number): Promise<DiskBlock>
  async *buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    try {
      const indexes = this.getBlockIndexes()
      for (let i = 0; i < indexes.length; i++) {
        yield this.readBlock(indexes[i])
        await this.progressHandler?.setProgress(i / indexes.length)
      }
      await this.progressHandler?.setProgress(1)
    } finally {
      await this.progressHandler?.done()
    }
  }
}
