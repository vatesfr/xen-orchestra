export type DiskBlockData = Buffer
export type DiskBlock = {
  index: number // the index of the block. Offset in raw disk is index * blockSize
  data: DiskBlockData // thue Buffer like data of this block. Must be blockSize length
}

export type BytesLength = number

export abstract class Disk {
  generatedDiskBlocks = 0
  yieldedDiskBlocks = 0
  #parent?: Disk
  get parent(): Disk | undefined {
    return this.#parent
  }

  abstract getVirtualSize(): number
  abstract getBlockSize(): number
  abstract init(): Promise<void>
  abstract close(): Promise<void>

  abstract isDifferencing(): boolean
  // optional method
  instantiateParent(): Promise<Disk> {
    throw new Error('Method not implemented.')
  }
  async openParent(): Promise<Disk> {
    if (this.#parent !== undefined) {
      return this.#parent
    }
    if (!this.isDifferencing()) {
      throw new Error("Can't open the parent of a non differencing disk")
    }
    this.#parent = await this.instantiateParent()
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
      const blockGenerator = await this.buildDiskBlockGenerator()
      console.log('got generator', blockGenerator)
      for await (const block of blockGenerator) {
        this.generatedDiskBlocks++
        yield block
        this.yieldedDiskBlocks++
      }
      console.log('done')
    } catch (err) {
      console.error('Disk.generator', err)
    } finally {
      console.log('finally')
      await this.close()
    }
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
  #parent?: RandomAccessDisk
  get parent(): RandomAccessDisk | undefined {
    return this.#parent
  }
  // can read data parent if block size are not aligned
  // but only if this disk has data on this block
  abstract readBlock(index: number): Promise<DiskBlock>
  async *buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    for (const index of this.getBlockIndexes()) {
      yield this.readBlock(index)
    }
  }
}
