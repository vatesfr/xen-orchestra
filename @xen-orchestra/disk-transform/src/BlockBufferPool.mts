/**
 * Recycles the memory of the blocks: allocating a new 2MB Buffer per block makes V8 run a major GC dozens of
 * times per second at high throughput (each Buffer is external memory), whereas reusing them keeps it idle.
 *
 * Each pooled buffer is `prefix` followed by `blockSize` bytes, `prefix` is copied once at allocation:
 * consumers needing to prepend this exact header (like a VHD block bitmap) can use the whole buffer without
 * copying the data, see DiskBlock.prefixed.
 *
 * The pool never blocks nor fails: when no buffer is free, a new one is allocated, and buffers which are never
 * released are simply garbage collected.
 */
export class BlockBufferPool {
  #blockSize: number
  #free: Buffer[] = []
  #maxFree: number
  #prefix: Buffer

  #allocated = 0
  #reused = 0

  get allocated(): number {
    return this.#allocated
  }
  get reused(): number {
    return this.#reused
  }
  get blockSize(): number {
    return this.#blockSize
  }
  get prefixLength(): number {
    return this.#prefix.length
  }

  /**
   * @param params.blockSize length of the data part of the buffers
   * @param params.prefix bytes stored before the data of each buffer
   * @param params.maxFree maximum number of buffers kept for reuse, the others are left to the GC
   */
  constructor({
    blockSize,
    prefix = Buffer.alloc(0),
    maxFree = 32,
  }: {
    blockSize: number
    prefix?: Buffer
    maxFree?: number
  }) {
    this.#blockSize = blockSize
    this.#maxFree = maxFree
    this.#prefix = Buffer.from(prefix)
  }

  /**
   * @returns `buffer` is the whole memory (prefix + data), `data` is a view on its last `blockSize` bytes,
   * `release` gives it back to the pool (only the first call is taken into account)
   */
  acquire(): { buffer: Buffer; data: Buffer; release: () => void } {
    let buffer = this.#free.pop()
    if (buffer === undefined) {
      // not from the shared Buffer pool of Node, this memory is ours
      buffer = Buffer.allocUnsafeSlow(this.#prefix.length + this.#blockSize)
      this.#prefix.copy(buffer, 0)
      this.#allocated++
    } else {
      this.#reused++
    }
    const acquired = buffer
    let released = false
    return {
      buffer: acquired,
      data: acquired.subarray(this.#prefix.length),
      release: () => {
        // a double release would hand the same memory to two users
        if (released) {
          return
        }
        released = true
        if (this.#free.length < this.#maxFree) {
          this.#free.push(acquired)
        }
      },
    }
  }
}
