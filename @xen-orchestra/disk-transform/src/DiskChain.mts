import { Disk, RandomAccessDisk, type DiskBlock } from './Disk.mjs'
import assert from 'node:assert'
import { DiskSmallerBlock } from './DiskSmallerBlock.mjs'
import { DiskLargerBlock } from './DiskLargerBlock.mjs'
export class DiskChain extends RandomAccessDisk {
  #disks: Array<RandomAccessDisk> = []
  #parent?: RandomAccessDisk

  get parent(): RandomAccessDisk | undefined {
    return this.#parent
  }
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
   * is that if any of the disk has this block it return true
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

  /**
   * Read in the last disk first an only go back if the block is not present
   * @param index
   * @returns
   */
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

  instantiateParent(): RandomAccessDisk {
    return this.#disks[0].instantiateParent()
  }
  async openParent(): Promise<Disk> {
    const disk = await this.#disks[0].openParent()
    if (!(disk instanceof RandomAccessDisk)) {
      throw new Error(`can't use non random access disk in chain open parent`)
    }
    this.#parent = disk
    return this.#parent
  }

  getBlockIndexes(): Array<number> {
    return [...new Set(this.#disks.map(disk => disk.getBlockIndexes()).flat())]
  }

  isDifferencing(): boolean {
    return this.#disks[0].isDifferencing()
  }
  static async openFromChild(
    child: RandomAccessDisk,
    until?: (disk: RandomAccessDisk) => Promise<boolean>,
    strictUntil = true
  ): Promise<RandomAccessDisk> {
    let disk = child
    const disks = [disk]
    let foundUntil = false
    while (disk.isDifferencing()) {
      let parent = (await disk.openParent()) as RandomAccessDisk
      if (until && (await until(parent))) {
        foundUntil = true
        break
      }
      if (parent.getBlockSize() > disk.getBlockSize()) {
        parent = new DiskSmallerBlock(parent, disk.getBlockSize())
      } else if (parent.getBlockSize() > disk.getBlockSize()) {
        parent = new DiskLargerBlock(parent, disk.getBlockSize())
      }
      assert.strictEqual(
        parent.getBlockSize(),
        disk.getBlockSize(),
        `all the disk in a chain must have the same block size`
      )
      disks.unshift(parent)
      disk = parent
      // @todo handle until
    }
    if (until && strictUntil && !foundUntil) {
      throw new Error('Not found disk marked as target while opening chain')
    }
    return new DiskChain({ disks })
  }
}
