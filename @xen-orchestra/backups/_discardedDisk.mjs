import { DiskPassthrough } from '@xen-orchestra/disk-transform'
import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:backups:discardedDisk')

// BENCHMARK ONLY: with XO_BENCH_DISCARD_BLOCKS=1, the disks are read entirely from their source then their
// blocks are dropped, so the read path can be measured without being limited by the remote.
// The backups written are VALID BUT EMPTY VHDs (no block in the BAT): use a throwaway remote.
export const DISCARD_BLOCKS = process.env.XO_BENCH_DISCARD_BLOCKS === '1'

/**
 * Exposes no block while reading the whole source, so that any consumer writes a consistent empty VHD
 */
export class DiscardedDisk extends DiskPassthrough {
  #bytesRead = 0

  get bytesRead() {
    return this.#bytesRead
  }

  getBlockIndexes() {
    return []
  }

  getBlockIndexesCount() {
    return 0
  }

  hasBlock() {
    return false
  }

  async *diskBlocks() {
    warn('XO_BENCH_DISCARD_BLOCKS is set: the blocks of this disk are read then dropped, the backup is EMPTY')
    for await (const block of this.source.diskBlocks()) {
      this.#bytesRead += block.data.length
      block.release?.()
    }
  }
}
