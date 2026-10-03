/**
 * Recycles the memory of the blocks: allocating a new 2MB Buffer per block makes V8 run a major GC dozens of
 * times per second at high throughput (each Buffer is external memory), whereas reusing them keeps it idle.
 *
 * The pool never blocks nor fails: when no buffer is free, a new one is allocated, and buffers which are never
 * released are simply garbage collected.
 */
export class BlockBufferPool {
  #blockSize: number
  #free: Buffer[] = []
  #maxFree: number

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

  /**
   * @param params.blockSize length of the buffers
   * @param params.maxFree maximum number of buffers kept for reuse, the others are left to the GC
   */
  constructor({ blockSize, maxFree = 32 }: { blockSize: number; maxFree?: number }) {
    this.#blockSize = blockSize
    this.#maxFree = maxFree
  }

  /**
   * @returns `data` is a `blockSize` bytes buffer, `release` gives it back to the pool (only the first call is
   * taken into account)
   */
  acquire(): { data: Buffer; release: () => void } {
    let data = this.#free.pop()
    if (data === undefined) {
      // not from the shared Buffer pool of Node, this memory is ours
      data = Buffer.allocUnsafeSlow(this.#blockSize)
      this.#allocated++
    } else {
      this.#reused++
    }
    const acquired = data
    let released = false
    return {
      data: acquired,
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
