// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 */

import { RemoteDisk } from './RemoteDisk.mjs'

const BLOCK_SIZE = 2 * 1024 * 1024 // 2 MiB

/**
 * Raw flat-file disk implementation for dedup-capable storage.
 *
 * Layout (both files at the same level in the VDI directory):
 *   <uuid>.raw       – JSON metadata: { uuid, virtualSize, blockSize }
 *   <uuid>.raw.data  – binary data file: ceil(virtualSize / blockSize) * blockSize bytes
 *                      block N starts at offset N * blockSize
 *
 * There is no BAT in V1: hasBlock() always returns true.
 * Non-allocated blocks are filled with zeros; dedup storage deduplicates them.
 * Writes are expected sequentially (blocks 0…N-1 in order) for optimal streaming.
 * The data file is pre-allocated on create() as a sparse file; all block-level reads
 * are therefore safe (sparse holes read back as zeros).
 */
export class RemoteRawDisk extends RemoteDisk {
  /** @type {string} */
  #path

  /** @type {string} */
  #dataPath

  /** @type {RemoteHandlerAbstract} */
  #handler

  /** @type {string | undefined} */
  #uuid

  /** @type {number | undefined} */
  #virtualSize

  /**
   * @param {Object} params
   * @param {RemoteHandlerAbstract} params.handler
   * @param {string} params.path  path to the <uuid>.raw JSON file
   */
  constructor({ handler, path }) {
    super()
    this.#path = path
    this.#dataPath = path + '.data'
    this.#handler = handler
  }

  // ---------------------------------------------------------------------------
  // Static factory
  // ---------------------------------------------------------------------------

  /**
   * Creates a new raw disk on the remote storage.
   * Writes the JSON metadata and pre-allocates the data file as a sparse file.
   *
   * @param {Object} params
   * @param {RemoteHandlerAbstract} params.handler
   * @param {string} params.path        path for the <uuid>.raw JSON file
   * @param {number} params.virtualSize exact virtual disk size in bytes
   * @param {string} params.uuid
   * @returns {Promise<RemoteRawDisk>}
   */
  static async create({ handler, path, virtualSize, uuid }) {
    const blockCount = Math.ceil(virtualSize / BLOCK_SIZE)
    const fileSize = blockCount * BLOCK_SIZE

    const metadata = JSON.stringify({ uuid, virtualSize, blockSize: BLOCK_SIZE })
    await handler.outputFile(path, metadata, { flags: 'wx' })

    // Create the data file then extend it to fileSize bytes via a sparse write.
    // We open a FileDescriptor to satisfy handler.write()'s FileArg type.
    // On local/NFS/ZFS this produces a sparse file; the hole reads back as zeros.
    const dataPath = path + '.data'
    await handler.outputFile(dataPath, Buffer.alloc(0), { flags: 'wx' })
    const fd = await handler.openFile(dataPath, 'r+')
    try {
      await handler.write(/** @type {any} */ (fd), Buffer.alloc(1, 0), fileSize - 1)
    } finally {
      await handler.closeFile(fd)
    }

    const disk = new RemoteRawDisk({ handler, path })
    disk.#uuid = uuid
    disk.#virtualSize = virtualSize
    return disk
  }

  /**
   * @param {Object} [options]
   * @param {boolean} [options.force]
   * @returns {Promise<void>}
   */
  async init(_options = {}) {
    const raw = await this.#handler.readFile(this.#path)
    const meta = JSON.parse(raw)
    this.#uuid = meta.uuid
    this.#virtualSize = meta.virtualSize
  }

  async close() {
    // No persistent file handles to release.
  }

