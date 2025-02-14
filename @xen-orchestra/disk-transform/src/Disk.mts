export type DiskBlockData = Buffer
export type DiskBlock = {
  index: number // the index of the block. Offset in raw disk is index * blockSize
  data: DiskBlockData // thue Buffer like data of this block. Must be blockSize length
}

export type BytesLength = number

export abstract class Disk {
  generatedDiskBlocks = 0
  yieldedDiskBlocks = 0

  abstract getVirtualSize(): number
  abstract getBlockSize(): number
  abstract init(): Promise<void>
  abstract close(): Promise<void>

  abstract isDifferencing(): boolean
  // must throw if disk is not differencing
  abstract openParent(): Promise<Disk>

  /**
   * return the block without any order nor stability guarantee
   */
  abstract getBlockIndexes(): Array<number>
  abstract hasBlock(index: number): boolean
  abstract buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> | AsyncGenerator<DiskBlock>
  async *diskBlocks(): AsyncGenerator<DiskBlock> {
    let generator: AsyncGenerator<DiskBlock>
    try {
      generator = await this.buildDiskBlockGenerator()
      for await (const block of generator) {
        this.generatedDiskBlocks++
        yield block
        this.yieldedDiskBlocks++
      }
    } finally {
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
  abstract readBlock(index: number): Promise<DiskBlock>
  async *buildDiskBlockGenerator() {
    for (const index of this.getBlockIndexes()) {
      yield this.readBlock(index)
    }
  }
}
