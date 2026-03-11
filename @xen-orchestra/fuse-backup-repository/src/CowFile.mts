import * as nodefs from 'node:fs'
import * as nodepath from 'node:path'
import { promisify } from 'node:util'
import type { RawConsumer } from '@xen-orchestra/disk-transform'

const fsOpen = promisify(nodefs.open)
const fsClose = promisify(nodefs.close)
const fsRead = promisify(nodefs.read)
const fsWrite = promisify(nodefs.write)
const fsFtruncate = promisify(nodefs.ftruncate)

// Granularity for COW block tracking. 4096 matches the NFS rsize default.
const COW_BLOCK = 4096

/**
 * A copy-on-write view over a read-only RawConsumer source.
 *
 * Writes land in a sparse file at `overlayPath`; reads serve written blocks
 * from the overlay and unwritten blocks from the source.  The overlay file is
 * created lazily on the first write so read-only usage has zero overhead.
 */
export class CowFile {
  readonly #source: RawConsumer
  readonly #overlayPath: string
  #fd: number | undefined
  readonly #writtenBlocks = new Set<number>()

  constructor(source: RawConsumer, overlayPath: string) {
    this.#source = source
    this.#overlayPath = overlayPath
  }

  size(): number {
    return this.#source.size()
  }

  /**
   * Initialise the source disk.  The overlay file is created lazily on the
   * first write; this only needs to be called once per CowFile instance.
   */
  async init(): Promise<void> {
    await this.#source.init()
  }

  /**
   * Read `len` bytes at `pos` into `buf`.
   * Written blocks are served from the overlay; everything else from the source.
   * Returns the number of bytes read.
   */
  async read(buf: Buffer, len: number, pos: number): Promise<number> {
    if (this.#fd === undefined || this.#writtenBlocks.size === 0) {
      const data = await this.#source.read(pos, len)
      data.copy(buf, 0, 0, data.length)
      return data.length
    }

    let totalRead = 0
    let remaining = len
    let curPos = pos
    let bufOff = 0

    while (remaining > 0) {
      const blockIdx = Math.floor(curPos / COW_BLOCK)
      const offInBlock = curPos - blockIdx * COW_BLOCK
      const chunkLen = Math.min(remaining, COW_BLOCK - offInBlock)
      const chunk = buf.subarray(bufOff, bufOff + chunkLen)

      if (this.#writtenBlocks.has(blockIdx)) {
        const { bytesRead } = await fsRead(this.#fd, chunk, 0, chunkLen, curPos)
        totalRead += bytesRead
        if (bytesRead < chunkLen) break
      } else {
        const data = await this.#source.read(curPos, chunkLen)
        data.copy(chunk, 0)
        totalRead += data.length
        if (data.length < chunkLen) break
      }

      remaining -= chunkLen
      curPos += chunkLen
      bufOff += chunkLen
    }

    return totalRead
  }

  /**
   * Write `len` bytes from `buf` at `pos` into the overlay.
   * Returns the number of bytes written.
   */
  async write(buf: Buffer, len: number, pos: number): Promise<number> {
    await this.#ensureOverlay()
    const { bytesWritten } = await fsWrite(this.#fd!, buf, 0, len, pos)
    const startBlock = Math.floor(pos / COW_BLOCK)
    const endBlock = Math.floor((pos + bytesWritten - 1) / COW_BLOCK)
    for (let b = startBlock; b <= endBlock; b++) this.#writtenBlocks.add(b)
    return bytesWritten
  }

  /**
   * Truncate the overlay to `size` bytes.
   */
  async truncate(size: number): Promise<void> {
    await this.#ensureOverlay()
    await fsFtruncate(this.#fd!, size)
  }

  /**
   * Close the overlay fd (if open) and the underlying source.
   */
  async close(): Promise<void> {
    if (this.#fd !== undefined) {
      await fsClose(this.#fd)
      this.#fd = undefined
    }
    await this.#source.close()
  }

  async #ensureOverlay(): Promise<void> {
    if (this.#fd !== undefined) return
    await nodefs.promises.mkdir(nodepath.dirname(this.#overlayPath), { recursive: true })
    this.#fd = await fsOpen(this.#overlayPath, nodefs.constants.O_CREAT | nodefs.constants.O_RDWR, 0o600)
  }
}
