import { describe, test } from 'node:test'
import { strict as assert } from 'node:assert'
import { randomBytes } from 'node:crypto'
import { inflateSync } from 'node:zlib'
import { DiskBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'

import { ConsumerVmdkStreamOptimized, toVmdkStream, type VmdkLayout } from './ConsumerVmdkStreamOptimized.mjs'
import { GRAIN_DIRECTORY_AT_END, MARKER_EOS, MARKER_FOOTER, SECTOR_SIZE } from '../_constants.mjs'
import { unpackSparseHeader } from '../_header.mjs'

const GRAIN_SIZE = 64 * 1024
const GRAIN_SLOT_SIZE = 129 * SECTOR_SIZE

/** never 0: a grain full of zeros is not written at all in the `streaming` layout */
const fillValue = (index: number) => (index % 255) + 1

class MockDisk extends RandomAccessDisk {
  #blockSize: number
  #virtualSize: number
  #indexes: number[]
  #fill: (index: number) => Buffer

  constructor({
    virtualSize,
    blockSize = GRAIN_SIZE,
    indexes,
    fill = index => Buffer.alloc(blockSize, fillValue(index)),
  }: {
    virtualSize: number
    blockSize?: number
    indexes: number[]
    fill?: (index: number) => Buffer
  }) {
    super()
    this.#blockSize = blockSize
    this.#virtualSize = virtualSize
    this.#indexes = indexes
    this.#fill = fill
  }

  getVirtualSize(): number {
    return this.#virtualSize
  }
  getBlockSize(): number {
    return this.#blockSize
  }
  async init(): Promise<void> {}
  async close(): Promise<void> {}
  isDifferencing(): boolean {
    return false
  }
  getBlockIndexes(): Array<number> {
    return this.#indexes
  }
  hasBlock(index: number): boolean {
    return this.#indexes.includes(index)
  }
  async readBlock(index: number): Promise<DiskBlock> {
    return { index, data: this.#fill(index) }
  }
}

async function collect(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

/** minimal stream optimized reader, used to check what the consumer generates */
function parseVmdk(file: Buffer) {
  const leadingHeader = unpackSparseHeader(file.subarray(0, SECTOR_SIZE))
  const header =
    leadingHeader.grainDirectoryOffsetSectors === GRAIN_DIRECTORY_AT_END
      ? unpackSparseHeader(file.subarray(file.length - 1024, file.length - 512))
      : leadingHeader
  assert.ok(header.grainDirectoryOffsetSectors > 0, 'the footer describes the grain directory')

  const grainSize = header.grainSizeSectors * SECTOR_SIZE
  const nbGrains = Math.ceil(header.capacitySectors / header.grainSizeSectors)
  const nbGrainTables = Math.ceil(nbGrains / header.numGTEsPerGT)
  const raw = Buffer.alloc(header.capacitySectors * SECTOR_SIZE)
  const grainOffsets = new Map<number, number>()

  const readDirectory = (offsetSectors: number) =>
    file.subarray(offsetSectors * SECTOR_SIZE, offsetSectors * SECTOR_SIZE + nbGrainTables * 4)
  const directory = readDirectory(header.grainDirectoryOffsetSectors)
  // both copies of the directory must describe the same disk
  assert.deepEqual(readDirectory(header.rGrainDirectoryOffsetSectors).length, directory.length)

  for (let tableIndex = 0; tableIndex < nbGrainTables; tableIndex++) {
    const tableSector = directory.readUInt32LE(tableIndex * 4)
    assert.ok(tableSector > 0, 'every grain table is written, even the empty ones')
    const table = file.subarray(tableSector * SECTOR_SIZE, tableSector * SECTOR_SIZE + header.numGTEsPerGT * 4)
    for (let entryIndex = 0; entryIndex < header.numGTEsPerGT; entryIndex++) {
      const grainSector = table.readUInt32LE(entryIndex * 4)
      if (grainSector === 0) {
        continue
      }
      const grainIndex = tableIndex * header.numGTEsPerGT + entryIndex
      const offset = grainSector * SECTOR_SIZE
      const lba = Number(file.readBigUInt64LE(offset))
      const compressedLength = file.readUInt32LE(offset + 8)
      assert.equal(lba, grainIndex * header.grainSizeSectors, `lba of the grain ${grainIndex}`)
      const data = inflateSync(file.subarray(offset + 12, offset + 12 + compressedLength))
      assert.equal(data.length, grainSize, `size of the grain ${grainIndex}`)
      data.copy(raw, grainIndex * grainSize)
      grainOffsets.set(grainIndex, offset)
    }
  }

  // the tail: footer marker, copy of the header, end of stream marker
  assert.equal(file.readUInt32LE(file.length - 1536 + 8), 0, 'the footer marker has no size')
  assert.equal(file.readUInt32LE(file.length - 1536 + 12), MARKER_FOOTER)
  assert.equal(file.readUInt32LE(file.length - SECTOR_SIZE + 12), MARKER_EOS)

  return { header, leadingHeader, raw, grainOffsets }
}

async function generate(disk: MockDisk, layout: VmdkLayout) {
  const stream = await toVmdkStream(disk, { layout, diskName: 'test.vmdk' })
  const file = await collect(stream)
  return { file, announcedLength: stream.length, ...parseVmdk(file) }
}

describe('ConsumerVmdkStreamOptimized', { concurrency: 1 }, () => {
  for (const layout of ['streaming', 'seekable'] as VmdkLayout[]) {
    describe(layout, () => {
      test('generates the content of a sparse disk', async () => {
        const disk = new MockDisk({ virtualSize: 64 * GRAIN_SIZE, indexes: [0, 1, 17, 63] })
        const { raw, header } = await generate(disk, layout)

        assert.equal(header.capacitySectors * SECTOR_SIZE, 64 * GRAIN_SIZE)
        for (let i = 0; i < 64; i++) {
          const grain = raw.subarray(i * GRAIN_SIZE, (i + 1) * GRAIN_SIZE)
          const expected = disk.hasBlock(i) ? Buffer.alloc(GRAIN_SIZE, fillValue(i)) : Buffer.alloc(GRAIN_SIZE)
          assert.ok(grain.equals(expected), `grain ${i}`)
        }
      })

      test('handles a disk whose size is not a multiple of the grain size', async () => {
        const virtualSize = 2 * GRAIN_SIZE + SECTOR_SIZE
        const disk = new MockDisk({
          virtualSize,
          indexes: [0, 2],
          fill: index => (index === 2 ? Buffer.alloc(SECTOR_SIZE, 0xaa) : Buffer.alloc(GRAIN_SIZE, 0x55)),
        })
        const { raw } = await generate(disk, layout)

        assert.ok(raw.subarray(0, GRAIN_SIZE).equals(Buffer.alloc(GRAIN_SIZE, 0x55)))
        assert.ok(raw.subarray(GRAIN_SIZE, 2 * GRAIN_SIZE).equals(Buffer.alloc(GRAIN_SIZE)))
        assert.ok(raw.subarray(2 * GRAIN_SIZE, 2 * GRAIN_SIZE + SECTOR_SIZE).equals(Buffer.alloc(SECTOR_SIZE, 0xaa)))
      })

      test('handles a source with blocks bigger than a grain', async () => {
        const disk = new MockDisk({ virtualSize: 8 * 1024 * 1024, blockSize: 2 * 1024 * 1024, indexes: [0, 3] })
        const { raw } = await generate(disk, layout)

        assert.ok(raw.subarray(0, 2 * 1024 * 1024).equals(Buffer.alloc(2 * 1024 * 1024, fillValue(0))))
        assert.ok(raw.subarray(6 * 1024 * 1024).equals(Buffer.alloc(2 * 1024 * 1024, fillValue(3))))
        assert.ok(raw.subarray(2 * 1024 * 1024, 6 * 1024 * 1024).equals(Buffer.alloc(4 * 1024 * 1024)))
      })

      test('handles a source with blocks smaller than a grain', async () => {
        const disk = new MockDisk({ virtualSize: 4 * GRAIN_SIZE, blockSize: GRAIN_SIZE / 2, indexes: [1, 4] })
        const { raw } = await generate(disk, layout)

        assert.ok(raw.subarray(GRAIN_SIZE / 2, GRAIN_SIZE).equals(Buffer.alloc(GRAIN_SIZE / 2, fillValue(1))))
        assert.ok(
          raw
            .subarray(2 * GRAIN_SIZE, 2 * GRAIN_SIZE + GRAIN_SIZE / 2)
            .equals(Buffer.alloc(GRAIN_SIZE / 2, fillValue(4)))
        )
      })

      test('aborts before the stream starts', async () => {
        const disk = new MockDisk({ virtualSize: 4 * GRAIN_SIZE, indexes: [0] })
        const controller = new AbortController()
        controller.abort()
        await assert.rejects(() => toVmdkStream(disk, { layout, signal: controller.signal }).then(collect))
      })

      test('aborts in the middle of the stream', async () => {
        const disk = new MockDisk({
          virtualSize: 1024 * GRAIN_SIZE,
          indexes: Array.from({ length: 1024 }, (_, i) => i),
        })
        const controller = new AbortController()
        const stream = await toVmdkStream(disk, { layout, signal: controller.signal })
        await assert.rejects(async () => {
          let read = 0
          for await (const chunk of stream) {
            read += (chunk as Buffer).length
            if (read > 4 * GRAIN_SIZE) {
              controller.abort()
            }
          }
        })
      })
    })
  }

  test('streaming does not announce a length and keeps the grain directory at the end', async () => {
    const disk = new MockDisk({ virtualSize: 16 * GRAIN_SIZE, indexes: [0, 5] })
    const { announcedLength, leadingHeader, header } = await generate(disk, 'streaming')

    assert.equal(announcedLength, undefined)
    assert.equal(leadingHeader.grainDirectoryOffsetSectors, GRAIN_DIRECTORY_AT_END)
    assert.ok(header.grainDirectoryOffsetSectors > 0)
  })

  test('streaming does not write a grain full of zeros', async () => {
    const blank = new MockDisk({ virtualSize: 16 * GRAIN_SIZE, indexes: [0, 5], fill: () => Buffer.alloc(GRAIN_SIZE) })
    const filled = new MockDisk({ virtualSize: 16 * GRAIN_SIZE, indexes: [0, 5] })

    const blankResult = await generate(blank, 'streaming')
    const filledResult = await generate(filled, 'streaming')

    assert.equal(blankResult.grainOffsets.size, 0, 'no grain is referenced')
    assert.equal(filledResult.grainOffsets.size, 2)
    assert.ok(blankResult.file.length < filledResult.file.length)
  })

  test('seekable announces the exact length and puts every grain at a computable offset', async () => {
    const indexes = [0, 1, 42]
    const disk = new MockDisk({ virtualSize: 64 * GRAIN_SIZE, indexes })
    const { file, announcedLength, leadingHeader, grainOffsets } = await generate(disk, 'seekable')

    assert.equal(announcedLength, file.length)
    assert.ok(leadingHeader.grainDirectoryOffsetSectors > 0, 'the tables are before the data')
    assert.equal(
      leadingHeader.overheadSectors * SECTOR_SIZE + indexes.length * GRAIN_SLOT_SIZE + 3 * SECTOR_SIZE,
      file.length
    )

    indexes.forEach((grainIndex, rank) => {
      assert.equal(grainOffsets.get(grainIndex), leadingHeader.overheadSectors * SECTOR_SIZE + rank * GRAIN_SLOT_SIZE)
    })
  })

  test('seekable fits incompressible grains in their slot and still announces the exact length', async () => {
    const data = new Map<number, Buffer>()
    const indexes = [0, 1, 2, 3]
    const disk = new MockDisk({
      virtualSize: 8 * GRAIN_SIZE,
      indexes,
      fill: index => {
        let buffer = data.get(index)
        if (buffer === undefined) {
          buffer = randomBytes(GRAIN_SIZE)
          data.set(index, buffer)
        }
        return buffer
      },
    })
    const { file, announcedLength, raw } = await generate(disk, 'seekable')

    assert.equal(announcedLength, file.length)
    for (const index of indexes) {
      assert.ok(raw.subarray(index * GRAIN_SIZE, (index + 1) * GRAIN_SIZE).equals(data.get(index)!), `grain ${index}`)
    }
  })

  test('refuses a disk whose blocks are not generated in order', async () => {
    const disk = new MockDisk({ virtualSize: 8 * GRAIN_SIZE, indexes: [3, 1] })
    await assert.rejects(() => generate(disk, 'streaming'), /sorted disk/)
  })

  test('refuses a block generator that disagrees with the block indexes', async () => {
    const disk = new MockDisk({ virtualSize: 8 * GRAIN_SIZE, indexes: [1, 2] })
    // hasBlock() sees one more block than the generator will yield
    disk.getBlockIndexes = () => [1]
    await assert.rejects(() => generate(disk, 'seekable'), /disagree/)
  })

  test('exposes the same result through the class and the function', async () => {
    const disk = new MockDisk({ virtualSize: 4 * GRAIN_SIZE, indexes: [0] })
    const fromClass = await collect(await new ConsumerVmdkStreamOptimized(disk, { layout: 'seekable' }).stream())
    const fromFunction = await collect(
      await toVmdkStream(new MockDisk({ virtualSize: 4 * GRAIN_SIZE, indexes: [0] }), { layout: 'seekable' })
    )
    assert.equal(fromClass.length, fromFunction.length)
  })
})
