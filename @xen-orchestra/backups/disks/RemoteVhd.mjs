// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 * @typedef {import('vhd-lib/Vhd/VhdDirectory.js').VhdDirectory} VhdDirectory
 * @typedef {import('vhd-lib/Vhd/VhdFile.js').VhdFile} VhdFile
 */

import { openVhd } from 'vhd-lib'
import { DISK_TYPES } from 'vhd-lib/_constants.js'
import { dirname, join } from 'node:path'
import { RandomAccessDisk } from '@xen-orchestra/disk-transform'
/**
 * Represents a remote VHD (Virtual Hard Disk) that extends RandomAccessDisk.
 */
export class RemoteVhd extends RandomAccessDisk {
  /**
   * @type {string}
   */
  #path

  /**
   * @type {FileAccessor}
   */
  #handler

  /**
   * @type {VhdFile | VhdDirectory | undefined}
   */
  #vhd

  /**
   * @type {boolean | undefined}
   */
  #isDifferencing

  /**
   * @type {() => any}
   */
  #dispose = () => {}

  /**
   * @returns {string}
   */
  get path() {
    return this.#path
  }

  /**
   * @param {Object} params
   * @param {FileAccessor} params.handler
   * @param {string} params.path
   */
  constructor({ handler, path }) {
    super()
    // @todo : ensure this is the full path from the root of the remote
    this.#path = path
    this.#handler = handler
  }

  /**
   * @returns {number}
   */
  getVirtualSize() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getvirtualsize of a RemoteVhd before init`)
    }
    return this.#vhd.footer.currentSize
  }

  /**
   * @returns {number}
   */
  getBlockSize() {
    return 2 * 1024 * 1024
  }

  /**
   * Initializes the VHD.
   * @returns {Promise<void>}
   */
  async init() {
    const { value, dispose } = await openVhd(this.#handler, this.#path)
    this.#vhd = value
    this.#dispose = dispose
    await this.#vhd.readBlockAllocationTable()
    this.#isDifferencing = value.footer.diskType === DISK_TYPES.DIFFERENCING
  }

  /**
   * Closes the VHD.
   * @returns {Promise<void>}
   */
  async close() {
    await this.#dispose()
  }

  /**
   * Checks if the VHD contains a specific block.
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call hasblock of a RemoteVhd before init`)
    }
    return this.#vhd.containsBlock(index)
  }

  /**
   * Gets the indexes of all blocks in the VHD.
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getBlockIndexes of a RemoteVhd before init`)
    }
    const index = []
    for (let blockIndex = 0; blockIndex < this.#vhd.header.maxTableEntries; blockIndex++) {
      if (this.hasBlock(blockIndex)) {
        index.push(blockIndex)
      }
    }
    return index
  }

  /**
   * Reads a specific block from the VHD.
   * @param {number} index
   * @returns {Promise<DiskBlock>}
   */
  async readBlock(index) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call readBlock of a RemoteVhd before init`)
    }
    const { data } = await this.#vhd.readBlock(index)
    return {
      index,
      data,
    }
  }
  /**
   *
   * @returns {Disk}
   */
  instantiateParent() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call openParent of a RemoteVhd before init`)
    }
    const parentPath = this.#vhd.header.parentUnicodeName
    const fullParentPath = join(dirname(this.#path), parentPath)
    if (!parentPath) {
      throw new Error(`Disk ${this.#path} doesn't have parents`)
    }
    const parent = new RemoteVhd({ handler: this.#handler, path: fullParentPath })
    return parent
  }

  /**
   * Checks if the VHD is a differencing disk.
   * @returns {boolean}
   */
  isDifferencing() {
    if (this.#isDifferencing === undefined) {
      throw new Error(`can't call isDifferencing of a RemoteVhd before init`)
    }
    return this.#isDifferencing
  }
}
