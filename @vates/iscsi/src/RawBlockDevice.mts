import { open } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import { createLogger, type Logger } from '@xen-orchestra/log'

import { PosixBlockDevice } from './backend.mjs'

const log: Logger = createLogger('vates:iscsi:raw-block-device')

const DEFAULT_BLOCK_SIZE = 512
const DEFAULT_OPEN_RETRIES = 10
const DEFAULT_OPEN_RETRY_DELAY_MS = 200

/**
 * Errors worth retrying while a freshly hot-plugged device settles: the node
 * may not be there yet (udev), the kernel may not have attached the backend
 * yet, or a scanner (`blkid`, `systemd-udevd`) may still hold it exclusively.
 */
const TRANSIENT_OPEN_ERRORS: ReadonlySet<string> = new Set(['EBUSY', 'ENOENT', 'ENOMEDIUM', 'ENXIO'])

export interface RawBlockDeviceOptions {
  /** Path to the device node, e.g. `/dev/xvdc`. It must be a block device. */
  readonly path: string
  /**
   * Capacity in bytes.
   *
   * Passed in rather than probed: a block device's inode reports a size of 0,
   * and whoever provisioned the device already knows how big it is (for a live
   * mount's cache, it is the `virtual_size` XAPI recorded for the VDI). That
   * spares this class a `/sys` lookup, an ioctl it cannot make from Node, or a
   * `blockdev` subprocess.
   */
  readonly size: number
  /** Logical block size in bytes. Defaults to 512. */
  readonly blockSize?: number
  /** How many times {@link RawBlockDevice.open} retries a transient failure. Defaults to 10. */
  readonly openRetries?: number
  /** Delay between those retries, in ms. Defaults to 200. */
  readonly openRetryDelayMs?: number
}

/**
 * A `BlockDevice` backed by a block device node opened read/write, for a
 * store the caller provisioned and attached to this machine — typically a VDI
 * hot-plugged onto the appliance's own VM, surfacing as `/dev/xvdX`.
 *
 * Distinct from `FileBlockDevice` on three counts, all of which matter:
 *
 * - its capacity comes from its caller, not from the inode, which reports 0;
 * - it refuses a path that is not a block device. A typo naming the wrong node
 *   is the difference between a cache and a destroyed disk, so it is checked
 *   rather than assumed;
 * - a short read is an error, not a sparse tail. Zero-filling it, as a regular
 *   file legitimately does, would hand the initiator fabricated data.
 *
 * I/O is buffered, never `O_DIRECT`: that would need buffers aligned to the
 * logical block size, which Node cannot allocate. The page cache in front of
 * the device is a free second-level cache, at the cost of the memory it holds
 * not being visible in the Node heap.
 *
 * Opening a device node read/write needs root, or membership of the group
 * owning it (`disk` on most distributions).
 */
export class RawBlockDevice extends PosixBlockDevice {
  readonly #size: number
  readonly #openRetries: number
  readonly #openRetryDelayMs: number

  constructor({
    path,
    size,
    blockSize = DEFAULT_BLOCK_SIZE,
    openRetries = DEFAULT_OPEN_RETRIES,
    openRetryDelayMs = DEFAULT_OPEN_RETRY_DELAY_MS,
  }: RawBlockDeviceOptions) {
    super(path, blockSize)
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error(`size must be a positive integer, got ${size}`)
    }
    if (size % blockSize !== 0) {
      throw new Error(`size (${size}) is not a multiple of block size (${blockSize})`)
    }
    this.#size = size
    this.#openRetries = openRetries
    this.#openRetryDelayMs = openRetryDelayMs
  }

  /**
   * Open the device node and check it really is one. Must be called before any
   * I/O.
   *
   * A device that has just been attached may not be openable yet — the node is
   * created asynchronously by udev, and whoever created it may still be holding
   * it — so a transient failure is retried rather than failing the mount.
   */
  async open(): Promise<void> {
    if (this.isOpen) {
      return
    }
    const path = this.path
    let handle
    for (let attempt = 0; ; attempt++) {
      try {
        handle = await open(path, 'r+')
        break
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code
        if (attempt >= this.#openRetries || code === undefined || !TRANSIENT_OPEN_ERRORS.has(code)) {
          throw error
        }
        log.debug('device not ready yet, retrying', { attempt, code, path })
        await sleep(this.#openRetryDelayMs)
      }
    }
    try {
      const stats = await handle.stat()
      if (!stats.isBlockDevice()) {
        throw new Error(`${path} is not a block device`)
      }
      this.setHandle(handle)
    } catch (error) {
      await handle.close()
      throw error
    }
    log.debug('opened', { path, size: this.#size, blockSize: this.getBlockSize() })
  }

  getSize(): number {
    return this.#size
  }

  /**
   * The device is exactly as long as the caller said, so a read that ends early
   * means the I/O failed — never a hole to fill with zeroes.
   */
  protected onEndOfFile(offset: number, length: number, read: number): void {
    throw new Error(`read of ${length} bytes at ${offset} on ${this.path} ended after ${read} bytes`)
  }
}
