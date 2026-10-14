import type { DiskBlock } from '@xen-orchestra/disk-transform'
import { type RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { basename, dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { isInDir, normalize } from '@xen-orchestra/fs/path'
import pRetry from 'promise-toolbox/retry'
import { createLogger } from '@xen-orchestra/log'

import { HashedDisk } from './HashedDisk.mjs'
import { BlockAllocationTable } from './BlockAllocationTable.mjs'
import {
  blockRelPath,
  checkVersion,
  dataDirName,
  decodeBlock,
  encodeBlock,
  hashesFileName,
  HbdFileError,
  sha256hex,
  VERSION,
  type DedupType,
  type BlockHash,
  type HashedDiskMetadata,
  HashEntrySet,
  HBD_HEADER_SIZE,
  parseBlockHeader,
  CODEC_RAW,
  setVerifiedAt,
  HBD_MAGIC,
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
  #oldBlockCount = 0
  #scrubEnabled: boolean
  #scrubMaxAgeMs: number
  #blocksScrubbed = 0
  #blocksCorrupted = 0

  constructor({
    handler,
    path,
    blockStorePath,
    scrubEnabled = false,
    scrubMaxAgeMs = 30 * 86400e3, // 30 days
  }: {
    handler: RemoteHandlerAbstract
    path: string
    blockStorePath?: string
    scrubEnabled?: boolean
    scrubMaxAgeMs?: number
  }) {
    super()
    this.#handler = handler
    // normalized once here so every path this disk hands out or derives has the
    // same shape: callers match them against paths listed from the handler, and
    // an unnormalized one silently fails to compare equal
    this.#path = normalize(path)
    this.#blockStorePath = blockStorePath

    this.#scrubEnabled = scrubEnabled && !this.#handler.isEncrypted
    if (scrubEnabled && !this.#scrubEnabled) {
      warn("Scrubbing can't be enabled on a encrypted remote", { path: this.#path })
    }
    this.#scrubMaxAgeMs = scrubMaxAgeMs
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
    scrubEnabled,
    scrubMaxAgeMs,
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
    scrubEnabled?: boolean
    scrubMaxAgeMs?: number
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

    const disk = new HashedDiskDeduplicated({ handler, path, blockStorePath, scrubEnabled, scrubMaxAgeMs })
    await handler.outputFile(disk.#resolve(hashesPath), bat.toBuffer(), { flags: 'wx' })
    await handler.outputFile(path, JSON.stringify(metadata), { flags: 'wx' })

    await disk.init()
    return disk
  }

  // ---------------------------------------------------------------- getters

  get #diskDir(): string {
    return dirname(this.#path)
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
    return this.#loadedBat.hashAt(index)
  }

  /** store blocks fully reread and checked since this disk was opened */
  getBlocksScrubbed(): number {
    return this.#blocksScrubbed
  }

  /** store blocks found corrupted, and rewritten, since this disk was opened */
  getBlocksCorrupted(): number {
    return this.#blocksCorrupted
  }

  // ---------------------------------------------------------------- public

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
      this.#oldBlockCount = this.getMaxBlockCount()
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

  async rename(newPath: string): Promise<void> {
    newPath = normalize(newPath)
    if (dirname(newPath) !== this.#diskDir) {
      throw new Error(`can't move ${this.#path} out of its directory, to ${newPath}`)
    }
    await this.#handler.rename(this.#path, newPath)
    this.#path = newPath
  }

  async readBlock(index: number): Promise<DiskBlock> {
    const bat = this.#loadedBat
    if (bat.isEmpty(index)) {
      throw new Error(`no block at index ${index} of ${this.#path}`)
    }
    const hash = bat.hashAt(index)

    // reads the whole file: that is exactly header + payload, and unlike a
    // positional read it also works on an encrypted remote
    const buffer = await this.#handler.readFile(this.#blockPath(hash))
    const { payload } = decodeBlock(buffer, hash)

    return { index, data: payload }
  }

  /**
   * Purely additive: the previous hash at this index keeps its block file until
   * flushMetadata notices no BAT entry references it any more.
   */
  async writeBlock({ index, data }: DiskBlock): Promise<number> {
    const blockSize = this.getBlockSize()
    if (data.length !== blockSize) {
      throw new Error(`expected a ${blockSize} bytes block, got ${data.length}`)
    }

    const bat = this.#loadedBat
    const hash = sha256hex(data)

    // unchanged content at this index, nothing to do at all
    if (!bat.isEmpty(index) && bat.hashAt(index) === hash) {
      return blockSize
    }

    await this.#addBlockReference(hash, data)
    this.#setHash(index, hash)

    return blockSize
  }

  async mergeBlock(childDisk: HashedDiskDeduplicated, index: number, isResumingMerge: boolean): Promise<number> {
    if (this.#loadedBat.sameAt(index, childDisk.#loadedBat, index)) {
      return 0
    }

    const childHash = childDisk.getBlockHashAt(index)

    await this.#link(childDisk.#blockPath(childHash), this.#blockPath(childHash))

    this.#setHash(index, childHash)
    return this.getBlockSize()
  }

  /**
   * No-op: the BAT is built exclusively by writeBlock, which knows the hash.
   * Declaring an index without content is meaningless in a content addressed
   * format.
   */
  async setAllocatedBlocks(): Promise<void> {}

  async resize(blockCount: number): Promise<void> {
    if (blockCount === this.getMaxBlockCount()) {
      return
    }
    const bat = this.#loadedBat
    bat.resize(blockCount)
    this.#metadata = { ...this.#loadedMetadata, virtualSize: blockCount * this.getBlockSize() }
    this.#dirty = true
  }

  /**
   * Writes the BAT to a new timestamped file, then points the hbd file at it.
   * The previous hashes file is never overwritten, so a crash between the two
   * writes leaves the disk readable through the old one. It is removed once
   * the hbd points at the new one.
   */
  async flushMetadata(childDisk?: unknown): Promise<void> {
    if (childDisk instanceof HashedDiskDeduplicated) {
      await this.#mergeWithChild(childDisk)
    }
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

    await this.#removeOrphans(this.#resolve(metadata.hashesPath))
    this.#oldBlockCount = this.getMaxBlockCount()

    this.#dirty = false

    // the hbd no longer points at it. Best effort: the data dir is claimed as
    // a whole, so a file left by a failure or a crash is only removed by check()
    try {
      await this.#handler.unlink(this.#resolve(metadata.hashesPath), { checksum: false })
    } catch (error) {
      warn('failed to remove the previous hashes file', { path: this.#path, hashesPath: metadata.hashesPath, error })
    }
  }

  async #mergeWithChild(childDisk: HashedDiskDeduplicated): Promise<void> {
    if (childDisk.getBlockSize() !== this.getBlockSize()) {
      throw new Error(`can't merge a ${childDisk.getBlockSize()} bytes block disk into a ${this.getBlockSize()} one`)
    }
    const childBat = childDisk.#loadedBat
    for (const index of childBat.indexes()) {
      if (!this.#loadedBat.sameAt(index, childBat, index)) {
        await this.mergeBlock(childDisk, index, true)
      }
    }
  }

  async checkAndClean(): Promise<void> {
    const current = basename(this.#loadedMetadata.hashesPath)
    for (const filename of await this.#handler.list(this.#loadedDataDir)) {
      if (filename !== current && /^hashes\..+\.hash$/.test(filename)) {
        await this.#handler
          .unlink(join(this.#loadedDataDir, filename), { checksum: false })
          .catch(error => warn('failed to clean a leftover file', { path: this.#path, filename, error }))
      }
    }
    if (this.#loadedMetadata.dedupType === 'PER_BACKUP_REPOSITORY') {
      const tmpDir = this.#tmpDir
      for (const filename of await this.#handler.list(tmpDir, { ignoreMissing: true })) {
        await this.#handler
          .unlink(join(tmpDir, filename), { checksum: false })
          .catch(error => warn('failed to clean a leftover file', { path: this.#path, filename, error }))
      }
    }
  }

  async mergeMetadata(childDisk) {
    if (!(childDisk instanceof HashedDiskDeduplicated)) {
      throw new Error(`can't merge different disk types`)
    }
    const { uuid, virtualSize } = childDisk.getMetadata()
    if (Math.ceil(virtualSize / this.getBlockSize()) !== this.getMaxBlockCount()) {
      throw new Error(`the BAT of ${this.#path} is not sized for its child, resize first`)
    }
    const metadata = { ...this.#loadedMetadata, uuid, virtualSize }
    await this.#handler.outputStream(this.#path, Readable.from(JSON.stringify(metadata)), { checksum: false })
    this.#metadata = metadata
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
          await this.#removeBlockReference(this.#loadedBat.hashAt(index))
        } catch (error) {
          warn('failed to release block', { path: this.#path, index, error })
        }
      }
    }
    await this.#handler.unlink(this.#path)
    await this.#handler.rmtree(this.#loadedDataDir)

    this.#metadata = undefined
    this.#bat = undefined
    this.#dataDir = undefined
    this.#blocksDir = undefined
    this.#dirty = false
  }

  // ---------------------------------------------------------------- private

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

  #blockPath(hash: BlockHash): string {
    if (this.#blocksDir === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return join(this.#blocksDir, blockRelPath(hash))
  }

  get #tmpDir(): string {
    if (this.#blocksDir === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return join(this.#blocksDir, '.tmp')
  }

  /**
   * @param hash always hex
   * @returns complete path in store
   * Rooted at the remote root, not the disk dir, so no #resolve: the root comes from
   * the caller and the hash is always hex
   */
  #storePath(hash: BlockHash, copy = 0): string {
    if (this.#blockStorePath === undefined) {
      throw new Error(`disk ${this.#path} is PER_BACKUP_REPOSITORY but no blockStorePath was given`)
    }
    return join(this.#blockStorePath, blockRelPath(hash), String(copy))
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
      await this.#handler.outputFile(this.#blockPath(hash), encodeBlock(hash, data), {
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

    const blockPath = this.#blockPath(hash)
    for (let copy = 0; ; copy++) {
      const storePath = this.#storePath(hash, copy)
      try {
        await this.#link(storePath, blockPath)
      } catch (error: unknown) {
        const { code } = error as NodeJS.ErrnoException
        if (code === 'EMLINK') {
          continue
        }
        if (code !== 'ENOENT') {
          throw error
        }

        // link did not work, we need a new block
        const tmp = join(this.#tmpDir, randomUUID())
        await this.#handler.outputFile(tmp, encodeBlock(hash, data), { flags: 'wx' })
        try {
          await this.#link(tmp, storePath)
          await this.#link(storePath, blockPath)
        } finally {
          await this.#handler
            .unlink(tmp, { checksum: false })
            .catch(error => warn('failed to remove a temporary block file', { path: this.#path, tmp, error }))
        }
        return
      }

      if (this.#scrubEnabled) {
        await this.#scrub(hash, data, storePath)
      }
      return
    }
  }

  /**
   * best effort: the new BAT is already safe, a failure only leaks
   */
  async #removeOrphans(previousHashesPath: string): Promise<void> {
    const stream = await this.#handler.createReadStream(previousHashesPath)
    try {
      const current = this.#loadedBat
      const candidates = new HashEntrySet()

      // Pass 1: Entries of the previous BAT this flush replaced
      for await (const { firstIndex, bat } of BlockAllocationTable.readChunks(stream, this.#oldBlockCount)) {
        for (const index of bat.indexes()) {
          if (!current.sameAt(firstIndex + index, bat, index)) {
            candidates.add(Buffer.from(bat.entryAt(index)))
          }
        }
      }

      // Pass 2: A replaced hash can still be referenced at another index
      for (const index of current.indexes()) {
        if (candidates.size === 0) {
          break
        }
        candidates.delete(current.entryAt(index))
      }

      // Removal
      for (const entry of candidates) {
        await this.#removeBlockReference(entry.toString('hex') as BlockHash)
      }
    } catch (error) {
      warn('failed to remove orphaned blocks', { path: this.#path, error })
    } finally {
      stream.destroy()
    }
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
      nlink = await this.#handler.getLinkCount(blockPath)
      if (nlink === 0) {
        return // already removed
      }
      await this.#handler.unlink(blockPath, { checksum: false })
      if (nlink === 2) {
        await this.#removeOrphanStoreCopy(hash)
      }
    }
  }

  async #removeOrphanStoreCopy(hash: BlockHash): Promise<void> {
    const first = this.#storePath(hash)
    const dir = dirname(first)
    // first, check /0
    if ((await this.#linkCount(first)) === 1) {
      await this.#handler.unlink(first, { checksum: false })
    } else {
      // if /0 copy is not used for this disk, check the other paths
      for (const name of await this.#handler.list(dir, { ignoreMissing: true })) {
        if (name === '0') {
          continue
        }
        const path = join(dir, name)
        if ((await this.#linkCount(path)) === 1) {
          await this.#handler.unlink(path, { checksum: false })
        }
      }
    }
    await this.#handler.rmdir(dir).catch(error => {
      if (error.code !== 'ENOTEMPTY' && error.code !== 'EEXIST') {
        warn('failed to remove an empty store directory', { dir, error })
      }
    })
  }

  async #linkCount(path: string): Promise<number> {
    return this.#handler.getLinkCount(path).catch(error => {
      warn('failed to read a store copy link count', { path, error })
      return 0
    })
  }

  #setHash(index: number, hash: BlockHash): void {
    this.#loadedBat.set(index, hash)
    this.#dirty = true
  }

  async #scrub(hash: BlockHash, data: Buffer, storePath: string): Promise<void> {
    try {
      const headerBuffer = Buffer.alloc(HBD_HEADER_SIZE)
      const now = Date.now()
      // read metadata
      await this.#handler.read(storePath, headerBuffer, 0)
      const header = parseBlockHeader(headerBuffer)

      // a header we can't trust (wrong magic, another hash, a date in the future)
      // must not let its verifiedAt skip the check
      const trusted = header.magic === HBD_MAGIC && header.payloadHash === hash && header.verifiedAt <= now
      if (trusted && now - header.verifiedAt < this.#scrubMaxAgeMs) {
        return
      }

      this.#blocksScrubbed++

      // check block
      const buffer = await this.#handler.readFile(storePath)

      let corrupted = false
      try {
        decodeBlock(buffer, hash)
      } catch {
        corrupted = true
      }

      // update medata or rewrite block
      if (!corrupted) {
        await this.#handler.write(storePath, setVerifiedAt(headerBuffer, now), 0)
      } else {
        this.#blocksCorrupted++
        warn('corrupted store block, repaired', { hash, storePath })
        await this.#handler.outputFile(storePath, encodeBlock(hash, data, CODEC_RAW, now), {
          flags: 'w',
        })
      }
    } catch (error) {
      warn('failed to scrub a store block', { hash, storePath, error })
    }
  }
}
