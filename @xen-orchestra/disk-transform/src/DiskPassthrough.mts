import { Disk, DiskBlock, RandomAccessDisk } from './Disk.mjs'

export abstract class DiskPassthrough extends Disk {
  #source: Disk | undefined
  get source(): Disk {
    if (this.#source === undefined) {
      throw new Error(`can't call get source before init`)
    }
    return this.#source
  }
  get parent(): Disk | undefined {
    return this.#source?.parent
  }
  getVirtualSize(): number {
    return this.source.getVirtualSize()
  }
  getBlockSize(): number {
    return this.source.getVirtualSize()
  }

  abstract openSource(): Promise<Disk>
  async init(): Promise<void> {
    this.#source = await this.openSource()
    console.log('init done ')
  }

  instantiateParent(): Promise<Disk> {
    return this.source.instantiateParent()
  }
  async close(): Promise<void> {
    console.log('diskpasstrhough close ')
    await this.#source?.close()
  }
  isDifferencing(): boolean {
    return this.source.isDifferencing()
  }
  getBlockIndexes(): Array<number> {
    return this.source.getBlockIndexes()
  }
  hasBlock(index: number): boolean {
    return this.source.hasBlock(index)
  }
  async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> {
    return this.source.buildDiskBlockGenerator()
  }
}

export abstract class RandomDiskPassthrough extends RandomAccessDisk {
  #source: RandomAccessDisk | undefined
  get source(): Disk {
    if (this.#source === undefined) {
      throw new Error(`can't call get source before init`)
    }
    return this.#source
  }
  get parent(): RandomAccessDisk | undefined {
    return this.#source?.parent as RandomAccessDisk
  }
  /**
   * return an empty block if asking for and block not included in this disk
   * @param index
   * @returns {Promise<DiskBlock>}
   */
  readBlock(index: number): Promise<DiskBlock> {
    if (this.#source === undefined) {
      throw new Error(`can't call readBlock before init`)
    }
    return this.#source.readBlock(index)
  }
  getVirtualSize(): number {
    if (this.#source === undefined) {
      throw new Error(`can't call getVirtualSize before init`)
    }
    return this.#source.getVirtualSize()
  }
  getBlockSize(): number {
    if (this.#source === undefined) {
      throw new Error(`can't call getBlockSize before init`)
    }
    return this.#source.getBlockSize()
  }

  abstract openSource(): Promise<RandomAccessDisk>
  async init(): Promise<void> {
    this.#source = await this.openSource()
  }

  instantiateParent(): Promise<Disk> {
    if (this.#source === undefined) {
      throw new Error(`can't call instantiateParent before init`)
    }
    return this.#source.instantiateParent()
  }

  async close(): Promise<void> {
    await this.#source?.close()
  }

  isDifferencing(): boolean {
    if (this.#source === undefined) {
      throw new Error(`can't call isDifferencing before init`)
    }
    return this.#source.isDifferencing()
  }
  getBlockIndexes(): Array<number> {
    if (this.#source === undefined) {
      throw new Error(`can't call getBlockIndexes before init`)
    }
    return this.#source.getBlockIndexes()
  }
  hasBlock(index: number): boolean {
    if (this.#source === undefined) {
      throw new Error(`can't call hasBlock before init`)
    }
    return this.#source.hasBlock(index)
  }
}
