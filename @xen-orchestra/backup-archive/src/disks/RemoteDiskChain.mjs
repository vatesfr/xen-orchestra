// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 */

import { RemoteDisk } from './RemoteDisk.mjs'

/**
 * A chain of disks of the same format, oldest first, read as a single disk.
 *
 * Format agnostic: the format specific parts (size on disk, concurrent merge,
 * block location) are implemented by the subclasses.
 */
export class RemoteDiskChain extends RemoteDisk {
  /**
   * @type {RemoteDisk[]}
   */
  #disks

  /**
   * @param {Object} params
   * @param {RemoteDisk[]} params.disks
   */
  constructor({ disks }) {
    super()
    this.#disks = disks
  }

  /**
   * The disks of the chain, oldest first
   * @returns {RemoteDisk[]}
   */
  get disks() {
    return this.#disks
  }

  /**
   * Initializes the VHD chain
   * @param {Object} options
   * @param {boolean} options.force
   * @returns {Promise<void>}
   */
  async init(options) {
    try {
      await Promise.all(this.#disks.map(disk => disk.init(options)))
      let parentUuid = ''
      for (const [index, disk] of this.#disks.entries()) {
        if (index !== 0) {
          if (!disk.isDifferencing()) {
            throw Object.assign(new Error("Can't init vhd directory with non differencing child disks"), {
              code: 'NOT_SUPPORTED',
            })
          }
          if (disk.getParentUuid() !== parentUuid) {
            throw Object.assign(new Error("Can't init vhd directory with incorrect parentage"), {
              code: 'NOT_SUPPORTED',
            })
          }
        }

        parentUuid = disk.getUuid()
      }
    } catch (error) {
      await this.close()
      throw error
    }
  }

  /**
   * Closes the VHD.
   * @returns {Promise<void>}
   */
  async close() {
    await Promise.all(this.#disks.map(disk => disk.close()))
  }

  /**
   * @returns {number}
   */
  getVirtualSize() {
    return this.#disks[this.#disks.length - 1].getVirtualSize()
  }

  /**
   * @returns {number}
   */
  getBlockSize() {
    return this.#disks[this.#disks.length - 1].getBlockSize()
  }

  /**
   * @returns {string}
   */
  getPath() {
    return this.#disks[this.#disks.length - 1].getPath()
  }

  /**
   * Disk chains return an array of disk paths.
   *
   * @returns {string[]}
   */
  getPaths() {
    return this.#disks.map(disk => disk.getPath())
  }

  /**
   * @returns {string}
   */
  getUuid() {
    return this.#disks[this.#disks.length - 1].getUuid()
  }

  /**
   * @returns {number} getMaxBlockCount
   */
  getMaxBlockCount() {
    return this.#disks[this.#disks.length - 1].getMaxBlockCount()
  }

  /**
   * Checks if the VHD contains a specific block.
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    for (const disk of this.#disks) {
      if (disk.hasBlock(index)) {
        return true
      }
    }

    return false
  }

  /**
   * Gets the indexes of all blocks in the VHD.
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    const indexes = new Set()
    for (const disk of this.#disks) {
      for (const index of disk.getBlockIndexes()) {
        indexes.add(index)
      }
    }
    return [...indexes]
  }

  /**
   * Returns the parent non inizialized instance
   * @returns {RemoteDisk}
   */
  instantiateParent() {
    return this.#disks[0].instantiateParent()
  }

  /**
   * Writes a full block into this VHD.
   * @param {DiskBlock} diskBlock
   * @return {Promise<number>} blockSize
   */
  async writeBlock(diskBlock) {
    throw new Error(`Can't write blocks into a disk chain`)
  }

  /**
   * Reads a specific block from the VHD.
   * @param {number} index
   * @returns {Promise<DiskBlock>} diskBlock
   */
  async readBlock(index) {
    const disk = this.newestDiskWith(index)
    if (disk === undefined) {
      throw new Error(`Block ${index} not found in chain `)
    }
    return disk.readBlock(index)
  }

  /**
   * Reads a specific block from the child disk to copy/move it to this disk.
   * @param {RemoteDisk} childDisk
   * @param {number} index
   * @param {boolean} isResumingMerge
   * @returns {Promise<number>} blockSize
   */
  async mergeBlock(childDisk, index, isResumingMerge) {
    throw new Error(`Can't merge block into a disk chain`)
  }

  /**
   * @returns {object}
   */
  getMetadata() {
    return this.#disks[this.#disks.length - 1].getMetadata()
  }

  /**
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
   */
  async flushMetadata(childDisk) {
    throw new Error(`Can't flush metadata on a disk chain`)
  }

  /**
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
   */
  mergeMetadata(childDisk) {
    throw new Error(`Can't merge metadata on a disk chain`)
  }

  /**
   * Checks if the VHD is a differencing disk.
   * @returns {boolean}
   */
  isDifferencing() {
    return this.#disks[0].isDifferencing()
  }

  /**
   * Abstract
   * Rename alias/disk
   * @param {string} newPath
   */
  async rename(newPath) {
    throw new Error(`Can't rename a disk chain`)
  }

  /**
   * Deletes all the disks
   * @param {Object} options
   */
  async unlink({ force = false } = {}) {
    for (const disk of this.#disks) {
      await disk.unlink({ force })
    }
  }

  /**
   * Checks the integrity of the disk's external reference (e.g. alias target).
   * @param {Object} [opts]
   * @param {boolean} [opts.remove]
   * @param {Function} [opts.logWarn]
   * @param {Function} [opts.logInfo]
   * @returns {Promise<string | undefined>}
   */
  async clean(opts = {}) {
    throw new Error(`Can't clean a disk chain`)
  }

  /**
   *
   * @returns {RemoteDisk|undefined}
   */
  getRootDisk() {
    return this.#disks[0]
  }

  /**
   * The disk holding the current content of a block: the newest one having it
   * @param {number} index
   * @returns {RemoteDisk|undefined}
   */
  newestDiskWith(index) {
    for (let i = this.#disks.length - 1; i >= 0; i--) {
      if (this.#disks[i].hasBlock(index)) {
        return this.#disks[i]
      }
    }
    return undefined
  }
}
