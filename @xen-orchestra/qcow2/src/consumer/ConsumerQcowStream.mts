import { Disk, DiskBlock } from '@xen-orchestra/disk-transform'
import assert from 'node:assert'
import { Readable } from 'node:stream'
import { CLUSTER_SIZE, QcowLayout } from './QcowLayout.mjs'

/**
 * Extended Readable stream type that may include a length property
 */
type WithLength<T> = T & { length?: number }

/**
 * Generates a valid QCOW2 stream from a Disk.
 */
export class QcowStreamGenerator extends QcowLayout {
  /**
   * Creates a Readable stream with the complete QCOW2 file content.
   *
   * All metadata (header, refcount tables, address tables) is built lazily
   * inside the generator.  Data clusters are streamed in block-index order
   * and must therefore be provided in sorted order by the underlying disk.
   */
  stream(): WithLength<Readable> {
    const disk = this.disk
    const nbAllocatedBlocks = disk.getBlockIndexes().length

    // Compute sizes eagerly so we can set stream.length before the generator runs
    const { size: addressTableSize, nbL1Entries } = this._computeAddressingSpace()
    const { refCountL1Size, refCountL2Size } = this._computeRefCountSize(addressTableSize)

    const metadataSize = CLUSTER_SIZE + refCountL1Size + refCountL2Size + addressTableSize
    const totalSize = metadataSize + nbAllocatedBlocks * CLUSTER_SIZE
    const l1TableOffset = CLUSTER_SIZE + refCountL1Size + refCountL2Size

    const self = this

    async function* generator(): AsyncGenerator<Buffer, void, unknown> {
      const header = self._buildHeader(nbL1Entries, refCountL1Size, refCountL2Size)
      yield header
      assert.strictEqual(header.length, CLUSTER_SIZE, 'header must be exactly one cluster')

      const refCountTables = self._buildRefCountTables(refCountL1Size, refCountL2Size, totalSize / CLUSTER_SIZE)
      yield refCountTables
      assert.strictEqual(refCountTables.length, refCountL1Size + refCountL2Size, 'refcount tables size mismatch')

      const { buffer: addressTables } = self._buildAddressingTables(l1TableOffset, metadataSize)
      yield addressTables
      assert.strictEqual(addressTables.length, addressTableSize, 'address tables size mismatch')

      yield* generateDataClusters(disk, nbAllocatedBlocks)
    }

    const stream = Readable.from(generator(), {
      highWaterMark: 10 * 1024 * 1024,
      objectMode: false,
    }) as WithLength<Readable>
    stream.length = totalSize
    return stream
  }
}

/**
 * Yields one cluster-sized buffer per allocated block in ascending index order.
 * Validates ordering and block completeness.
 */
async function* generateDataClusters(disk: Disk, nbAllocatedBlocks: number): AsyncGenerator<Buffer, void, unknown> {
  let nbGenerated = 0
  let previous = -1
  let truncatedBlock: DiskBlock | null = null

  for await (const { index, data } of disk.diskBlocks()) {
    if (index < previous) {
      throw new Error('Qcow can only be generated from sorted disk')
    }
    previous = index

    if (truncatedBlock !== null) {
      throw new Error(
        `Expecting a ${disk.getBlockSize()} bytes block, got a ${truncatedBlock.data.length}, for index ${truncatedBlock.index}`
      )
    }
    if (data.length < disk.getBlockSize()) {
      truncatedBlock = { data, index }
    }

    yield Buffer.concat([data], disk.getBlockSize())
    nbGenerated++
  }

  assert.strictEqual(nbGenerated, nbAllocatedBlocks, `expected ${nbAllocatedBlocks} blocks, yielded ${nbGenerated}`)
}

/**
 * Creates a QCOW2 stream from a Disk.
 */
export function toQcow2Stream(disk: Disk): Readable {
  return new QcowStreamGenerator(disk).stream()
}
