import { Disk, DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export type ReadMeter = {
  /** called once, before the first block, with the number of bytes the source will generate */
  onStart(result: { bytesToRead: number }): void
  /** called for each block read from the source */
  onRead(length: number): void
  /** called once, when the source is exhausted (`isComplete`), closed early by its consumer or failed (`error`) */
  onEnd(result: { isComplete: boolean; error?: unknown }): void
}

/**
 * Reports the bytes read from the source, and the end of its reading
 *
 * The meter is called from the async context of the consumer pulling the next block, which may be any of the
 * forks of a SynchronizedDisk: it must not rely on this context
 */
export class MeteredDisk extends DiskPassthrough {
  #meter: ReadMeter

  constructor(source: Disk, meter: ReadMeter) {
    super(source)
    this.#meter = meter
  }

  async buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> {
    const generator = await this.source.buildDiskBlockGenerator()
    const meter = this.#meter
    // the last block may be truncated to the virtual size
    const bytesToRead = Math.min(this.getBlockIndexesCount() * this.getBlockSize(), this.getVirtualSize())
    async function* meteredGenerator(): AsyncGenerator<DiskBlock> {
      let isComplete = false
      let isStarted = false
      let error: unknown
      try {
        for await (const block of generator) {
          if (!isStarted) {
            isStarted = true
            meter.onStart({ bytesToRead })
          }
          meter.onRead(block.data.length)
          yield block
        }
        isComplete = true
      } catch (err) {
        error = err
        throw err
      } finally {
        meter.onEnd({ isComplete, error })
      }
    }
    return meteredGenerator()
  }
}
