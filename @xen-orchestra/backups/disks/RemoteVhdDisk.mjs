// @ts-check

/**
 * @typedef {import('vhd-lib/Vhd/VhdDirectory.js').VhdDirectory} VhdDirectory
 * @typedef {import('vhd-lib/Vhd/VhdFile.js').VhdFile} VhdFile
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 *
 * @typedef {(Object)} DiskGeometry
 * @property {(number)} cylinders
 * @property {(number)} heads
 * @property {(number)} sectorsPerTrackCylinder
 *
 * @typedef {(Object)} VhdFooter
 * @property {(string)} cookie
 * @property {(number)} features
 * @property {(number)} fileFormatVersion
 * @property {(number)} dataOffset
 * @property {(number)} timestamp
 * @property {(string)} creatorApplication
 * @property {(number)} creatorVersion
 * @property {(number)} creatorHostOs
 * @property {(number)} originalSize
 * @property {(number)} currentSize
 * @property {(DiskGeometry)} diskGeometry
 * @property {(number)} diskType
 * @property {(number)} checksum
 * @property {(Buffer)} uuid
 * @property {(string)} saved
 * @property {(string)} hidden
 * @property {(string)} reserved
 */

import { openVhd, VhdAbstract, VhdDirectory } from 'vhd-lib'
import { RemoteDisk } from './RemoteDisk.mjs'
import { DISK_TYPES } from 'vhd-lib/_constants.js'
import { isVhdAlias, resolveVhdAlias } from 'vhd-lib/aliases.js'
// import { set as setBitmap } from 'vhd-lib/_bitmap.js'
import { stringify } from 'uuid'

export class RemoteVhdDisk extends RemoteDisk {
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
   * @type {number}
   */
  #blockSize = 2 * 1024 * 1024

  /**
   * @type {number}
   */
  #bitmapSize = 512

  /**
   * @type {() => any}
   */
  #dispose = () => {}

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
   * Initializes the VHD
   * @param {Object} options
   * @param {boolean} options.force
   * @returns {Promise<void>}
   */
  async init(options) {
    if (this.#vhd === undefined) {
      if ((await this.isDirectory()) && !isVhdAlias(this.#path)) {
        throw Object.assign(new Error("Can't init vhd directory without using alias"), { code: 'NOT_SUPPORTED' })
      }

      const { value, dispose } = await openVhd(this.#handler, await resolveVhdAlias(this.#handler, this.#path), {
        checkSecondFooter: !options.force,
      })
      this.#vhd = value
      this.#dispose = dispose
      await this.#vhd.readBlockAllocationTable()
      this.#isDifferencing = value.footer.diskType === DISK_TYPES.DIFFERENCING
    }
  }

  /**
   * Closes the VHD.
   * @returns {Promise<void>}
   */
  async close() {
    await this.#dispose()
  }

