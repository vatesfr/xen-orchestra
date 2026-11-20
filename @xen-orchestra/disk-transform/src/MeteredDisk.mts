import { Disk, DiskBlock } from './Disk.mjs'
import { DiskPassthrough } from './DiskPassthrough.mjs'

export type ReadMeter = {
  /** called for each block read from the source */
  onRead(length: number): void
  /** called once, when the source is exhausted, closed early by its consumer or failed (`error`) */
  onEnd(error?: unknown): void
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
    async function* meteredGenerator(): AsyncGenerator<DiskBlock> {
      let error: unknown
      try {
        for await (const block of generator) {
          meter.onRead(block.data.length)
          yield block
        }
      } catch (err) {
        error = err
        throw err
      } finally {
        meter.onEnd(error)
      }
    }
    return meteredGenerator()
  }
}
