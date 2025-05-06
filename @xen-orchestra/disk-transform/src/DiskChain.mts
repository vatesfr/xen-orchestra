import {  RandomAccessDisk, type DiskBlock } from './Disk.mjs'
import assert from 'node:assert'
import { DiskSmallerBlock } from './DiskSmallerBlock.mjs'
import { DiskLargerBlock } from './DiskLargerBlock.mjs'
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
      let parent  = await disk.openParent() as RandomAccessDisk
      if(parent.getBlockSize()> disk.getBlockSize()){
        parent = new DiskSmallerBlock(parent,disk.getBlockSize() )
      } else if(parent.getBlockSize()> disk.getBlockSize()){
        parent = new DiskLargerBlock(parent,disk.getBlockSize() )
      }
      assert.strictEqual(parent.getBlockSize(), disk.getBlockSize(), `all the disk in a chain must have the same block size`)
      disks.unshift(parent)
      disk = parent
      // @todo handle until
    }
    return new DiskChain({ disks })

  }
}
