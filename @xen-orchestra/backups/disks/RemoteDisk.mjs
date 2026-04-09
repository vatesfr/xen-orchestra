// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 */

import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
export class RemoteDisk extends RandomAccessDisk {
  /**
   * Abstract
   * @param {Object} options
   * @param {boolean} options.force
   * @returns {Promise<void>}
   */
  async init(options = { force: false }) {
    throw new Error(`init must be implemented`)
  }

  /**
   * Abstract
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error(`close must be implemented`)
  }

  /**
   * Abstract
   * @returns {number}
   */
  getVirtualSize() {
    throw new Error(`getVirtualSize must be implemented`)
  }

  /**
   * Abstract
   * @returns {number} size
   */
  getSizeOnDisk() {
    throw new Error(`getSizeOnDisk must be implemented`)
  }

  /**
   * @returns {number}
   */
  getBlockSize() {
    throw new Error(`getBlockSize must be implemented`)
  }

  /**
   * Abstract
   * @returns {string}
   */
  getPath() {
    throw new Error(`getPath must be implemented`)
  }

  /**
   * Abstract
   * @returns {Promise<string>}
   */
  async getResolvedPath() {
    throw new Error(`getResolvedPath must be implemented`)
  }

  /**
   * Either returns an array of disk paths for disk chains or undefined for simple disks.
   *
   * @returns {string[]}
   */
  getPaths() {
    throw new Error(`getPaths must be implemented`)
  }

  /**
   * Abstract
   * @returns {string}
   */
  getUuid() {
    throw new Error(`getUuid must be implemented`)
  }

  /**
   * Abstract
   * @returns {string}
   */
  getParentUuid() {
    throw new Error(`getUuid must be implemented`)
  }

  /**
   * Abstract
   * @returns {string}
   */
  getParentPath() {
    throw new Error(`getUuid must be implemented`)
  }

  /**
   * Abstract
   * @returns {object}
   */
  getMetadata() {
    throw new Error(`getMetadata must be implemented`)
  }

  /**
   * Abstract
   * @returns {Promise<boolean>} canMergeConcurently
   */
  async canMergeConcurently() {
    throw new Error(`canMergeConcurently must be implemented`)
  }

  /**
   * @returns {number} getMaxBlockCount
   */
  getMaxBlockCount() {
    return Math.ceil(this.getVirtualSize() / this.getBlockSize())
  }

  /**
   * Checks if the VHD contains a specific block.
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    throw new Error(`hasBlock must be implemented`)
  }

  /**
   * Abstract
   * Gets the indexes of all blocks in the VHD.
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    throw new Error(`getBlockIndexes must be implemented`)
  }

  /**
   * Abstract
   * Returns the parent non inizialized instance
   * @returns {RemoteDisk}
   */
  instantiateParent() {
    throw new Error(`instantiateParent must be implemented`)
  }

  /**
   * Abstract
   * Writes a full block.
   * @param {DiskBlock} diskBlock
   * @return {Promise<number>} blockSize
   */
  async writeBlock(diskBlock) {
    throw new Error(`writeBlock must be implemented`)
  }

  /**
   * Abstract
   * Reads a specific block from the VHD.
   * @param {number} index
   * @returns {Promise<DiskBlock>} diskBlock
   */
  async readBlock(index) {
    throw new Error(`readBlock must be implemented`)
  }

  /**
   * Abstract
   * Reads a specific block from the child disk to copy/move it to this disk.
   * @param {RemoteDisk} childDisk
   * @param {number} index
   * @param {boolean} isResumingMerge
   * @returns {Promise<number>} blockSize
   */
  async mergeBlock(childDisk, index, isResumingMerge) {
    throw new Error(`mergeBlock must be implemented`)
  }

  /**
   * Abstract
   * Manually set the disk allocated blocks.
   * @param {Array<number>} blockIds
   * @returns {Promise<void>}
   */
  async setAllocatedBlocks(blockIds) {
    throw new Error(`setAllocatedBlocks must be implemented`)
  }

  /**
   * Abstract
   * @param {number} blockCount
   * @returns {Promise<void>}
   */
  async resize(blockCount) {
    throw new Error(`resize must be implemented`)
  }

  /**
   * Abstract
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
   */
  async flushMetadata(childDisk) {
    throw new Error(`flushMetadata must be implemented`)
  }

  /**
   * Abstract
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
   */
  mergeMetadata(childDisk) {
    throw new Error(`mergeMetadata must be implemented`)
  }

  /**
   * Abstract
   * Checks if the VHD is a differencing disk.
   * @returns {boolean}
   */
  isDifferencing() {
    throw new Error(`isDifferencing must be implemented`)
  }

  /**
   * Abstract
   * Rename alias/disk
   * @param {string} newPath
   */
  async rename(newPath) {
    throw new Error(`rename must be implemented`)
  }

  /**
   * Abstract
   * Deletes alias/disk/disks
   * @param {Object} options
   */
  async unlink({ force = false } = {}) {
    throw new Error(`unlink must be implemented`)
  }

  /**
   * Checks the integrity of the disk's external reference (e.g. alias target).
   * No-op for plain disk files; override in alias-aware subclasses.
   * @param {Object} [opts]
   * @param {boolean} [opts.remove]
   * @param {Function} [opts.logWarn]
   * @param {Function} [opts.logInfo]
   * @returns {Promise<void>}
   */
  /**
   * @returns {Promise<string | undefined>}
   */
  async checkAlias(_opts = {}) {
    return undefined
  }

  /**
   * @returns  {Promise<RemoteDisk>}
   */
  async openParent() {
    const parent = await super.openParent()
    if (!(parent instanceof RemoteDisk)) {
      throw new Error('parent of a RemoteDisk must be also a RemoteDisk')
    }
    return parent
  }
}
