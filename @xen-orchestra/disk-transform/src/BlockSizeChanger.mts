import { RandomAccessDisk, type DiskBlock, type Disk } from './Disk.mjs'

/**
 * Present a portable disk with another block size, for example
 * VHD use 2MB blocks
 * VMDK use mostly 64kb grain size
 * NBD is aligned to 64KB , but can use anything
 * qcow2 use 64KB clusters, and can use subclusters
 */
export class BlockSizeChanger extends RandomAccessDisk {
  #source: RandomAccessDisk
  #blockSize
  constructor(source: RandomAccessDisk, blockSize: number) {
    super()
    this.#source = source
    this.#blockSize = this.#blockSize = blockSize
  }

  getVirtualSize(): number {
    return this.#source.getVirtualSize()
  }
  getBlockSize(): number {
    return this.#blockSize
  }
  readBlock(index: number): Promise<DiskBlock> {
    throw new Error('Method not implemented.')
  }
  buildDiskBlockGenerator(): AsyncGenerator<DiskBlock, void, unknown> {
    throw new Error('Method not implemented.')
  }

  init(): Promise<void> {
    return this.#source.init()
  }
  close(): Promise<void> {
    return this.#source.close()
  }
  async openParent(): Promise<Disk> {
    const parent = (await this.#source.openParent()) as RandomAccessDisk
    return new BlockSizeChanger(parent, this.#blockSize)
  }
  isDifferencing(): boolean {
    return this.#source.isDifferencing()
  }

  getBlockIndexes(): Array<number> {
    // if new block size si smaller => makr all the generated blocks as present
    // if it's the opposite : mark the block used if any of the sub block is used
    throw new Error('Method not implemented.')
  }
  hasBlock(index: number): boolean {
    throw new Error('Method not implemented.')
  }
  diskBlocks(): AsyncGenerator<DiskBlock> {
    // if new block size si smaller => read the big block and split
    // else
    // ensure we have a full chain until a non differencing disk
    // read all the subblocks and glue them together
    throw new Error('Method not implemented.')
  }
}
