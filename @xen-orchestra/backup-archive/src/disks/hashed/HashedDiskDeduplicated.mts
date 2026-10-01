import type { DiskBlock } from '@xen-orchestra/disk-transform'
import type { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { basename, dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { isInDir, normalize } from '@xen-orchestra/fs/path'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'

import { HashedDisk } from './HashedDisk.mjs'
import { BlockAllocationTable } from './BlockAllocationTable.mjs'
import {
  blockRelPath,
  buildBlockHeader,
  checkVersion,
  dataDirName,
  decodeBlock,
  hashesFileName,
  HbdFileError,
  sha256hex,
  VERSION,
  type DedupType,
  type BlockHash,
  type HashedDiskMetadata,
} from './hbdPaths.mjs'
import { randomUUID } from 'node:crypto'

const { warn } = createLogger('xo:backup-archive:hbd')

/**
 * Content addressed disk: block index -> SHA-256 of the block payload, kept in a
 * flat binary BAT, and one file per unique payload named after its hash.
 */
export class HashedDiskDeduplicated extends HashedDisk {
  #handler: RemoteHandlerAbstract
  #path: string
  #metadata: HashedDiskMetadata | undefined
  #bat: BlockAllocationTable | undefined
  #dataDir: string | undefined
  #blocksDir: string | undefined
  #blockStorePath: string | undefined
  #dirty = false
  #replacedHashes = new Set<BlockHash>()

  constructor({
    handler,
    path,
    blockStorePath,
  }: {
    handler: RemoteHandlerAbstract
    path: string
    blockStorePath?: string
  }) {
    super()
    this.#handler = handler
    // normalized once here so every path this disk hands out or derives has the
    // same shape: callers match them against paths listed from the handler, and
    // an unnormalized one silently fails to compare equal
    this.#path = normalize(path)
    this.#blockStorePath = blockStorePath
  }

  /**
   * New, empty disk on the remote and returns it, opened.
   */
  static async create({
    handler,
    path,
    virtualSize,
    blockSize,
    uuid,
    parentUuid,
    parentPath,
    dedupType = 'PER_DISK',
    blockStorePath,
  }: {
    handler: RemoteHandlerAbstract
    path: string
    virtualSize: number
    blockSize: number
    uuid: string
    parentUuid?: string
    parentPath?: string
    dedupType?: DedupType
    blockStorePath?: string
  }): Promise<HashedDiskDeduplicated> {
    const dataDir = dataDirName(uuid)
    const hashesPath = join(dataDir, hashesFileName(new Date()))

    const metadata = {
      version: VERSION,
      virtualSize,
      blockSize,
      uuid,
      parentUuid,
      parentPath,
      dedupType,
      localBlocksPath: `${dataDir}/blocks/`,
      hashesPath,
    } satisfies HashedDiskMetadata

    if (metadata.dedupType === 'PER_BACKUP_REPOSITORY' && blockStorePath === undefined) {
      throw new Error("Can't init PER_BACKUP_REPOSITORY without blockStorePath")
    }

    const bat = BlockAllocationTable.allocate(Math.ceil(virtualSize / blockSize))

    const disk = new HashedDiskDeduplicated({ handler, path, blockStorePath })
    await handler.outputFile(disk.#resolve(hashesPath), bat.toBuffer(), { flags: 'wx' })
    await handler.outputFile(path, JSON.stringify(metadata), { flags: 'wx' })

    await disk.init()
    return disk
  }

  get #diskDir(): string {
    return dirname(this.#path)
  }

  /**
   * Resolves a path stored in the metadata, which is relative to the hbd file.
   */
  #resolve(relativePath: string, container: string = this.#diskDir): string {
    const resolved = normalize(join(this.#diskDir, relativePath))
    if (!isInDir(resolved, container)) {
      throw new Error(`path ${relativePath} escapes ${container}`)
    }
    return resolved
  }

  get #loadedMetadata(): HashedDiskMetadata {
    if (this.#metadata === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return this.#metadata
  }

  get #loadedBat(): BlockAllocationTable {
    if (this.#bat === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return this.#bat
  }

  /**
   * holds the blocks and every hashes file, current and orphaned
   */
  get #loadedDataDir(): string {
    if (this.#dataDir === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return this.#dataDir
  }

  #blockPath(hash: BlockHash): string {
    if (this.#blocksDir === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return join(this.#blocksDir, blockRelPath(hash))
  }

  /**
   * @param hash always hex
   * @returns complete path in store
   * Rooted at the remote root, not the disk dir, so no #resolve: the root comes from
   * the caller and the hash is always hex
   */
  #storePath(hash: BlockHash): string {
    if (this.#blockStorePath === undefined) {
      throw new Error(`disk ${this.#path} is PER_BACKUP_REPOSITORY but no blockStorePath was given`)
    }
    return join(this.#blockStorePath, blockRelPath(hash), '0')
  }

  // ---------------------------------------------------------------- lifecycle

  /**
   * @param options.force to force read a hashes file whose size disagrees with
   * virtualSize / blockSize, instead of refusing to open the disk (useful for first tests)
   */
  async init(options: { force?: boolean } = {}): Promise<void> {
    if (this.#metadata !== undefined) {
      return
    }

    let metadata: HashedDiskMetadata
    let dataDir: string
    let hashesPath: string
    let blocksDir: string
    try {
      metadata = JSON.parse((await this.#handler.readFile(this.#path)).toString())
      checkVersion(metadata.version)

      const { blockSize, virtualSize } = metadata
      if (!Number.isInteger(blockSize) || blockSize <= 0) {
        throw new Error(`invalid blockSize ${blockSize}`)
      }
      if (!Number.isInteger(virtualSize) || virtualSize < 0) {
        throw new Error(`invalid virtualSize ${virtualSize}`)
      }

      // named after the uuid at creation, not the current one: a merge gives
      // the disk its child's uuid but leaves the directory where it is
      dataDir = this.#resolve(dataDirName(basename(dirname(metadata.localBlocksPath))))
      hashesPath = this.#resolve(metadata.hashesPath, dataDir)
      blocksDir = this.#resolve(metadata.localBlocksPath, dataDir)
    } catch (error: unknown) {
      throw new HbdFileError((error as NodeJS.ErrnoException).message, this.#path, error)
    }

    this.#metadata = metadata
    this.#dataDir = dataDir
    this.#blocksDir = blocksDir

    try {
      this.#bat = BlockAllocationTable.fromBuffer(
        await this.#handler.readFile(hashesPath),
        this.getMaxBlockCount(),
        options.force
      )
    } catch (error: unknown) {
      this.#metadata = undefined
      this.#dataDir = undefined
      this.#blocksDir = undefined
      throw new HbdFileError((error as NodeJS.ErrnoException).message, hashesPath, error)
    }
  }

  async close(): Promise<void> {
    if (this.#dirty) {
      await this.flushMetadata()
    }
  }

  // ---------------------------------------------------------------- getters

  getVirtualSize(): number {
    return this.#loadedMetadata.virtualSize
  }

  getBlockSize(): number {
    return this.#loadedMetadata.blockSize
  }

  /**
   * Virtual usage: what the guest sees as allocated, not the deduplicated footprint
   */
  getSizeOnDisk(): number {
    return this.#loadedBat.countAllocated() * this.getBlockSize()
  }

  getPath(): string {
    return this.#path
  }

  getPaths(): Array<string> {
    return [this.#path]
  }

  getUuid(): string {
    return this.#loadedMetadata.uuid
  }

  getParentUuid(): string {
    const { parentUuid } = this.#loadedMetadata
    if (parentUuid === undefined) {
      throw new Error(`disk ${this.#path} has no parent`)
    }
    return parentUuid
  }

  getParentPath(): string {
    const { parentPath } = this.#loadedMetadata
    if (parentPath === undefined) {
      throw new Error(`disk ${this.#path} has no parent`)
    }
    return this.#resolve(parentPath)
  }

  getMetadata(): HashedDiskMetadata {
    return { ...this.#loadedMetadata }
  }

  isDifferencing(): boolean {
    return this.#loadedMetadata.parentUuid !== undefined
  }

  /** block files are independent, nothing is shared inside a single disk */
  async canMergeConcurently(): Promise<boolean> {
    return true
  }

  hasBlock(index: number): boolean {
    return !this.#loadedBat.isEmpty(index)
  }

  getBlockIndexes(): Array<number> {
    return this.#loadedBat.indexes()
  }

  getBlockHashAt(index: number): BlockHash {
    return this.#loadedBat.get(index)
  }

  async #link(existingPath: string, newPath: string): Promise<void> {
    try {
      await this.#handler.link(existingPath, newPath)
    } catch (error: unknown) {
      // EEXIST => block already referenced by disk
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * Writes the block file unless it is already there. 'wx' for concurrent cases
   */
  async #storeBlock(hash: BlockHash, data: Buffer): Promise<void> {
    try {
      await this.#handler.outputFile(this.#blockPath(hash), Buffer.concat([buildBlockHeader(hash), data]), {
        flags: 'wx',
      })
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
      // already stored, by another index of this disk or by a previous run
    }
  }

  async #addBlockReference(hash: BlockHash, data: Buffer): Promise<void> {
    if (this.#loadedMetadata.dedupType === 'PER_DISK') {
      return this.#storeBlock(hash, data)
    }

    const storePath = this.#storePath(hash)
    const blockPath = this.#blockPath(hash)
    try {
      await this.#link(storePath, blockPath)
      return
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }

    // link did not work, we need a new block
    const tmp = join(this.#blocksDir!, '.tmp', randomUUID())
    await this.#handler.outputFile(tmp, Buffer.concat([buildBlockHeader(hash), data]), { flags: 'wx' })
    try {
      await this.#link(tmp, storePath)
    } finally {
      await this.#handler.unlink(tmp, { checksum: false })
    }

    await this.#link(storePath, blockPath)
  }

  async readBlock(index: number): Promise<DiskBlock> {
    const bat = this.#loadedBat
    if (bat.isEmpty(index)) {
      throw new Error(`no block at index ${index} of ${this.#path}`)
    }
    const hash = bat.get(index)

    // reads the whole file: that is exactly header + payload, and unlike a
    // positional read it also works on an encrypted remote
    const buffer = await this.#handler.readFile(this.#blockPath(hash))
    const { payload } = decodeBlock(buffer, this.getBlockSize(), hash)

    return { index, data: payload }
  }

  /**
   * Purely additive: the previous hash at this index keeps its block file until
   * flushMetadata notices no BAT entry references it any more.
   * TODO: phase 3
   */
  async writeBlock({ index, data }: DiskBlock): Promise<number> {
    const blockSize = this.getBlockSize()
    if (data.length !== blockSize) {
      throw new Error(`expected a ${blockSize} bytes block, got ${data.length}`)
    }

    const bat = this.#loadedBat
    const hash = sha256hex(data)

    // unchanged content at this index, nothing to do at all
    if (!bat.isEmpty(index) && bat.get(index) === hash) {
      return blockSize
    }

    const replaced = bat.isEmpty(index) ? undefined : bat.get(index)

    await this.#addBlockReference(hash, data)
    bat.set(index, hash)

    if (replaced !== undefined) {
      this.#replacedHashes.add(replaced)
    }
    this.#dirty = true

    return blockSize
  }

  /**
   * No-op: the BAT is built exclusively by writeBlock, which knows the hash.
   * Declaring an index without content is meaningless in a content addressed
   * format.
   */
  async setAllocatedBlocks(): Promise<void> {}

  // ---------------------------------------------------------------- metadata

  /**
   * best effort: the new BAT is already safe, a failure only leaks
   */
  async #removeOrphans(): Promise<void> {
    if (this.#replacedHashes.size === 0) {
      return
    }
    try {
      const candidates = new Set(this.#replacedHashes)

      // a replaced hash can still be referenced at another index
      for (const index of this.#loadedBat.indexes()) {
        candidates.delete(this.#loadedBat.get(index))
      }

      for (const hash of candidates) {
        await this.#removeBlockReference(hash)
      }
      this.#replacedHashes.clear()
    } catch (error) {
      warn('failed to remove orphaned blocks', { path: this.#path, error })
    }
  }

  /**
   * Writes the BAT to a new timestamped file, then points the hbd file at it.
   * The previous hashes file is never overwritten, so a crash between the two
   * writes leaves the disk readable through the old one. It is removed once
   * the hbd points at the new one.
   */
  async flushMetadata(childDisk?: unknown): Promise<void> {
    const metadata = this.#loadedMetadata
    const dataDir = dirname(metadata.hashesPath)

    // Every flush writes a new file: the one the hbd still points at must stay
    // intact, so a crash before the hbd is updated leaves the disk readable.
    // The name has a random part, a collision is only retried for safety.
    const hashesPath: string = await pRetry(
      async () => {
        const path = join(dataDir, hashesFileName(new Date()))
        await this.#handler.outputFile(this.#resolve(path), this.#loadedBat.toBuffer(), { flags: 'wx' })
        return path
      },
      { delay: 0, tries: 3, when: { code: 'EEXIST' } }
    )

    const newMetadata = { ...metadata, hashesPath }
    await this.#handler.outputStream(this.#path, Readable.from(JSON.stringify(newMetadata)), { checksum: false })
    this.#metadata = newMetadata

    await this.#removeOrphans()

    this.#dirty = false

    // the hbd no longer points at it. Best effort: the data dir is claimed as
    // a whole, so a file left by a failure or a crash is only removed by check()
    try {
      await this.#handler.unlink(this.#resolve(metadata.hashesPath), { checksum: false })
    } catch (error) {
      warn('failed to remove the previous hashes file', { path: this.#path, hashesPath: metadata.hashesPath, error })
    }

    if (childDisk instanceof HashedDiskDeduplicated) {
      await this.#releaseChildReferences(childDisk)
    }
  }

  /**
   * End of a merge, once the parent hbd holds the child's hashes: a resumed
   * merge then takes the same hash fast path and never reads the child again.
   * Best effort: a link left behind is released by the child's unlink().
   */
  async #releaseChildReferences(childDisk: HashedDiskDeduplicated): Promise<void> {
    const childBat = childDisk.#loadedBat
    const parentBlockCount = this.getMaxBlockCount()
    for (const index of childBat.indexes()) {
      const hash = childBat.get(index)
      // the parent holding the same hash keeps the inode alive, so the store
      // file cannot be the last copy
      const parentHoldsIt = index < parentBlockCount && this.#loadedBat.get(index) === hash
      try {
        await childDisk.#removeBlockReference(hash, { skipStoreCheck: parentHoldsIt })
      } catch (error) {
        warn('failed to release a child block', { path: childDisk.getPath(), index, error })
      }
    }
  }

  /**
   * What this disk claims inside `dir`: the hbd file, and its data directory as
   * a whole. Used by lineage and remote cleanup to tell owned files from orphans.
   */
  async listAssociatedFiles(dir: string): Promise<Array<string>> {
    const files = [this.#path, this.#loadedDataDir]

    return files.filter(p => isInDir(p, dir))
  }

  async unlink(): Promise<void> {
    if (this.#loadedMetadata.dedupType === 'PER_BACKUP_REPOSITORY') {
      for (const index of this.#loadedBat.indexes()) {
        try {
          await this.#removeBlockReference(this.#loadedBat.get(index))
        } catch (error) {
          warn('failed to release block', { path: this.#path, index, error })
        }
      }
    }
    await this.#handler.unlink(this.#path)
    await this.#handler.rmtree(this.#loadedDataDir)

    this.#replacedHashes.clear()
    this.#metadata = undefined
    this.#bat = undefined
    this.#dataDir = undefined
    this.#blocksDir = undefined
    this.#dirty = false
  }

  /**
   * @param options.skipStoreCheck the caller knows another disk still links
   * this block (a parent holding the same hash during a merge), so the store
   * file cannot be the last copy: saves one stat per block
   */
  async #removeBlockReference(hash: BlockHash, { skipStoreCheck = false } = {}): Promise<void> {
    const blockPath = this.#blockPath(hash)
    if (this.#loadedMetadata.dedupType === 'PER_DISK' || skipStoreCheck) {
      return this.#handler.unlink(blockPath, { checksum: false })
    } else {
      let nlink: number
      try {
        nlink = await this.#handler.getLinkCount(blockPath)
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return
        }
        throw error
      }
      await this.#handler.unlink(blockPath, { checksum: false })
      if (nlink === 2) {
        await this.#handler.unlink(this.#storePath(hash), { checksum: false })
      }
    }
  }
}
