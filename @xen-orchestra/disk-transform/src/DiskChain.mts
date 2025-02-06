import { PortableDisk, RandomAccessDisk, type DiskBlock } from './PortableDisk.mts'

export class DiskChain extends RandomAccessDisk {
  #disks: Array<RandomAccessDisk> = []
  public get virtualSize(): number {
    return this.#disks[this.#disks.length - 1].virtualSize
  }
  public get blockSize(): number {
    return this.#disks[0].blockSize
  }

  constructor(disks: Array<RandomAccessDisk>) {
    super()
    this.#disks = disks
  }
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

  openParent(): Promise<PortableDisk> {
    throw new Error('Method not implemented.')
  }
}
