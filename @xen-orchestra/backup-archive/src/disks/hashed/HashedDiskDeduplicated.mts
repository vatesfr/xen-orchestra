import type { DiskBlock } from '@xen-orchestra/disk-transform'
import type { RemoteHandlerAbstract } from '@xen-orchestra/fs'
import { createLogger } from '@xen-orchestra/log'
import { dirname, join } from 'node:path'
import { normalize } from '@xen-orchestra/fs/path'

import { HashedDisk } from './HashedDisk.mjs'
import {
  BlockAllocationTable,
  blockRelPath,
  buildBlockHeader,
  checkVersion,
  decodeBlock,
  hashesFileName,
  sha256hex,
  VERSION,
  type BlockHash,
  type HashedDiskMetadata,
} from './hbdPaths.mjs'

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
  #dirty = false

  constructor({ handler, path }: { handler: RemoteHandlerAbstract; path: string }) {
    super()
    this.#handler = handler
    this.#path = path
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
    const dataDir = `data/${uuid}`
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
    await handler.outputFile(normalize(join(dirname(path), hashesPath)), bat.toBuffer(), { flags: 'wx' })
    await handler.outputFile(path, JSON.stringify(metadata), { flags: 'wx' })

    const disk = new HashedDiskDeduplicated({ handler, path })
    await disk.init()
    return disk
  }

  get #diskDir(): string {
    return dirname(this.#path)
  }

  /** resolves a path stored in the metadata, which is relative to the hbd file */
  #resolve(relativePath: string): string {
    return normalize(join(this.#diskDir, relativePath))
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
    return normalize(join(this.#resolve(this.#loadedMetadata.localBlocksPath), blockRelPath(hash)))
  }

  /**
   * handler.readFile resolves to a Buffer, but @xen-orchestra/fs declares it as
   * Promise<string> (see its types/fs.mts). Kept in one place so the cast
   * disappears if that declaration is ever corrected.
   */
  async #readFileAsBuffer(path: string): Promise<Buffer> {
    return (await this.#handler.readFile(path)) as unknown as Buffer
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

    const metadata: HashedDiskMetadata = JSON.parse(await this.#handler.readFile(this.#path))
    checkVersion(metadata.version)

    const { blockSize, virtualSize } = metadata
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new Error(`invalid blockSize ${blockSize} in ${this.#path}`)
    }
    if (!Number.isInteger(virtualSize) || virtualSize < 0) {
      throw new Error(`invalid virtualSize ${virtualSize} in ${this.#path}`)
    }

    this.#metadata = metadata
    this.#bat = BlockAllocationTable.fromBuffer(
      await this.#readFileAsBuffer(this.#resolve(metadata.hashesPath)),
      this.getMaxBlockCount(),
      options.force
    )
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
    return this.#loadedMetadata
  }

  isDifferencing(): boolean {
    return this.#loadedMetadata.parentUuid !== undefined
  }

  async isDirectory(): Promise<boolean> {
    return true
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
    } catch (error: any) {
      if (error?.code !== 'EEXIST') {
        throw error
      }
      // already stored, by another index of this disk or by a previous run
    }
  }

  /** drops this disk's reference to `hash`, tolerating an already absent block */
  async #releaseBlock(hash: BlockHash): Promise<void> {
    try {
      await this.#handler.unlink(this.#blockPath(hash))
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
      warn('releasing an already absent block', { hash, path: this.#path })
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
    const buffer = await this.#readFileAsBuffer(this.#blockPath(hash))
    const { payload } = decodeBlock(buffer, this.getBlockSize(), hash)

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
      } catch (error: any) {
        if (error?.code !== 'EEXIST' || attempt >= 1000) {
          throw error
        }
        date = new Date(date.getTime() + 1)
      }
    }

    metadata.hashesPath = hashesPath
    await this.#handler.outputFile(this.#path, JSON.stringify(metadata), { flags: 'w' })

    this.#dirty = false
  }

  /**
   * Every file this disk claims inside `dir`: the hbd file, the current hashes
   * file, and every block file. Used by lineage and remote cleanup to tell owned
   * files from orphans.
   */
  async listAssociatedFiles(dir: string): Promise<Array<string>> {
    const prefix = normalize(dir.endsWith('/') ? dir : dir + '/')
    const isInDir = (p: string) => p === dir || p.startsWith(prefix)

    const bat = this.#loadedBat
    const files = [this.#path, this.#resolve(this.#loadedMetadata.hashesPath)]
    for (const index of bat.indexes()) {
      files.push(this.#blockPath(bat.get(index)))
    }

    return files.filter(isInDir)
  }

  async unlink(): Promise<void> {
    const metadata = this.#loadedMetadata

    // holds the blocks and every hashes file, current and orphaned
    await this.#handler.rmtree(dirname(this.#resolve(metadata.hashesPath)))
    await this.#handler.unlink(this.#path)

    this.#metadata = undefined
    this.#bat = undefined
    this.#dirty = false
  }
}
