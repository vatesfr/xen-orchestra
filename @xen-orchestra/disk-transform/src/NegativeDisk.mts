import { DiskBlock, Disk, RandomAccessDisk } from './Disk.mjs'
import assert from 'node:assert'

/**
 * expose a differencing disk that contains the difference
 * between child and parent
 *
 * the chain parent - child - negative will contains exactly the
 * same data as parent, this is used to rewind a disk to a previous
 * state
 */
export class NegativeDisk extends RandomAccessDisk {
  #parent: RandomAccessDisk
  #child: RandomAccessDisk

  constructor(parent: RandomAccessDisk, child: RandomAccessDisk) {
    super()
    this.#parent = parent
    this.#child = child
    // @todo : should also check chain
    assert.strictEqual(parent.getBlockSize(), child.getBlockSize(), 'GEOMETRY_CHANGED')
    assert.strictEqual(parent.getVirtualSize(), child.getVirtualSize(), 'GEOMETRY_CHANGED')
  }
  getVirtualSize(): number {
    return this.#child.getVirtualSize()
  }
  getBlockSize(): number {
    return this.#child.getBlockSize()
  }
  readBlock(index: number): Promise<DiskBlock> {
    if (this.#parent.hasBlock(index)) {
      return this.#parent.readBlock(index)
    }
    // a new block => return an empty one
    return Promise.resolve({
      index,
      data: Buffer.alloc(this.getBlockSize(), 0),
    })
  }
  async init(): Promise<void> {
    await Promise.all([this.#parent.init(), this.#child.init()])
  }
  async close(): Promise<void> {
    await Promise.all([this.#parent.close(), this.#child.close()])
  }
  isDifferencing(): boolean {
    return true
  }
  getBlockIndexes(): Array<number> {
    return this.#child.getBlockIndexes()
  }
  hasBlock(index: number): boolean {
    return this.#child.hasBlock(index)
  }
}
