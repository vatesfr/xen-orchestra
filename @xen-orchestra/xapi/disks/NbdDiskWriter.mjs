import assert from 'node:assert'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:xapi:disks:nbd-writer')

// the xo-nbd plugin accepts at most 4 MiB per request: the disks are written by requests of 2 MiB at most
export const NBD_WRITE_SIZE = 2 * 1024 * 1024

// writes in flight on the single connection of a disk, tapdisk handles 8 requests at a time per connection
export const NBD_WRITE_CONCURRENCY = 8

const isZero = buffer => buffer.every(byte => byte === 0)

/**
 * Writes disks into a NBD export opened in write mode, through a single connection
 */
export class NbdDiskWriter {
  #client
  #closeExport
  /** @type {Promise<void>|undefined} */
  #exportClosed

  /**
   * @param {import('@vates/nbd-client').AbstractNbdClient} client - connected to a writable export
   * @param {() => Promise<void>} closeExport - ends the export: the written data are only guaranteed once it resolved
   */
  constructor(client, closeExport) {
    this.#client = client
    this.#closeExport = closeExport
  }

  // called once, whoever asks first
  #endExport() {
    if (this.#exportClosed === undefined) {
      this.#exportClosed = this.#closeExport()
    }
    return this.#exportClosed
  }

  /**
   * Writes the blocks of `disk` at their place, the rest of the export is not modified: a full disk on a blank
   * VDI, or a differencing disk on a copy of its parent
   *
   * @param {import('@xen-orchestra/disk-transform').Disk} disk
   * @param {object} [options]
   * @param {{throwIfRequested(): void}} [options.cancelToken]
   * @param {number} [options.concurrency] - blocks written at the same time
   * @returns {Promise<number>} the number of bytes written
   */
  async writeDisk(disk, { cancelToken, concurrency = NBD_WRITE_CONCURRENCY } = {}) {
    const client = this.#client
    const exportSize = BigInt(client.exportSize)
    const blockSize = disk.getBlockSize()
    // a block is written by one request, or split in requests of NBD_WRITE_SIZE
    const requestSize = Math.min(blockSize, NBD_WRITE_SIZE)
    assert.strictEqual(blockSize % requestSize, 0, `can't split blocks of ${blockSize} bytes in requests`)
    const requestsPerBlock = blockSize / requestSize

    let written = 0
    await asyncEach(
      disk.diskBlocks(),
      async ({ index, data, release }) => {
        cancelToken?.throwIfRequested()
        for (let i = 0; i < requestsPerBlock && i * requestSize < data.length; i++) {
          const requestIndex = index * requestsPerBlock + i
          const offset = BigInt(requestIndex) * BigInt(requestSize)
          let chunk = data.subarray(i * requestSize, (i + 1) * requestSize)
          if (offset >= exportSize) {
            // the disk may be a bit larger than the VDI (VHD geometry): only padding can be beyond the export
            assert.ok(isZero(chunk), `block ${index} has data beyond the end of the export`)
            continue
          }
          const remaining = exportSize - offset
          const expected = remaining < BigInt(requestSize) ? Number(remaining) : requestSize
          if (chunk.length > expected) {
            assert.ok(isZero(chunk.subarray(expected)), `block ${index} has data beyond the end of the export`)
            chunk = chunk.subarray(0, expected)
          } else if (chunk.length < expected) {
            // the last block of a disk smaller than the VDI: the rest is zeroes
            chunk = Buffer.concat([chunk], expected)
          }
          await client.writeBlock(requestIndex, chunk, requestSize)
          written += chunk.length
        }
        // the block has been written, its memory can be reused
        release?.()
      },
      { concurrency }
    )
    return written
  }

  /**
   * Ends the export: the written data are only guaranteed once this resolved, a failure means the disk import
   * failed
   */
  async close() {
    const client = this.#client
    try {
      if (client.canFlush) {
        await client.flush()
      }
    } finally {
      try {
        await client.disconnect()
      } finally {
        await this.#endExport()
      }
    }
  }

  /**
   * After a failure: frees the connection and the export, without throwing
   */
  async abort() {
    await this.#client.disconnect().catch(error => warn('NBD writer: disconnection failed', { error }))
    await this.#endExport().catch(error => warn('NBD writer: closing the export failed, it will expire', { error }))
  }
}