  /**
   * @returns {number}
   */
  getVirtualSize() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getVirtualSize of a RemoteVhdDisk before init`)
    }
    return this.#vhd.footer.currentSize
  }

  /**
   * @returns {number} size
   */
  getSizeOnDisk() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getVirtualSize of a RemoteVhdDisk before init`)
    }

    return this.#vhd.streamSize()
  }

  /**
   * @returns {number}
   */
  getBlockSize() {
    return this.#blockSize
  }

  /**
   * @returns {string}
   */
  getPath() {
    return this.#path
  }

  /**
   * @returns {string}
   */
  getUuid() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getUid of a RemoteVhdDisk before init`)
    }

    return stringify(this.#vhd.footer.uuid)
  }

  /**
   * @returns {Promise<boolean>} canMergeConcurently
   */
  async canMergeConcurently() {
    return !(await this.isDirectory())
  }

  /**
   * @returns {number} getMaxBlockCount
   */
  getMaxBlockCount() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getMaxBlockCount of a RemoteVhdDisk before init`)
    }

    return this.#vhd.header.maxTableEntries
  }

  /**
   * Checks if the VHD contains a specific block.
   * @param {number} index
   * @returns {boolean}
   */
  hasBlock(index) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call hasblock of a RemoteVhdDisk before init`)
    }
    return this.#vhd.containsBlock(index)
  }

  /**
   * Gets the indexes of all blocks in the VHD.
   * @returns {Array<number>}
   */
  getBlockIndexes() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getBlockIndexes of a RemoteVhdDisk before init`)
    }
    const indexes = []
    for (let blockIndex = 0; blockIndex < this.#vhd.header.maxTableEntries; blockIndex++) {
      if (this.hasBlock(blockIndex)) {
        indexes.push(blockIndex)
      }
    }
    return indexes
  }

  /**
   * Writes a full block into this VHD.
   * @param {DiskBlock} diskBlock
   * @return {Promise<number>} blockSize
   */
  async writeBlock(diskBlock) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call readBlock of a RemoteVhdDisk before init`)
    }
    await this.#vhd.writeEntireBlock({
      id: diskBlock.index,
      buffer: Buffer.concat([Buffer.alloc(this.#bitmapSize, 255), diskBlock.data]),
    })

    return this.getBlockSize()
  }

  /**
   * Reads a specific block from the VHD.
   * @param {number} index
   * @returns {Promise<DiskBlock>} diskBlock
   */
  async readBlock(index) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call readBlock of a RemoteVhdDisk before init`)
    }
    const { data } = await this.#vhd.readBlock(index)
    return {
      index,
      data,
    }
  }

  /**
   * Writes Block Allocation Table
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
   */
  async flushMetadata(childDisk) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call flushMetadata of a RemoteVhdDisk before init`)
    }

    // Not working
    /* if (await this.isDirectory()) {
      const blocks = this.getBlockIndexes().concat(childDisk.getBlockIndexes())

      const blockTable = Buffer.alloc(Math.ceil((blocks.length) / 8), 0) 
      for(const blockId in blocks){
        setBitmap(blockTable, blockId)
      }
      await this.#vhd.writeBlockAllocationTable(blockTable)
    } else {
      await this.#vhd.writeBlockAllocationTable()
    } */

    await this.#vhd.writeBlockAllocationTable()
  }

  /**
   * @returns {VhdFooter}
   */
  getMetadata() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getMetadata of a RemoteVhdDisk before init`)
    }

    return this.#vhd.footer
  }

  /**
   * @param {RemoteVhdDisk} childDisk
   */
  async mergeMetadata(childDisk) {
    const childDiskMetadata = childDisk.getMetadata()

    if (this.#vhd === undefined) {
      throw new Error(`can't call mergeMetadata of a RemoteVhdDisk before init`)
    }

    // @ts-ignore
    this.#vhd.footer.currentSize = childDiskMetadata.currentSize
    // @ts-ignore
    this.#vhd.footer.diskGeometry = { ...childDiskMetadata.diskGeometry }
    // @ts-ignore
    this.#vhd.footer.originalSize = childDiskMetadata.originalSize
    // @ts-ignore
    this.#vhd.footer.timestamp = childDiskMetadata.timestamp
    // @ts-ignore
    this.#vhd.footer.uuid = childDiskMetadata.uuid

    await this.#vhd.writeFooter()
  }

  /**
   * Checks if the VHD is a differencing disk.
   * @returns {boolean}
   */
  isDifferencing() {
    if (this.#isDifferencing === undefined) {
      throw new Error(`can't call isDifferencing of a RemoteVhdDisk before init`)
    }
    return this.#isDifferencing
  }

  /**
   * Delete intermediate disks only
   */
  async unlinkIntermediates() {
    // Nothing
  }

  /**
   * Rename alias/disk/disks
   * @param {string} newPath
   */
  async rename(newPath) {
    if (isVhdAlias(newPath)) {
      const dataPath = await resolveVhdAlias(this.#handler, this.#path)

      await this.#handler.unlink(this.#path)
      await this.#handler.unlink(newPath)

      await VhdAbstract.createAlias(this.#handler, newPath, dataPath)

      this.#path = newPath
    } else {
      try {
        await this.#handler.unlink(newPath)
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'EISDIR') {
          await this.#handler.rmtree(newPath).catch(() => {})
        }
      }

      await this.#handler.rename(this.#path, newPath)

      this.#path = newPath
    }
  }

  /**
   * Deletes disk
   */
  async unlink() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call unlink of a RemoteVhdDisk before init`)
    }

    await this.close()

    if (isVhdAlias(this.#path)) {
      try {
        await this.#handler.unlink(await resolveVhdAlias(this.#handler, this.#path))
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'EISDIR') {
          await this.#handler.rmtree(await resolveVhdAlias(this.#handler, this.#path)).catch(() => {})
        }
      }
    }

    try {
      await this.#handler.unlink(this.#path)
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'EISDIR') {
        await this.#handler.rmtree(this.#path).catch(() => {})
      }
    }
  }

  // Test instance of VhdDirectory
  async isDirectory() {
    if (this.#vhd !== undefined) {
      return this.#vhd instanceof VhdDirectory
    } else {
      try {
        await this.#handler.readFile(await resolveVhdAlias(this.#handler, this.#path))
        return false
      } catch (err) {
        return true
      }
    }
  }
}
