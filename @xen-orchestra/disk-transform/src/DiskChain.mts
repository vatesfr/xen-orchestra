import { Disk, RandomAccessDisk, type DiskBlock } from './Disk.mjs'

export class DiskChain extends RandomAccessDisk {
  #disks: Array<RandomAccessDisk> = []

  constructor({ disks }: { disks: Array<RandomAccessDisk> }) {
    super()
    this.#disks = disks
  }
  getVirtualSize(): number {
    return this.#disks[this.#disks.length - 1].getVirtualSize()
  }
  getBlockSize(): number {
    return this.#disks[0].getBlockSize()
  }

  /**
   * the main difference with the base disk block method 
   * is that if any of th disk has this block it return true
   * 
   */
  hasBlock(index: number): boolean {
    for (let i = this.#disks.length - 1; i >= 0; i--) {
      if (this.#disks[i].hasBlock(index)) {
        return true
      }
    }
    return false
  }

  readBlock(index: number): Promise<DiskBlock> {
    for (let i = this.#disks.length - 1; i >= 0; i--) {
      if (this.#disks[i].hasBlock(index)) {
        return this.#disks[i].readBlock(index)
      }
    }
    throw new Error(`Block ${index} not found in chain `)
  }

  async init(): Promise<void> {
    await Promise.all(this.#disks.map(disk => disk.init()))
  }
  async close(): Promise<void> {
    await Promise.all(this.#disks.map(disk => disk.close()))
  }
  getBlockIndexes(): Array<number> {
    return [...new Set(this.#disks.map(disk => disk.getBlockIndexes()).flat())]
  }

  isDifferencing(): boolean {
    return this.#disks[0].isDifferencing()
  }
  static async openFromChild(child:RandomAccessDisk):Promise<RandomAccessDisk>{
    let disk = child
    const disks=[disk]
    while (disk.isDifferencing()) {
      disk = await disk.openParent() as RandomAccessDisk
      disks.unshift(disk)
      // @todo handle until
    }
    return new DiskChain({ disks })

  }
}
