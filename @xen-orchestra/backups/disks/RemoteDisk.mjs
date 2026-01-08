// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 */

import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
export class RemoteDisk extends RandomAccessDisk {
  /**
   * Abstract
   * @param {boolean} force
   * @returns {Promise<void>}
   */
  async init(force = false) {
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
   * @returns {string}
   */
  getUuid() {
    throw new Error(`getUuid must be implemented`)
  }

  /**
   * Abstract
   * @returns {number} getMaxBlockCount
   */
  getMaxBlockCount() {
    throw new Error(`getMaxBlockCount must be implemented`)
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
   * Gets the indexes of all blocks in the VHD.
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    throw new Error(`getBlockIndexes must be implemented`)
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
   * Reads a specific block from the VHD.
   * @param {number} index
   * @returns {Promise<DiskBlock>} diskBlock
   */
  async readBlock(index) {
    throw new Error(`readBlock must be implemented`)
  }

  /**
   * Abstract
   * @returns {Promise<void>}
   */
  async flushMetadata() {
    throw new Error(`flushMetadata must be implemented`)
  }

  /**
   * Abstract
   * @param {RemoteDisk} child
   */
  mergeMetadata(child) {
    throw new Error(`mergeMetadata must be implemented`)
  }

  /**
   * Checks if the VHD is a differencing disk.
   * @returns {boolean}
   */
  isDifferencing() {
    throw new Error(`isDifferencing must be implemented`)
  }

  /**
   * Abstract
   * Deletes disk
   */
  async unlink() {
    throw new Error(`unlink must be implemented`)
  }
}
