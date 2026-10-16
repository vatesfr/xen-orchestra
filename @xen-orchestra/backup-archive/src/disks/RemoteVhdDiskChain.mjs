// @ts-check

/**
 * @typedef {import('./RemoteVhdDisk.mjs').VhdFooter} VhdFooter
 * @typedef {import('./RemoteVhdDisk.mjs').RemoteVhdDisk} RemoteVhdDisk
 */

import { RemoteDiskChain } from './RemoteDiskChain.mjs'

export class RemoteVhdDiskChain extends RemoteDiskChain {
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
   * @param {RemoteVhdDisk[]} params.disks
   */
  constructor({ disks }) {
    super({ disks })
  }

  /**
   * The VHD disks of the chain, oldest first
   * @returns {RemoteVhdDisk[]}
   */
  get disks() {
    return /** @type {RemoteVhdDisk[]} */ (super.disks)
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
   * @returns {Promise<boolean>} canMergeConcurently
   */
  async canMergeConcurently() {
    return this.isDirectory()
  }

  /**
   * Gets a specific block path from the VHD directory disk.
   * @param {number} index
   * @returns {string} blockPath
   */
  getBlockPath(index) {
    const disk = /** @type {RemoteVhdDisk | undefined} */ (this.newestDiskWith(index))
    if (disk === undefined) {
      throw new Error(`Block ${index} not found in chain`)
    }
    return disk.getBlockPath(index)
  }

  /**
   * @returns {VhdFooter}
   */
  getMetadata() {
    return /** @type {VhdFooter} */ (super.getMetadata())
  }

  /**
   * Check if all the disks in the chain are VHD directories.
   * @returns {Promise<boolean>}
   */
  async isDirectory() {
    for (const disk of this.disks) {
      if (!(await disk.isDirectory())) {
        return false
      }
    }
    return true
  }

  /**
   *
   * @returns {RemoteVhdDisk|undefined}
   */
  getRootDisk() {
    return /** @type {RemoteVhdDisk|undefined} */ (super.getRootDisk())
  }
}
