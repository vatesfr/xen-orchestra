// @ts-check

/**
 * @typedef {import('./RemoteVhdDisk.mjs').VhdFooter} VhdFooter
 * @typedef {import('./RemoteVhdDisk.mjs').RemoteVhdDisk} RemoteVhdDisk
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 */

import { RemoteDisk } from './RemoteDisk.mjs'

export class RemoteVhdDiskChain extends RemoteDisk {
  /**
   * @type {RemoteVhdDisk[]}
   */
  #disks

  /**
   * @type {number}
   */
  #blockSize = 2 * 1024 * 1024

  /**
   * @type {number}
   */
  #headerSize = 1024

  /**
   * @type {number}
   */
  #footerSize = 512

  /**
   * @type {number}
   */
  #bitmapSize = 512

  /**
   * @param {Object} params
   * @param {FileAccessor} params.handler
   * @param {RemoteVhdDisk[]} params.disks
   */
  constructor({ disks }) {
    super()
    this.#disks = disks
  }

  /**
   * Initializes the VHD chain
   * @param {Object} options
   * @param {boolean} options.force
   * @returns {Promise<void>}
   */
  async init(options) {
    await Promise.all(this.#disks.map(disk => disk.init(options)))

    // Check that all disks are differencing except first one and that all childs have the correct parent uuid.
    for (const disk of this.#disks.slice(1)) {
      if (!disk.isDifferencing()) {
        throw Object.assign(new Error("Can't init vhd directory with non differencing child disks"), {
          code: 'NOT_SUPPORTED',
        })
      }
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
   * @returns {number} size
   */
  getSizeOnDisk() {
    const batEntrySize = 4
    const sectorSize = 512
    const batSize = Math.ceil((this.getMaxBlockCount() * batEntrySize) / sectorSize) * sectorSize

    return (
      this.#footerSize +
      this.#headerSize +
      batSize +
      this.getBlockIndexes().length * (this.#blockSize + this.#bitmapSize) +
      this.#footerSize
    )
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
   * @returns {string}
   */
  getUuid() {
    return this.#disks[this.#disks.length - 1].getUuid()
  }

  /**
   * @returns {Promise<boolean>} canMergeConcurently
   */
  async canMergeConcurently() {
    for (const disk of this.#disks) {
      if (!(await disk.isDirectory())) {
        return true
      }
    }
    return false
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
    for (const disk of this.#disks) {
      if (disk.hasBlock(index)) {
        return disk.readBlock(index)
      }
    }
    throw new Error(`Block ${index} not found in chain `)
  }

  /**
   * @returns {VhdFooter}
   */
  getMetadata() {
    return this.#disks[this.#disks.length - 1].getMetadata()
  }

  /**
   * @param {RemoteVhdDisk} childDisk
   * @returns {Promise<void>}
   */
  async flushMetadata(childDisk) {
    throw new Error(`Can't flush metadata on a disk chain`)
  }

  /**
   * @param {RemoteVhdDisk} childDisk
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
   * Delete intermediate disks only
   */
  async unlinkIntermediates() {
    for (const disk of this.#disks.slice(0, -1)) {
      await disk.unlink()
    }
  }

  /**
   * Rename the entire chain: only the last disk becomes the merge target
   * @param {string} newPath
   */
  async rename(newPath) {
    if (this.#disks.length === 0) return

    await this.#disks[this.#disks.length - 1].rename(newPath)
  }

  /**
   * Deletes all the disks
   */
  async unlink() {
    for (const disk of this.#disks) {
      await disk.unlink()
    }
  }
}
