import type { DiskBlock } from '@xen-orchestra/disk-transform'
import type { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { isInDir, normalize } from '@xen-orchestra/fs/path'

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
  type BlockHash,
  type HashedDiskMetadata,
} from './hbdPaths.mjs'

/**
 * Content addressed disk: block index -> SHA-256 of the block payload, kept in a
 * flat binary BAT, and one file per unique payload named after its hash.
 */
export class HashedDiskDeduplicated extends HashedDisk {
  #handler: RemoteHandlerAbstract
  #path: string
  #metadata: HashedDiskMetadata | undefined
  #bat: BlockAllocationTable | undefined
  #blocksDir: string | undefined
  #dirty = false

  constructor({ handler, path }: { handler: RemoteHandlerAbstract; path: string }) {
    super()
    this.#handler = handler
    // normalized once here so every path this disk hands out or derives has the
    // same shape: callers match them against paths listed from the handler, and
    // an unnormalized one silently fails to compare equal
    this.#path = normalize(path)
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
  }: {
    handler: RemoteHandlerAbstract
    path: string
    virtualSize: number
    blockSize: number
    uuid: string
    parentUuid?: string
    parentPath?: string
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
      dedupType: 'PER_DISK',
      localBlocksPath: `${dataDir}/blocks/`,
      hashesPath,
    } satisfies HashedDiskMetadata

    const bat = BlockAllocationTable.allocate(Math.ceil(virtualSize / blockSize))

    const disk = new HashedDiskDeduplicated({ handler, path })
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

  #blockPath(hash: BlockHash): string {
    if (this.#blocksDir === undefined) {
      throw new Error(`can't use a HashedDiskDeduplicated before init`)
    }
    return join(this.#blocksDir, blockRelPath(hash))
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

      const dataDir = this.#resolve(dataDirName(metadata.uuid))
      hashesPath = this.#resolve(metadata.hashesPath, dataDir)
      blocksDir = this.#resolve(metadata.localBlocksPath, dataDir)
    } catch (error: unknown) {
      throw new HbdFileError((error as NodeJS.ErrnoException).message, this.#path, error)
    }

    this.#metadata = metadata
    this.#blocksDir = blocksDir

    try {
      this.#bat = BlockAllocationTable.fromBuffer(
        await this.#handler.readFile(hashesPath),
        this.getMaxBlockCount(),
        options.force
      )
    } catch (error: unknown) {
      this.#metadata = undefined
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

    await this.#storeBlock(hash, data)
    bat.set(index, hash)
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
   * Writes the BAT to a new timestamped file, then points the hbd file at it.
   * The previous hashes file is never overwritten, so a crash between the two
   * writes leaves the disk readable through the old one.
   */
  async flushMetadata(): Promise<void> {
    const metadata = this.#loadedMetadata
    const dataDir = dirname(metadata.hashesPath)

    // Every flush writes a new file: the one the hbd still points at must stay
    // intact, so a crash before the hbd is updated leaves the disk readable.
    //
    // Millisecond resolution is not unique enough for two flushes in a row, and
    // an orphan from an interrupted flush may already hold the name, so let the
    // exclusive write arbitrate rather than comparing path strings.
    let date = new Date()
    let hashesPath: string
    for (let attempt = 0; ; attempt++) {
      hashesPath = join(dataDir, hashesFileName(date))
      try {
        await this.#handler.outputFile(this.#resolve(hashesPath), this.#loadedBat.toBuffer(), { flags: 'wx' })
        break
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || attempt >= 1000) {
          throw error
        }
        date = new Date(date.getTime() + 1)
      }
    }

    const newMetadata = { ...metadata, hashesPath }
    await this.#handler.outputStream(this.#path, Readable.from(JSON.stringify(newMetadata)), { checksum: false })
    this.#metadata = newMetadata

    this.#dirty = false
  }

  /**
   * What this disk claims inside `dir`: the hbd file, and its data directory as
   * a whole. Used by lineage and remote cleanup to tell owned files from orphans.
   */
  async listAssociatedFiles(dir: string): Promise<Array<string>> {
    const files = [this.#path, this.#dataDir]

    return files.filter(p => isInDir(p, dir))
  }

  /**
   * holds the blocks and every hashes file, current and orphaned
   */
  get #dataDir(): string {
    return this.#resolve(dataDirName(this.#loadedMetadata.uuid))
  }

  async unlink(): Promise<void> {
    await this.#handler.rmtree(this.#dataDir)
    await this.#handler.unlink(this.#path)

    this.#metadata = undefined
    this.#bat = undefined
    this.#blocksDir = undefined
    this.#dirty = false
  }
}
