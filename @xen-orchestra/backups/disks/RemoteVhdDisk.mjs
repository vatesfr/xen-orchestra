// @ts-check

/**
 * @typedef {import('vhd-lib/Vhd/VhdDirectory.js').VhdDirectory} VhdDirectory
 * @typedef {import('vhd-lib/Vhd/VhdFile.js').VhdFile} VhdFile
 * @typedef {import('vhd-lib/_createFooterHeader.js').VhdFooter} VhdFooter
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 *

 */

import { openVhd, VhdAbstract, VhdDirectory } from 'vhd-lib'
import { RemoteDisk } from './RemoteDisk.mjs'
import { DISK_TYPES } from 'vhd-lib/_constants.js'
import { isVhdAlias, resolveVhdAlias } from 'vhd-lib/aliases.js'
import { stringify } from 'uuid'
import { dirname, join } from 'node:path'
import { RemoteVhdDiskChain } from './RemoteVhdDiskChain.mjs'

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
   * @param {Object} [options]
   * @param {boolean} [options.force=false]
   * @param {boolean} [options.ignoreBlockIndexes=false]
   * @returns {Promise<void>}
   */
  async init(options = {}) {
    if (this.#vhd === undefined) {
      try {
        const { value, dispose } = await openVhd(this.#handler, await resolveVhdAlias(this.#handler, this.#path), {
          checkSecondFooter: !options.force,
        })
        this.#vhd = value

        if ((await this.isDirectory()) && !isVhdAlias(this.#path)) {
          this.#vhd = undefined
          throw Object.assign(new Error("Can't init vhd directory without using alias"), { code: 'NOT_SUPPORTED' })
        }

        this.#dispose = dispose
        if (!options.ignoreBlockIndexes) {
          await this.#vhd.readBlockAllocationTable()
        }
        this.#isDifferencing = value.footer.diskType === DISK_TYPES.DIFFERENCING
      } catch (error) {
        await this.close()
        throw error
      }
    }
  }

  /**
   * Closes the VHD.
   * We replace the dispose function call so the disk can only be closed once.
   *
   * @returns {Promise<void>}
   */
  async close() {
    const dispose = this.#dispose
    this.#dispose = () => Promise.resolve()
    await dispose()
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
   * Returns the disk path in an array.
   *
   * @returns {string[]}
   */
  getPaths() {
    return [this.getPath()]
  }

  /**
   * Simple disks don't have a list of path to return.
   *
   * @returns {string[]}
   */
  getPaths() {
    return [this.getPath()]
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
   * @returns {string}
   */
  getParentUuid() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getParentUid of a RemoteVhdDisk before init`)
    }

    return stringify(this.#vhd.header.parentUuid)
  }

  /**
   * Returns the parent path
   *
   * @returns {string}
   */
  getParentPath() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call getParentPath of a RemoteVhdDisk before init`)
    }

    const parentPath = this.#vhd.header.parentUnicodeName
    return join(dirname(this.#path), parentPath)
  }

  /**
   * @returns {Promise<boolean>} canMergeConcurently
   */
  async canMergeConcurently() {
    return await this.isDirectory()
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
   * Returns the parent non inizialized instance
   * @returns {RemoteDisk}
   */
  instantiateParent() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call instantiateParent of a RemoteVhdDisk before init`)
    }

    const parentPath = this.#vhd.header.parentUnicodeName
    const fullParentPath = join(dirname(this.#path), parentPath)

    if (!parentPath) {
      throw new Error(`disk ${this.#path} doesn't have parents`)
    }

    const parent = new RemoteVhdDisk({ handler: this.#handler, path: fullParentPath })
    return parent
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
   * Reads a specific block from the child disk to copy/move it to this disk.
   * @param {RemoteDisk} childDisk
   * @param {number} index
   * @param {boolean} isResumingMerge
   * @returns {Promise<number>} blockSize
   */
  async mergeBlock(childDisk, index, isResumingMerge) {
    if (
      (childDisk instanceof RemoteVhdDisk || childDisk instanceof RemoteVhdDiskChain) &&
      (await this.isDirectory()) &&
      (await childDisk.isDirectory())
    ) {
      try {
        await this.#handler.rename(childDisk.getBlockPath(index), this.getBlockPath(index))

        this.setAllocatedBlocks([index])
      } catch (error) {
        // @ts-ignore
        if (error.code === 'ENOENT' && isResumingMerge === true) {
          // when resuming, the blocks moved since the last merge state write are
          // not in the child anymore but it should be ok

          // it will throw an error if block is missing in parent
          // won't detect if the block was already in parent and is broken/missing in child

          // since we can't know the initial size, this will create a discrepancy
          // on the size
          const { data } = await this.readBlock(index)
          if (data.length !== this.getBlockSize()) {
            throw error
          } else {
            this.setAllocatedBlocks([index])
          }
        } else {
          throw error
        }
      }

      return this.getBlockSize()
    } else {
      return this.writeBlock(await childDisk.readBlock(index))
    }
  }

  /**
   * Gets a specific block path from the VHD directory.
   * @param {number} index
   * @returns {string} blockPath
   */
  getBlockPath(index) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call readBlock of a RemoteVhdDisk before init`)
    }

    if (this.#vhd instanceof VhdDirectory) {
      return this.#vhd.getFullBlockPath(index)
    } else {
      throw new Error(`can't call getBlockPath of non directory VHD`)
    }
  }

  /**
   * Manually set the disk allocated blocks.
   * @param {Array<number>} blockIds
   * @returns {Promise<void>}
   */
  async setAllocatedBlocks(blockIds) {
    if (this.#vhd instanceof VhdDirectory) {
      this.#vhd.setAllocatedBlocks(blockIds)
    }
  }

  /**
   * Ensure that the disk can handle at least the new block count.
   * @param {number} blockCount
   * @returns {Promise<void>}
   */
  async resize(blockCount) {
    if (this.#vhd === undefined) {
      throw new Error(`can't call resize of a RemoteVhdDisk before init`)
    }

    // Checks that the BAT is at least as big as the provided block count, if not, increases it and shift the blocks position
    await this.#vhd.ensureBatSize(blockCount)
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
   * @param {RemoteDisk} childDisk
   * @returns {Promise<void>}
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
   * Rename alias/disk
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
   * @param {Object} options
   */
  async unlink({ force = false } = {}) {
    if (this.#vhd === undefined) {
      if (force) {
        let resolved = this.#path
        try {
          resolved = await resolveVhdAlias(this.#handler, this.#path)
        } catch (err) {
          // broken vhd directory must be unlinkable
          if (err.code !== 'EISDIR') {
            throw err
          }
          // warn('Deleting directly a VhdDirectory', { this.#path, err })
        }
        try {
          await this.#handler.unlink(resolved)
        } catch (err) {
          if (err.code === 'EISDIR') {
            await this.#handler.rmtree(resolved)
          } else {
            throw err
          }
        }

        // also delete the alias file
        if (this.#path !== resolved) {
          await this.#handler.unlink(this.#path)
        }
      } else {
        throw new Error(`can't call unlink of a RemoteVhdDisk before init`)
      }
    } else {
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
  }

  /**
   * Check if the disk is a VHD directory.
   * @returns {Promise<boolean>}
   */
  async isDirectory() {
    if (this.#vhd === undefined) {
      throw new Error(`can't call isDirectory of a RemoteVhdDisk before init`)
    }

    return this.#vhd instanceof VhdDirectory
  }

  /**
   * Checks the integrity of this disk's alias reference.
   * Only meaningful for alias files (.alias.vhd); no-op for plain VHDs.
   * Returns the resolved target path when the alias is valid, undefined otherwise.
   *
   * @param {Object} [opts]
   * @param {boolean} [opts.remove]
   * @param {Function} [opts.logWarn]
   * @param {Function} [opts.logInfo]
   * @returns {Promise<string | undefined>} resolved target path if valid
   */
  async checkAlias({ remove = false, logWarn = () => {}, logInfo = () => {} } = {}) {
    if (!isVhdAlias(this.#path)) {
      return undefined
    }

    let target
    try {
      target = await resolveVhdAlias(this.#handler, this.#path)
    } catch (err) {
      if (err.code === 'ENOENT') {
        logWarn('missing target of alias', { alias: this.#path })
        if (remove) {
          logInfo('removing alias with missing target', { alias: this.#path })
          await this.#handler.unlink(this.#path)
        }
        return undefined
      }
      if (err.code === 'EISDIR') {
        logWarn('alias is a vhd directory', { alias: this.#path })
        if (remove) {
          logInfo('removing vhd directory named as alias', { alias: this.#path })
          await VhdAbstract.unlink(this.#handler, this.#path)
        }
        return undefined
      }
      logWarn('unhandled error while checking alias', { alias: this.#path, err })
      return undefined
    }

    if (target === '') {
      logWarn('empty target for alias', { alias: this.#path })
      if (remove) {
        logInfo('removing alias with empty target', { alias: this.#path })
        await this.#handler.unlink(this.#path)
      }
      return undefined
    }

    if (!isVhdAlias(target) && !target.endsWith('.vhd')) {
      logWarn('alias references non VHD target', { alias: this.#path, target })
      if (remove) {
        logInfo('removing alias and non VHD target', { alias: this.#path, target })
        await this.#handler.unlink(target)
        await this.#handler.unlink(this.#path)
      }
      return undefined
    }

    try {
      const { dispose } = await openVhd(this.#handler, target)
      try {
        await dispose()
      } catch (_) {
        // errors during dispose should not trigger deletion
      }
      return target
    } catch (error) {
      logWarn('missing or broken alias target', { alias: this.#path, target, error })
      if (remove) {
        try {
          await VhdAbstract.unlink(this.#handler, this.#path)
        } catch (/** @type {any} */ err) {
          if (err.code !== 'ENOENT') {
            logWarn('error deleting broken alias', { alias: this.#path, target, err })
          }
        }
      }
      return undefined
    }
  }
}
