import { Readable } from 'stream'
import { asyncEach } from '@vates/async-each'
import { DEFAULT_BLOCK_SIZE } from '../_constants.js'

/**
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 * @typedef {import('@xen-orchestra/fs').RemoteHandlerAbstract} RemoteHandlerAbstract
 * @typedef {Readable & { length: number }} RawStream
 */

// Shared zero block — never mutated; safe to yield multiple times.
const ZERO_BLOCK = Buffer.alloc(DEFAULT_BLOCK_SIZE, 0)

/**
 * Converts a Disk into a flat binary suitable for raw-format storage.
 *
 * Two write strategies are available:
 *
 * - toStream(): sequential Readable stream — usable with outputStream() but
 *   always writes every block (including zero-filled gaps) in order.
 *
 * - write() / writeConcurrent(): block-based pwrite approach:
 *     1. Creates and sparse-pre-allocates the file (1-byte write at fileSize-1).
 *     2. Keeps the fd open for the entire duration (no per-block open/close).
 *     3. Writes only the blocks present in the source at their byte offset.
 *     4. Gaps remain as sparse holes (read back as zeros on local/NFS/ZFS).
 *   writeConcurrent() fans out the writes with asyncEach for additional I/O
 *   parallelism; blocks at different offsets never overlap.
 */
export class DiskConsumerRawStream {
  /** @type {Disk} */
  #source

  /** @param {Disk} source */
  constructor(source) {
    this.#source = source
  }

  // ---------------------------------------------------------------------------
  // Streaming approach (sequential, writes every byte including zero gaps)
  // ---------------------------------------------------------------------------

  /**
   * @param {AbortSignal} [signal]
   * @returns {Promise<RawStream>}
   */
  async toStream(signal) {
    const source = this.#source
    const virtualSize = source.getVirtualSize()
    const maxBlocks = Math.ceil(virtualSize / DEFAULT_BLOCK_SIZE)
    const fileSize = source.getBlockIndexesCount() * DEFAULT_BLOCK_SIZE
    const blockGenerator = source.diskBlocks()

    async function* generator() {
      signal?.throwIfAborted()
      let nextIndex = 0

      for await (const { index, data } of blockGenerator) {
        signal?.throwIfAborted()

        if (index < nextIndex) {
          throw new Error(`Block index out of order: expected >= ${nextIndex}, got ${index}`)
        }

        while (nextIndex < index) {
          yield ZERO_BLOCK
          nextIndex++
        }

        if (data.length < DEFAULT_BLOCK_SIZE) {
          const padded = Buffer.alloc(DEFAULT_BLOCK_SIZE, 0)
          data.copy(padded)
          yield padded
        } else {
          yield data
        }
        nextIndex++
      }

      while (nextIndex < maxBlocks) {
        yield ZERO_BLOCK
        nextIndex++
      }
    }

    /** @type {RawStream} */
    const stream = Readable.from(generator(), { objectMode: false, highWaterMark: 10 * 1024 * 1024 })
    stream.length = fileSize
    return stream
  }

  // ---------------------------------------------------------------------------
  // Block-based pwrite approach (sparse pre-alloc + fd kept open)
  // ---------------------------------------------------------------------------

  /**
   * Computes (fileSize, fd) — shared setup for write() and writeConcurrent().
   *
   * @param {{ handler: RemoteHandlerAbstract, path: string }} param
   * @returns {Promise<{ fd: unknown, fileSize: number }>}
   */
  async #openForWrite({ handler, path }) {
    const virtualSize = this.#source.getVirtualSize()
    const maxBlocks = Math.ceil(virtualSize / DEFAULT_BLOCK_SIZE)
    const fileSize = maxBlocks * DEFAULT_BLOCK_SIZE

    await handler.outputFile(path, Buffer.alloc(0), { flags: 'wx' })
    const fd = await handler.openFile(path, 'r+')
    // Sparse pre-allocation: extend to full size with a single write at the last byte.
    // On local/NFS/ZFS this creates a sparse file; un-written regions read back as zeros.
    await handler.write(/** @type {any} */ (fd), Buffer.alloc(1, 0), fileSize - 1)
    return { fd, fileSize }
  }

  /**
   * Writes disk blocks sequentially to `path`, keeping the fd open.
   * Only blocks returned by diskBlocks() are written; gaps are sparse holes.
   *
   * @param {{ handler: RemoteHandlerAbstract, path: string }} target
   * @param {AbortSignal} [signal]
   * @returns {Promise<number>} total allocated file size in bytes
   */
  async write({ handler, path }, signal) {
    const { fd, fileSize } = await this.#openForWrite({ handler, path })
    try {
      for await (const { index, data } of this.#source.diskBlocks()) {
        signal?.throwIfAborted()
        await handler.write(/** @type {any} */ (fd), data, index * DEFAULT_BLOCK_SIZE)
      }
    } finally {
      await handler.closeFile(fd)
    }
    return fileSize
  }

  /**
   * Like write(), but fans out block writes with asyncEach.
   * Safe because blocks are at non-overlapping byte offsets.
   *
   * @param {{ handler: RemoteHandlerAbstract, path: string, concurrency?: number }} target
   * @param {AbortSignal} [signal]
   * @returns {Promise<number>} total allocated file size in bytes
   */
  async writeConcurrent({ handler, path, concurrency = 4 }, signal) {
    const { fd, fileSize } = await this.#openForWrite({ handler, path })
    try {
      const blockGen = this.#source.diskBlocks()
      try {
        await asyncEach(
          blockGen,
          async ({ index, data }) => {
            signal?.throwIfAborted()
            await handler.write(/** @type {any} */ (fd), data, index * DEFAULT_BLOCK_SIZE)
          },
          { concurrency }
        )
      } catch (err) {
        // Ensure source.close() runs even if a write fails mid-stream.
        await blockGen.return?.()
        throw err
      }
    } finally {
      await handler.closeFile(fd)
    }
    return fileSize
  }
}
