import { open, type FileHandle } from 'node:fs/promises'

/**
 * Byte-range random-access store backing a single iSCSI LUN.
 *
 * The protocol layer translates SCSI READ/WRITE CDBs (LBA + block count) into
 * byte offsets/lengths against this interface, so an implementation only has to
 * provide flat random access — it is intentionally decoupled from the wire
 * code. `DiskBlockDevice` is such an implementation, over
 * `@xen-orchestra/disk-transform`'s `RandomAccessDisk` (VHD/raw/NBD).
 */
export interface BlockDevice {
  /** Optional one-time initialization, awaited by the target before serving I/O. */
  open?(): Promise<void>
  /** Total capacity in bytes. Must be a multiple of {@link BlockDevice.getBlockSize}. */
  getSize(): number
  /** Logical block size in bytes (typically 512). */
  getBlockSize(): number
  /** Read exactly `length` bytes starting at byte `offset`. */
  read(offset: number, length: number): Promise<Buffer>
  /** Write `data` starting at byte `offset`. */
  write(offset: number, data: Buffer): Promise<void>
  /** Flush any buffered data to stable storage (SYNCHRONIZE CACHE). */
  flush(): Promise<void>
  /** Release underlying resources. */
  close(): Promise<void>
}

const DEFAULT_BLOCK_SIZE = 512

/**
 * Shared plumbing for the {@link BlockDevice}s backed by a POSIX file
 * descriptor: the read/write loops, the handle's lifecycle and `fsync`.
 *
 * Not exported from the package: it exists so `FileBlockDevice` and
 * `RawBlockDevice` don't each carry their own copy of the loops, not as an
 * extension point for anyone else.
 *
 * What subclasses decide is where the capacity comes from ({@link getSize}, and
 * the {@link open} that establishes it) and what a read hitting the end of the
 * backing object means ({@link onEndOfFile}) — the one behaviour that genuinely
 * differs between a sparse file and a device of a known size.
 */
export abstract class PosixBlockDevice implements BlockDevice {
  protected readonly path: string
  readonly #blockSize: number
  #handle?: FileHandle

  protected constructor(path: string, blockSize: number) {
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new Error(`blockSize must be a positive integer, got ${blockSize}`)
    }
    this.path = path
    this.#blockSize = blockSize
  }

  /** Open the backing object and establish its capacity. Must be called before any I/O. */
  abstract open(): Promise<void>

  abstract getSize(): number

  getBlockSize(): number {
    return this.#blockSize
  }

  /** Whether {@link open} has already run, so it can stay a no-op when called twice. */
  protected get isOpen(): boolean {
    return this.#handle !== undefined
  }

  /** Adopt an already-open handle. Called by {@link open} once its own checks passed. */
  protected setHandle(handle: FileHandle): void {
    this.#handle = handle
  }

  protected requireHandle(): FileHandle {
    const handle = this.#handle
    if (handle === undefined) {
      throw new Error(`${this.constructor.name}.open() must be called before I/O`)
    }
    return handle
  }

  /**
   * Called when a read reported 0 bytes before `length` was filled, with
   * `buffer` holding the `read` bytes obtained so far and zeroes after them.
   *
   * Returning leaves those zeroes in place; throwing surfaces the short read as
   * an I/O error.
   */
  protected abstract onEndOfFile(offset: number, length: number, read: number): void

  async read(offset: number, length: number): Promise<Buffer> {
    const handle = this.requireHandle()
    const buffer = Buffer.alloc(length, 0)
    let read = 0
    // A single fh.read may return fewer bytes than requested; loop to fill.
    while (read < length) {
      const { bytesRead } = await handle.read(buffer, read, length - read, offset + read)
      if (bytesRead === 0) {
        this.onEndOfFile(offset, length, read)
        break
      }
      read += bytesRead
    }
    return buffer
  }

  async write(offset: number, data: Buffer): Promise<void> {
    const handle = this.requireHandle()
    let written = 0
    while (written < data.length) {
      const { bytesWritten } = await handle.write(data, written, data.length - written, offset + written)
      written += bytesWritten
    }
  }

  async flush(): Promise<void> {
    await this.requireHandle().sync()
  }

  async close(): Promise<void> {
    const handle = this.#handle
    if (handle !== undefined) {
      this.#handle = undefined
      await handle.close()
    }
  }
}

export interface FileBlockDeviceOptions {
  /** Path to the backing file. It must already exist and be sized to capacity. */
  readonly path: string
  /** Logical block size in bytes. Defaults to 512. */
  readonly blockSize?: number
}

/**
 * A {@link BlockDevice} backed by a regular (sparse) file opened read/write.
 *
 * The file must already exist and be sized to the desired capacity (e.g. via
 * `fs.truncate`); this keeps the device a pure data store with no provisioning
 * policy of its own. Use `RawBlockDevice` for a device node, whose capacity the
 * inode does not report.
 */
export class FileBlockDevice extends PosixBlockDevice {
  #size = 0

  constructor({ path, blockSize = DEFAULT_BLOCK_SIZE }: FileBlockDeviceOptions) {
    super(path, blockSize)
  }

  /** Open the backing file and read its current size. Must be called before any I/O. */
  async open(): Promise<void> {
    if (this.isOpen) {
      return
    }
    const blockSize = this.getBlockSize()
    const handle = await open(this.path, 'r+')
    try {
      const { size } = await handle.stat()
      if (size % blockSize !== 0) {
        throw new Error(`backing file size (${size}) is not a multiple of block size (${blockSize})`)
      }
      this.setHandle(handle)
      this.#size = size
    } catch (error) {
      await handle.close()
      throw error
    }
  }

  getSize(): number {
    return this.#size
  }

  /**
   * A regular file is legitimately shorter than the range asked for — a sparse
   * tail that was never written — so the rest of the buffer stays zeroed.
   */
  protected onEndOfFile(): void {}
}
