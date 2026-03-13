import { DiskBlock, RandomAccessDisk } from './Disk.mjs'
import { RandomDiskPassthrough } from './DiskPassthrough.mjs'

export class ReadAhead extends RandomDiskPassthrough {
  #maxNumber: number
  #maxPercent: number
  constructor(source: RandomAccessDisk, { maxNumber = 10, maxPercent = 10 } = {}) {
    super(source)
    this.#maxNumber = maxNumber
    this.#maxPercent = maxPercent
  }
  openSource(): Promise<RandomAccessDisk> {
    throw new Error('Method not implemented.')
  }
  buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    const self = this
    const blockIndexes = this.getBlockIndexes()
    const maxNumber = this.#maxNumber
    const maxPercent = this.#maxPercent

    async function* generator(): AsyncGenerator<DiskBlock> {
      const preloaded = []
      // between 1 and 10 or at most 10% of the blocks
      const PRELOAD_SIZE = Math.max(Math.min(Math.floor((blockIndexes.length * maxPercent) / 100), maxNumber), 1)

      let counter = 0
      try {
        for (const index of blockIndexes) {
          counter++
          await self.progressHandler?.setProgress(counter / blockIndexes.length)
          if (preloaded.length < PRELOAD_SIZE) {
            const p = self.source.readBlock(index)
            p.catch(() => {}) // suppress unhandled rejection; error still surfaces when awaited via shift()
            preloaded.push(p)
          }
          if (preloaded.length === PRELOAD_SIZE) {
            const next = (await preloaded.shift())!
            yield next
          }
        }
        while (preloaded.length > 0) {
          const next = (await preloaded.shift())!
          yield next
        }
      } finally {
        await Promise.allSettled(preloaded) // wait for in-flight I/O & release resources
        preloaded.length = 0
        await self.progressHandler?.done()
      }
    }
    return generator()
  }
}
