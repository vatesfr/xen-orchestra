import { open } from 'node:fs/promises'

/**
 * Byte-range access to a local block device (`@vates/iscsi`'s `BlockDevice`).
 * Size is passed in, not stat'ed: `fs.stat` reports 0 for a device node.
 */
export default class LocalBlockDevice {
  #blockSize
  #handle
  #path
  #size

  /**
   * @param {object} params
   * @param {string} params.path - device node, e.g. `/dev/xvdb`
   * @param {number} params.size - usable size in bytes
   * @param {number} [params.blockSize] - logical block size, defaults to 512
   */
  constructor({ path, size, blockSize = 512 }) {
    if (!Number.isInteger(size) || size <= 0) {
      throw new Error(`size must be a positive integer, got ${size}`)
    }
    if (size % blockSize !== 0) {
      throw new Error(`size (${size}) is not a multiple of block size (${blockSize})`)
    }
    this.#blockSize = blockSize
    this.#path = path
    this.#size = size
  }

  async open() {
    if (this.#handle === undefined) {
      this.#handle = await open(this.#path, 'r+')
    }
  }

  getSize() {
    return this.#size
  }

  getBlockSize() {
    return this.#blockSize
  }

  #check(offset, length) {
    if (this.#handle === undefined) {
      throw new Error('LocalBlockDevice.open() must be called before I/O')
    }
    if (offset < 0 || length < 0 || offset + length > this.#size) {
      throw new Error(`access of ${length} bytes at ${offset} is out of range (size ${this.#size})`)
    }
  }

  async read(offset, length) {
    this.#check(offset, length)
    const buffer = Buffer.allocUnsafe(length)
    let read = 0
    // a single read may return fewer bytes than asked for
    while (read < length) {
      const { bytesRead } = await this.#handle.read(buffer, read, length - read, offset + read)
      if (bytesRead === 0) {
        // a device that is not connected yet reports no size and ends at 0
        throw new Error(`unexpected end of ${this.#path} at ${offset + read}, expected ${this.#size} bytes`)
      }
      read += bytesRead
    }
    return buffer
  }

  async write(offset, data) {
    this.#check(offset, data.length)
    let written = 0
    while (written < data.length) {
      const { bytesWritten } = await this.#handle.write(data, written, data.length - written, offset + written)
      written += bytesWritten
    }
  }

  async flush() {
    await this.#handle?.sync()
  }

  async close() {
    const handle = this.#handle
    if (handle !== undefined) {
      this.#handle = undefined
      await handle.close()
    }
  }
}
