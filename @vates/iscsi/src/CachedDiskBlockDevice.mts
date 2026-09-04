import { asyncEach } from '@vates/async-each'
import { createLogger, type Logger } from '@xen-orchestra/log'
import type { ProgressHandler, RandomAccessDisk } from '@xen-orchestra/disk-transform'

import type { BlockDevice } from './backend.mjs'

const log: Logger = createLogger('vates:iscsi:cached-disk-block-device')

const DEFAULT_BLOCK_SIZE = 512
const DEFAULT_HYDRATE_CONCURRENCY = 8

export interface CachedDiskBlockDeviceOptions {
  /**
   * Source disk, already `init()`ed by the caller. Only ever read from, one
   * whole block at a time.
   */
  readonly disk: RandomAccessDisk
  /**
   * Writable store holding what has been read from {@link disk} so far, already
   * `open()`ed and at least as large as the disk's virtual size.
   */
  readonly cache: BlockDevice
  /**
   * Logical block size advertised to initiators, in bytes. Defaults to 512.
   * The disk's own block size must be a multiple of it.
   */
  readonly blockSize?: number
  /**
   * Notified with the materialized fraction (0..1) every time a new block is
   * cached — on demand or through {@link hydrate} — and via `done()` once
   * every block has been. Reused from the `disk-transform` export/import
   * pipelines rather than inventing a new shape.
   */
  readonly progressHandler?: ProgressHandler
  /**
   * A previously-persisted bitmap to resume from, one byte per block (see
   * {@link CachedDiskBlockDevice}'s class doc). Its length must match the
   * block count computed from `disk`/`blockSize`; a mismatch (e.g. the disk
   * was resized since it was saved) is treated as stale and discarded rather
   * than rejected, so a corrupt/outdated resume file never blocks a mount.
   */
  readonly initialBitmap?: Buffer
  /**
   * Notified with a block's index the moment it is newly cached — narrower
   * than `progressHandler`, which only carries an aggregate fraction and
   * cannot say *which* block just landed. Meant for persisting the bitmap
   * one byte at a time; best-effort like `progressHandler`, a failure here
   * must never break block materialization.
   */
  readonly onBlockCached?: (index: number) => void
}

/**
 * A read-write {@link BlockDevice} over a {@link RandomAccessDisk}, backed by
 * a local writable store: each source block is materialized into the store
 * the first time it's needed, tracked by a bitmap so repeat access never goes
 * back to the source. Call {@link hydrate} to force the whole disk in upfront.
 *
 * The bitmap is one byte per block, not one bit: a caller that persists it
 * incrementally (see `onBlockCached`) writes one block's byte at a time, and
 * every block's offset must be independent of every other's for concurrent
 * writes to be safe. A real bit-packed bitmap fails that: several blocks'
 * bits sharing one byte would need a read-modify-write of that byte, which
 * two blocks completing concurrently could race on and lose an update. One
 * byte per block costs a little more memory (negligible in absolute terms —
 * a few hundred KB even for a huge disk) and buys that independence for free.
 *
 * Blocks the source doesn't have are marked present without being written —
 * relies on the store reading as zero where nothing was ever written.
 *
 * Writes land in the store only; the source is never written to, so the
 * mount diverges from it as soon as anything writes.
 */
export class CachedDiskBlockDevice implements BlockDevice {
  readonly #disk: RandomAccessDisk
  readonly #cache: BlockDevice
  readonly #blockSize: number
  readonly #progressHandler?: ProgressHandler
  readonly #onBlockCached?: (index: number) => void
  readonly #initialBitmap?: Buffer

  // one byte per source block, 0 or 1, set once the block is in the cache
  #bitmap: Buffer = Buffer.alloc(0)
  #blockCount = 0
  #cachedCount = 0
  // source blocks being materialized right now, so concurrent reads of
  // overlapping ranges fetch each block once
  readonly #inFlight: Map<number, Promise<void>> = new Map()
  #diskBlockSize?: number
  #size?: number