  getVirtualSize() {
    if (this.#virtualSize === undefined) throw new Error('RemoteRawDisk not initialized')
    return this.#virtualSize
  }

  getSizeOnDisk() {
    return this.getMaxBlockCount() * BLOCK_SIZE
  }

  getBlockSize() {
    return BLOCK_SIZE
  }

  getPath() {
    return this.#path
  }

  getPaths() {
    return [this.#path, this.#dataPath]
  }

  getUuid() {
    if (this.#uuid === undefined) throw new Error('RemoteRawDisk not initialized')
    return this.#uuid
  }

  /** @returns {string} */
  getParentUuid() {
    throw new Error('RemoteRawDisk has no parent')
  }

  /** @returns {string} */
  getParentPath() {
    throw new Error('RemoteRawDisk has no parent')
  }

  getMetadata() {
    return {
      uuid: this.getUuid(),
      virtualSize: this.getVirtualSize(),
      blockSize: BLOCK_SIZE,
    }
  }

  isDifferencing() {
    return false
  }

  /** V1: all blocks are considered present. */
  hasBlock(_index) {
    return true
  }

  getBlockIndexes() {
    const count = this.getMaxBlockCount()
    return Array.from({ length: count }, (_, i) => i)
  }

  /**
   * @param {DiskBlock} diskBlock
   * @returns {Promise<number>} blockSize
   */
  async writeBlock(diskBlock) {
    const offset = diskBlock.index * BLOCK_SIZE
    const fd = await this.#handler.openFile(this.#dataPath, 'r+')
    try {
      await this.#handler.write(/** @type {any} */ (fd), diskBlock.data, offset)
    } finally {
      await this.#handler.closeFile(fd)
    }
    return BLOCK_SIZE
  }

  /**
   * @param {number} index
   * @returns {Promise<DiskBlock>}
   */
  async readBlock(index) {
    const offset = index * BLOCK_SIZE
    const data = Buffer.alloc(BLOCK_SIZE, 0)
    // handler.read() accepts FileDescriptor which includes strings
    await this.#handler.read(this.#dataPath, data, offset)
    return { index, data }
  }

  // ---------------------------------------------------------------------------
  // Operations not applicable to raw / always-full disks
  // ---------------------------------------------------------------------------

  /** @returns {RemoteDisk} */
  instantiateParent() {
    throw new Error('RemoteRawDisk has no parent')
  }

  /**
   * @param {RemoteDisk} _childDisk
   * @param {number} _index
   * @param {boolean} _isResumingMerge
   * @returns {Promise<number>}
   */
  async mergeBlock(_childDisk, _index, _isResumingMerge) {
    throw new Error('RemoteRawDisk does not support merge')
  }

  async canMergeConcurently() {
    return false
  }

  /** No-op: BAT not used in V1. */
  async setAllocatedBlocks(_blockIds) {}

  /** No-op: no BAT to flush. */
  async flushMetadata(_childDisk) {}

  /**
   * @param {RemoteDisk} _childDisk
   * @returns {Promise<void>}
   */
  async mergeMetadata(_childDisk) {
    throw new Error('RemoteRawDisk does not support merge')
  }

  /**
   * Extends the data file and updates virtualSize in the JSON metadata.
   * @param {number} newBlockCount
   */
  async resize(newBlockCount) {
    const newVirtualSize = newBlockCount * BLOCK_SIZE
    const fd = await this.#handler.openFile(this.#dataPath, 'r+')
    try {
      await this.#handler.write(/** @type {any} */ (fd), Buffer.alloc(1, 0), newVirtualSize - 1)
    } finally {
      await this.#handler.closeFile(fd)
    }
    const metadata = JSON.stringify({ uuid: this.getUuid(), virtualSize: newVirtualSize, blockSize: BLOCK_SIZE })
    await this.#handler.outputFile(this.#path, metadata, { flags: 'w' })
    this.#virtualSize = newVirtualSize
  }

  /**
   * @param {string} newPath  new path for the <uuid>.raw JSON file
   */
  async rename(newPath) {
    await this.#handler.rename(this.#dataPath, newPath + '.data')
    await this.#handler.rename(this.#path, newPath)
    this.#path = newPath
    this.#dataPath = newPath + '.data'
  }

  /**
   * @param {Object} [options]
   * @param {boolean} [options.force]
   */
  async unlink({ force = false } = {}) {
    const del = p =>
      this.#handler.unlink(p).catch(err => {
        if (force && err?.code === 'ENOENT') return
        throw err
      })
    await del(this.#dataPath)
    await del(this.#path)
  }

  /**
   * Verifies both files are accessible.
   * @param {Object} [opts]
   * @param {Function} [opts.logWarn]
   * @returns {Promise<string | undefined>}
   */
  async clean({ logWarn } = {}) {
    try {
      await this.#handler.readFile(this.#path)
      await this.#handler.getSize(this.#dataPath)
      return this.#path
    } catch (error) {
      logWarn?.('RemoteRawDisk integrity check failed', { path: this.#path, error })
      return undefined
    }
  }

  /**
   * Returns both files that belong to this disk.
   * Both are siblings in the same vdiDir, so #cleanOrphanDataFiles skips them (by design in V1).
   * @param {string} _dir
   * @returns {Promise<string[]>}
   */
  async listAssociatedFiles(_dir) {
    return [this.#path, this.#dataPath]
  }
}
