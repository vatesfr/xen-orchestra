import { RemoteDiskChain } from '../RemoteDiskChain.mjs'
// type only: HashedDiskDeduplicated imports this class at runtime
import type { HashedDiskDeduplicated } from './HashedDiskDeduplicated.mjs'
import type { BlockHash } from './hbdPaths.mjs'

/**
 * A chain of hbd disks, oldest first, read as a single disk.
 *
 * The child of a hbd merge is always one of these (see openDiskChain): it
 * exposes what the merge needs from the newest disk holding each block.
 */
export class HashedDiskChain extends RemoteDiskChain {
  constructor({ disks }: { disks: HashedDiskDeduplicated[] }) {
    super({ disks })
  }

  get disks(): HashedDiskDeduplicated[] {
    return super.disks as HashedDiskDeduplicated[]
  }

  getBlockHashAt(index: number): BlockHash {
    return this.#newestDiskWith(index).getBlockHashAt(index)
  }

  getBlockPath(index: number): string {
    return this.#newestDiskWith(index).getBlockPath(index)
  }

  /** block files are independent, nothing is shared inside a single disk */
  async canMergeConcurently(): Promise<boolean> {
    return true
  }

  /** Virtual usage of each disk, as HashedDiskDeduplicated.getSizeOnDisk */
  getSizeOnDisk(): number {
    return this.disks.reduce((size, disk) => size + disk.getSizeOnDisk(), 0)
  }

  getRootDisk(): HashedDiskDeduplicated | undefined {
    return this.disks[0]
  }

  #newestDiskWith(index: number): HashedDiskDeduplicated {
    const disk = this.newestDiskWith(index)
    if (disk === undefined) {
      throw new Error(`Block ${index} not found in chain`)
    }
    return disk as HashedDiskDeduplicated
  }
}