  constructor({
    disk,
    cache,
    blockSize = DEFAULT_BLOCK_SIZE,
    progressHandler,
    initialBitmap,
    onBlockCached,
  }: CachedDiskBlockDeviceOptions) {
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new Error(`blockSize must be a positive integer, got ${blockSize}`)
    }
    this.#disk = disk
    this.#cache = cache
    this.#blockSize = blockSize
    this.#progressHandler = progressHandler
    this.#initialBitmap = initialBitmap
    this.#onBlockCached = onBlockCached
  }

  /** Read the source geometry and allocate (or resume) the bitmap. */
  async open(): Promise<void> {
    const blockSize = this.#blockSize
    const diskBlockSize = this.#disk.getBlockSize()
    if (diskBlockSize % blockSize !== 0) {
      throw new Error(`disk block size (${diskBlockSize}) is not a multiple of the LUN block size (${blockSize})`)
    }
    const size = this.#disk.getVirtualSize()
    if (size <= 0 || size % blockSize !== 0) {
      throw new Error(`disk virtual size (${size}) is not a positive multiple of the LUN block size (${blockSize})`)
    }
    if (this.#cache.getSize() < size) {
      throw new Error(`cache (${this.#cache.getSize()} bytes) is smaller than the disk (${size} bytes)`)
    }

    this.#diskBlockSize = diskBlockSize
    this.#size = size
    this.#blockCount = Math.ceil(size / diskBlockSize)

    const initialBitmap = this.#initialBitmap
    if (initialBitmap !== undefined && initialBitmap.length === this.#blockCount) {
      this.#bitmap = initialBitmap
      let cachedCount = 0
      for (const byte of initialBitmap) {
        if (byte !== 0) {
          cachedCount++
        }
      }
      this.#cachedCount = cachedCount
    } else {
      if (initialBitmap !== undefined) {
        log.warn('discarding stale initial bitmap (block count mismatch)', {
          gotLength: initialBitmap.length,
          expectedLength: this.#blockCount,
        })
      }
      this.#bitmap = Buffer.alloc(this.#blockCount)
    }
    log.debug('opened', {
      size,
      blockSize,
      diskBlockSize,
      blockCount: this.#blockCount,
      resumedBlocks: this.#cachedCount,
    })
  }

  getSize(): number {
    const size = this.#size
    if (size === undefined) {
      throw new Error('CachedDiskBlockDevice.open() must be called before I/O')
    }
    return size
  }

  getBlockSize(): number {
    return this.#blockSize
  }

  /** How much of the source has been materialized into the cache. */
  getMaterialized(): { blocks: number; total: number } {
    return { blocks: this.#cachedCount, total: this.#blockCount }
  }

  /**
   * Force every block into the cache — including holes, so `getMaterialized()`
   * reaches `total` once done, matching what a full sequential read would
   * naturally mark. Already-materialized blocks are skipped, so this resumes
   * rather than redoes whatever on-demand reads (or a previous, interrupted
   * hydration) already did.
   *
   * Hydrating a large disk takes hours, so it must be interruptible: `signal`
   * stops it at the next block boundary, rejecting once the blocks already in
   * flight settle. Nothing is rolled back — every block cached so far stays
   * cached, and because this call resumes, aborting and calling again later
   * picks up where it stopped rather than starting over.
   */
  async hydrate({
    concurrency = DEFAULT_HYDRATE_CONCURRENCY,
    signal,
  }: { concurrency?: number; signal?: AbortSignal } = {}): Promise<void> {
    signal?.throwIfAborted()
    const blockCount = this.#blockCount
    await asyncEach(
      (function* allBlockIndexes() {
        for (let index = 0; index < blockCount; index++) {
          yield index
        }
      })(),
      index => this.#ensureBlock(index),
      { concurrency, signal }
    )
  }

  #isCached(index: number): boolean {
    return this.#bitmap[index] !== 0
  }

  #setCached(index: number): void {
    if (!this.#isCached(index)) {
      this.#bitmap[index] = 1
      this.#cachedCount++
      this.#reportProgress()
      // best-effort, same contract as #reportProgress: a synchronous throw
      // here must never break block materialization. Any async failure (e.g.
      // the persisted-bitmap write itself) is the callback's own job to catch.
      try {
        this.#onBlockCached?.(index)
      } catch (error) {
        log.warn('onBlockCached failed', { error, index })
      }
    }
  }

  // best-effort: a failure here (sync or async) must never break block
  // materialization. Wrapping the body in an `async` function, rather than a
  // plain try/catch, is what makes a *synchronous* throw from the handler
  // land in the same `.catch()` as an asynchronous rejection.
  #reportProgress(): void {
    const handler = this.#progressHandler
    if (handler === undefined) {
      return
    }
    const fraction = this.#cachedCount / this.#blockCount
    ;(async () => {
      await handler.setProgress(fraction)
      // every block is in the cache: nothing more will ever be reported
      if (fraction === 1) {
        await handler.done()
      }
    })().catch(error => log.warn('progress handler failed', { error }))
  }

  /**
   * Copy one source block into the cache, unless it is already there. Concurrent
   * calls for the same block share a single fetch.
   */
  #ensureBlock(index: number): Promise<void> {
    if (this.#isCached(index)) {
      return Promise.resolve()
    }
    let pending = this.#inFlight.get(index)
    if (pending === undefined) {
      // the entry goes away whether the fetch succeeded or not, so a failed
      // block is retried later instead of being remembered as broken
      pending = this.#fetchBlock(index).finally(() => this.#inFlight.delete(index))
      this.#inFlight.set(index, pending)
    }
    return pending
  }

  async #fetchBlock(index: number): Promise<void> {
    const diskBlockSize = this.#diskBlockSize as number
    if (this.#disk.hasBlock(index)) {
      const offset = index * diskBlockSize
      const { data } = await this.#disk.readBlock(index)
      // a source block is always full-size: the last one may run past the end of
      // the disk, and the cache must not be written beyond it
      const length = Math.min(diskBlockSize, this.getSize() - offset)
      await this.#cache.write(offset, length < data.length ? data.subarray(0, length) : data)
    }
    // a block the source does not have stays as the cache has it, which is
    // zeroes as long as nothing has written there
    this.#setCached(index)
  }

  #checkRange(offset: number, length: number): void {
    const size = this.getSize()
    if (offset < 0 || length < 0 || offset + length > size) {
      throw new Error(`access of ${length} bytes at ${offset} is out of range (size ${size})`)
    }
  }

  async read(offset: number, length: number): Promise<Buffer> {
    this.#checkRange(offset, length)
    if (length === 0) {
      return Buffer.alloc(0)
    }
    const diskBlockSize = this.#diskBlockSize as number
    const last = Math.floor((offset + length - 1) / diskBlockSize)
    for (let index = Math.floor(offset / diskBlockSize); index <= last; index++) {
      await this.#ensureBlock(index)
    }
    return this.#cache.read(offset, length)
  }

  async write(offset: number, data: Buffer): Promise<void> {
    this.#checkRange(offset, data.length)
    if (data.length === 0) {
      return
    }
    // every covered block must be materialized first, even the ones this write
    // covers entirely: skipping the fetch would let an already in-flight one
    // land *after* the payload and overwrite it with the source's bytes.
    // (optimization left out on purpose — it has to join the in-flight fetch)
    await this.read(offset, data.length)
    await this.#cache.write(offset, data)
  }

  async flush(): Promise<void> {
    await this.#cache.flush()
  }

  async close(): Promise<void> {
    try {
      await this.#cache.close()
    } finally {
      await this.#disk.close()
    }
  }
}
