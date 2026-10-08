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

export interface FileBlockDeviceOptions {
  /**
   * Path to the backing file. It must already exist and be sized to capacity —
   * or be a block device node, see {@link FileBlockDeviceOptions.size}.
   */
  readonly path: string
  /** Logical block size in bytes. Defaults to 512. */
  readonly blockSize?: number
  /**
   * Capacity in bytes, for a block device node (e.g. a VDI hot-plugged onto the
   * appliance's VM, `/dev/xvdX`), whose inode reports a size of 0.
   *
   * Setting it switches to the block device mode:
   * - `path` must be a block device: a typo naming the wrong node is the
   *   difference between a cache and a destroyed disk;
   * - a short read is an I/O error, not a sparse tail: zero-filling it would hand
   *   the initiator fabricated data.
   */
  readonly size?: number
}

/**
 * A {@link BlockDevice} backed by a regular (sparse) file, or a block device
 * node, opened read/write.
 *
 * The file must already exist and be sized to the desired capacity (e.g. via
 * `fs.truncate`); this keeps the device a pure data store with no provisioning
 * policy of its own.
 *
 * I/O is buffered, never `O_DIRECT`, which would need buffers aligned to the
 * logical block size that Node cannot allocate.
 */
export class FileBlockDevice implements BlockDevice {
  readonly #path: string
  readonly #blockSize: number
  readonly #isBlockDevice: boolean
  #handle?: FileHandle
  #size = 0

  constructor({ path, blockSize = DEFAULT_BLOCK_SIZE, size }: FileBlockDeviceOptions) {
    if (!Number.isInteger(blockSize) || blockSize <= 0) {
      throw new Error(`blockSize must be a positive integer, got ${blockSize}`)
    }
    if (size !== undefined) {
      if (!Number.isInteger(size) || size <= 0) {
        throw new Error(`size must be a positive integer, got ${size}`)
      }
      if (size % blockSize !== 0) {
        throw new Error(`size (${size}) is not a multiple of block size (${blockSize})`)
      }
      this.#size = size
    }
    this.#path = path
    this.#blockSize = blockSize
    this.#isBlockDevice = size !== undefined
  }

  /** Open the backing file and read its current size. Must be called before any I/O. */
  async open(): Promise<void> {
    if (this.#handle !== undefined) {
      return
    }
    const handle = await open(this.#path, 'r+')
    try {
      const stats = await handle.stat()
      if (this.#isBlockDevice) {
        if (!stats.isBlockDevice()) {
          throw new Error(`${this.#path} is not a block device`)
        }
      } else {
        if (stats.size % this.#blockSize !== 0) {
          throw new Error(`backing file size (${stats.size}) is not a multiple of block size (${this.#blockSize})`)
        }
        this.#size = stats.size
      }
      this.#handle = handle
    } catch (error) {
      await handle.close()
      throw error
    }
  }

  #requireHandle(): FileHandle {
    const handle = this.#handle
    if (handle === undefined) {
      throw new Error('FileBlockDevice.open() must be called before I/O')
    }
    return handle
  }

  getSize(): number {
    return this.#size
  }

  getBlockSize(): number {
    return this.#blockSize
  }

  async read(offset: number, length: number): Promise<Buffer> {
    const handle = this.#requireHandle()
    const buffer = Buffer.alloc(length, 0)
    let read = 0
    // A single fh.read may return fewer bytes than requested; loop to fill.
    while (read < length) {
      const { bytesRead } = await handle.read(buffer, read, length - read, offset + read)
      if (bytesRead === 0) {
        if (this.#isBlockDevice) {
          // the device is exactly as long as the caller said: the I/O failed
          throw new Error(`read of ${length} bytes at ${offset} on ${this.#path} ended after ${read} bytes`)
        }
        // Reading past EOF (sparse tail): zero-fill the remainder.
        buffer.fill(0, read)
        break
      }
      read += bytesRead
    }
    return buffer
  }

  async write(offset: number, data: Buffer): Promise<void> {
    const handle = this.#requireHandle()
    let written = 0
    while (written < data.length) {
      const { bytesWritten } = await handle.write(data, written, data.length - written, offset + written)
      written += bytesWritten
    }
  }

  async flush(): Promise<void> {
    await this.#requireHandle().sync()
  }

  async close(): Promise<void> {
    const handle = this.#handle
    if (handle !== undefined) {
      this.#handle = undefined
      await handle.close()
    }
  }
}
