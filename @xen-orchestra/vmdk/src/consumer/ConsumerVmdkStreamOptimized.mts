import { Disk, DiskLargerBlock, DiskSmallerBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import assert from 'node:assert'
import { constants, deflate } from 'node:zlib'
import { promisify } from 'node:util'
import { Readable } from 'node:stream'

import {
  DEFAULT_GRAIN_SIZE_SECTORS,
  DEFAULT_NB_GRAIN_TABLE_ENTRIES,
  GRAIN_DIRECTORY_AT_END,
  GRAIN_MARKER_HEADER_SIZE,
  GRAIN_TABLE_ENTRY_SIZE,
  MARKER_EOS,
  MARKER_FOOTER,
  MARKER_GD,
  MARKER_GT,
  MAX_ADDRESSABLE_FILE_SIZE,
  roundToSector,
  SECTOR_SIZE,
  SPARSE_HEADER_SIZE,
} from '../_constants.mjs'
import { computeGeometry, createStreamOptimizedDescriptor, type VmdkGeometry } from '../_descriptor.mjs'
import { packStreamOptimizedHeader } from '../_header.mjs'

const deflateAsync = promisify(deflate)

const GRAIN_SIZE = DEFAULT_GRAIN_SIZE_SECTORS * SECTOR_SIZE
const GRAIN_TABLE_SIZE = DEFAULT_NB_GRAIN_TABLE_ENTRIES * GRAIN_TABLE_ENTRY_SIZE
const ZERO_GRAIN = Buffer.alloc(GRAIN_SIZE, 0)

/**
 * `deflateBound()` of zlib: deflate expands incompressible data, a 64KiB grain of random data does
 * not fit in 64KiB once compressed.
 */
function compressBound(length: number): number {
  return length + (length >> 12) + (length >> 14) + (length >> 25) + 13
}

/** 129 sectors for a 64KiB grain: the budget of one grain, which no content can exceed */
const GRAIN_SLOT_SIZE = roundToSector(GRAIN_MARKER_HEADER_SIZE + compressBound(GRAIN_SIZE))

export type WithLength<T> = T & { length?: number }

/**
 * Both layouts write the same thing: deflated grains packed one after the other, then the grain
 * tables and the grain directory, then the footer. A stream optimized reader walks the file from
 * marker to marker and refuses one whose tables it meets first.
 *
 * - `streaming` (default): nothing else. The output is as small as the content compresses to, but
 *   its size is only known once it is fully generated, so the stream carries no `length`.
 * - `withLength`: the data is padded up to the budget of one fixed size slot per allocated grain,
 *   which is an upper bound whatever the content compresses to. The size of the output is therefore
 *   known before the first byte is generated, which is what lets it be streamed to a consumer
 *   demanding a `Content-Length` - vSphere's `HttpNfcLease` among them, which refuses a chunked
 *   upload. It weights the uncompressed size of the allocated grains, plus 0.78%.
 */
export type VmdkLayout = 'streaming' | 'withLength'

export interface ConsumerVmdkStreamOptimizedOptions {
  /** name of the extent, as written in the descriptor */
  readonly diskName?: string
  /** defaults to a geometry computed from the virtual size */
  readonly geometry?: VmdkGeometry
  readonly layout?: VmdkLayout
}

/** everything the generator needs, computed before the first byte is emitted */
interface GenerationContext {
  readonly withLength: boolean
  readonly capacitySectors: number
  readonly nbTotalGrains: number
  readonly nbGrainTables: number
  readonly grainDirectorySize: number
  readonly descriptor: Buffer
  /** end of the descriptor, where the data starts */
  readonly afterDescriptor: number
  readonly tablesSize: number
  readonly tailSize: number
  readonly overheadSectors: number
  readonly expectedStreamLength?: number
  /** allocated grains of the disk, only built for the `withLength` layout */
  readonly bitmap?: Uint8Array
  /** grain tables of a `streaming` disk, filled while the grains are generated */
  readonly grainTables: Map<number, Buffer>
  /** where the two grain directories ended up, the copy of the header has to point to them */
  readonly emitted: { gd?: number; rgd?: number }
}

/**
 * Generates a stream optimized VMDK from a Disk.
 *
 * The layouts are described in ../../docs/vmdk.md
 */
export class ConsumerVmdkStreamOptimized {
  #disk: Disk
  #diskName: string
  #geometry: VmdkGeometry | undefined
  #layout: VmdkLayout
  #offset = 0

  constructor(
    disk: Disk,
    { diskName = 'disk.vmdk', geometry, layout = 'streaming' }: ConsumerVmdkStreamOptimizedOptions = {}
  ) {
    if (disk.getBlockSize() < GRAIN_SIZE) {
      if (!(disk instanceof RandomAccessDisk)) {
        throw new Error(`Can't group blocks of ${disk.getBlockSize()} bytes into grains without random access`)
      }
      this.#disk = new DiskLargerBlock(disk, GRAIN_SIZE)
    } else if (disk.getBlockSize() > GRAIN_SIZE) {
      this.#disk = new DiskSmallerBlock(disk, GRAIN_SIZE)
    } else {
      this.#disk = disk
    }
    assert.strictEqual(this.#disk.getBlockSize(), GRAIN_SIZE)
    this.#diskName = diskName
    this.#geometry = geometry
    this.#layout = layout
  }

  /**
   * Tracks the offset and yields the buffer. A VMDK is a sequence of sectors: every buffer yielded
   * by the generator is a whole number of sectors.
   */
  *#trackAndYield(buffer: Buffer): Generator<Buffer, void, unknown> {
    assert.strictEqual(buffer.length % SECTOR_SIZE, 0, 'a VMDK is a sequence of sectors')
    this.#offset += buffer.length
    yield buffer
  }

  #toSectorOffset(offset: number): number {
    assert.ok(
      offset <= MAX_ADDRESSABLE_FILE_SIZE,
      `a VMDK addresses its grains with 32 bits sector offsets, ${offset} is past the ${MAX_ADDRESSABLE_FILE_SIZE} bytes limit`
    )
    assert.strictEqual(offset % SECTOR_SIZE, 0)
    return offset / SECTOR_SIZE
  }

  /**
   * Scans every grain index once to build the presence bitmap and the allocated grain count, used
   * by the `withLength` layout to compute the tables - and the length of the output - before
   * generating anything. Yields back to the event loop periodically so that a huge virtual disk
   * does not block Node for seconds at a stretch, like `ConsumerQcowStream` does.
   */
  async #buildGrainPresenceIndex(
    nbTotalGrains: number,
    signal?: AbortSignal
  ): Promise<{ bitmap: Uint8Array; nbAllocatedGrains: number }> {
    const disk = this.#disk
    const bitmap = new Uint8Array(Math.ceil(nbTotalGrains / 8))
    let nbAllocatedGrains = 0

    let lastYield = process.hrtime.bigint()
    for (let i = 0; i < nbTotalGrains; i++) {
      if (disk.hasBlock(i)) {
        bitmap[i >> 3] |= 1 << (i & 7)
        nbAllocatedGrains++
      }
      // check the clock every 65536 grains: cheap enough to not affect throughput, frequent enough
      // to keep a single stretch of synchronous work under ~15ms
      if ((i & 0xffff) === 0) {
        const now = process.hrtime.bigint()
        if (Number(now - lastYield) / 1e6 > 15) {
          await new Promise(resolve => setImmediate(resolve))
          lastYield = process.hrtime.bigint()
          signal?.throwIfAborted()
        }
      }
    }

    return { bitmap, nbAllocatedGrains }
  }

  /**
   * A metadata marker is a whole sector: a null value, a null size - which is what distinguishes it
   * from a grain marker - and the type of the section that follows.
   */
  #createMetadataMarker(type: number): Buffer {
    const buffer = Buffer.alloc(SECTOR_SIZE)
    buffer.writeBigUInt64LE(0n, 0)
    buffer.writeUInt32LE(0, 8)
    buffer.writeUInt32LE(type, 12)
    return buffer
  }

  async #createGrain(grainIndex: number, data: Buffer): Promise<Buffer> {
    assert.strictEqual(data.length, GRAIN_SIZE)
    const compressed = await deflateAsync(data, { level: constants.Z_BEST_SPEED })
    const buffer = Buffer.alloc(roundToSector(GRAIN_MARKER_HEADER_SIZE + compressed.length))
    // the logical address of the grain in the virtual disk, in sectors
    buffer.writeBigUInt64LE(BigInt(grainIndex * DEFAULT_GRAIN_SIZE_SECTORS), 0)
    buffer.writeUInt32LE(compressed.length, 8)
    compressed.copy(buffer, GRAIN_MARKER_HEADER_SIZE)
    return buffer
  }

  #createGrainDirectory(nbGrainTables: number, firstGrainTableSector: number): Buffer {
    const buffer = Buffer.alloc(roundToSector(nbGrainTables * GRAIN_TABLE_ENTRY_SIZE))
    const sectorsPerGrainTable = GRAIN_TABLE_SIZE / SECTOR_SIZE
    for (let i = 0; i < nbGrainTables; i++) {
      buffer.writeUInt32LE(firstGrainTableSector + i * sectorsPerGrainTable, i * GRAIN_TABLE_ENTRY_SIZE)
    }
    return buffer
  }

  #packHeader(context: GenerationContext, { gd, rgd }: { gd: number; rgd: number }): Buffer {
    return packStreamOptimizedHeader({
      capacitySectors: context.capacitySectors,
      grainSizeSectors: DEFAULT_GRAIN_SIZE_SECTORS,
      descriptorSizeSectors: context.descriptor.length / SECTOR_SIZE,
      numGTEsPerGT: DEFAULT_NB_GRAIN_TABLE_ENTRIES,
      grainDirectoryOffsetSectors: gd,
      rGrainDirectoryOffsetSectors: rgd,
      overheadSectors: context.overheadSectors,
    })
  }

  #hasGrain(context: GenerationContext, index: number): boolean {
    const bitmap = context.bitmap!
    return (bitmap[index >> 3] & (1 << (index & 7))) !== 0
  }

  *#yieldGrainTables(context: GenerationContext): Generator<Buffer, void, unknown> {
    const empty = Buffer.alloc(GRAIN_TABLE_SIZE)
    for (let i = 0; i < context.nbGrainTables; i++) {
      yield* this.#trackAndYield(context.grainTables.get(i) ?? empty)
    }
  }

  /**
   * Fills the gap between the packed grains and the tables, so that the file reaches the length
   * announced before the first byte was generated.
   */
  *#yieldPadding(length: number): Generator<Buffer, void, unknown> {
    assert.ok(length >= 0, `the grains are ${-length} bytes longer than the announced length`)
    const chunk = Buffer.alloc(Math.min(length, 1024 * 1024))
    let remaining = length
    while (remaining > chunk.length) {
      yield* this.#trackAndYield(chunk)
      remaining -= chunk.length
    }
    if (remaining > 0) {
      yield* this.#trackAndYield(Buffer.alloc(remaining))
    }
  }

  *#yieldTables(context: GenerationContext): Generator<Buffer, void, unknown> {
    for (let copy = 0; copy < 2; copy++) {
      yield* this.#trackAndYield(this.#createMetadataMarker(MARKER_GT))
      const firstGrainTableSector = this.#toSectorOffset(this.#offset)
      yield* this.#yieldGrainTables(context)
      yield* this.#trackAndYield(this.#createMetadataMarker(MARKER_GD))
      const directorySector = this.#toSectorOffset(this.#offset)
      yield* this.#trackAndYield(this.#createGrainDirectory(context.nbGrainTables, firstGrainTableSector))
      // the first copy is the redundant one
      if (copy === 0) {
        context.emitted.rgd = directorySector
      } else {
        context.emitted.gd = directorySector
      }
    }
  }

  async *#yieldGrains(context: GenerationContext, signal?: AbortSignal): AsyncGenerator<Buffer, void, unknown> {
    const { withLength } = context
    // index of the next allocated grain, only used by the `withLength` layout to check that the block
    // generator agrees with the block indexes the presence index was built from
    let cursor = 0
    const nextAllocatedGrain = () => {
      while (cursor < context.nbTotalGrains && !this.#hasGrain(context, cursor)) {
        cursor++
      }
      return cursor
    }
    let previous = -1
    let truncated = false

    for await (const { index, data } of this.#disk.diskBlocks()) {
      signal?.throwIfAborted()
      if (index <= previous) {
        throw new Error(`a VMDK can only be generated from a sorted disk, got ${index} after ${previous}`)
      }
      previous = index
      if (truncated) {
        throw new Error(`only the last block of a disk can be shorter than ${GRAIN_SIZE} bytes`)
      }
      if (data.length > GRAIN_SIZE) {
        throw new Error(`expecting a block of ${GRAIN_SIZE} bytes, got ${data.length} for index ${index}`)
      }
      if (data.length < GRAIN_SIZE) {
        truncated = true
      }
      const grain = data.length === GRAIN_SIZE ? data : Buffer.concat([data], GRAIN_SIZE)

      if (withLength) {
        const expected = nextAllocatedGrain()
        if (index !== expected) {
          throw new Error(
            `expecting the grain ${expected}, got ${index}: the disk block indexes and its block generator disagree`
          )
        }
        cursor++
      }
      if (!grain.equals(ZERO_GRAIN)) {
        // a grain full of zeros is simply not referenced by the grain table
        const tableIndex = Math.floor(index / DEFAULT_NB_GRAIN_TABLE_ENTRIES)
        let table = context.grainTables.get(tableIndex)
        if (table === undefined) {
          table = Buffer.alloc(GRAIN_TABLE_SIZE)
          context.grainTables.set(tableIndex, table)
        }
        table.writeUInt32LE(
          this.#toSectorOffset(this.#offset),
          (index % DEFAULT_NB_GRAIN_TABLE_ENTRIES) * GRAIN_TABLE_ENTRY_SIZE
        )
        yield* this.#trackAndYield(await this.#createGrain(index, grain))
      }
    }

    if (withLength) {
      const remaining = nextAllocatedGrain()
      if (remaining !== context.nbTotalGrains) {
        throw new Error(
          `the grain ${remaining} is allocated but was not generated: the disk block indexes and its block generator disagree`
        )
      }
    }
  }

  async *#generate(context: GenerationContext, signal?: AbortSignal): AsyncGenerator<Buffer, void, unknown> {
    const { withLength } = context
    signal?.throwIfAborted()
    // the tables come after the data in both layouts, so a reader has to look for the copy of the
    // header at `fileSize - 1024` to know where they are. Writing them first is what a stream
    // optimized reader refuses: ESXi 8 answers `Error on read` on such a file, even though every
    // grain reaches the datastore and `qemu-img` reads it back.
    yield* this.#trackAndYield(this.#packHeader(context, { gd: GRAIN_DIRECTORY_AT_END, rgd: 0 }))
    yield* this.#trackAndYield(context.descriptor)
    assert.strictEqual(this.#offset, context.afterDescriptor, 'descriptor aligned')

    yield* this.#yieldGrains(context, signal)
    if (withLength) {
      const beforeTables = context.expectedStreamLength! - context.tablesSize - context.tailSize
      yield* this.#yieldPadding(beforeTables - this.#offset)
      assert.strictEqual(this.#offset, beforeTables, 'grains aligned')
    }
    yield* this.#yieldTables(context)

    yield* this.#trackAndYield(this.#createMetadataMarker(MARKER_FOOTER))
    yield* this.#trackAndYield(this.#packHeader(context, { gd: context.emitted.gd!, rgd: context.emitted.rgd! }))
    yield* this.#trackAndYield(this.#createMetadataMarker(MARKER_EOS))

    if (context.expectedStreamLength !== undefined) {
      assert.strictEqual(this.#offset, context.expectedStreamLength, 'stream length')
    }
  }

  async stream(signal?: AbortSignal): Promise<WithLength<Readable>> {
    const disk = this.#disk
    const withLength = this.#layout === 'withLength'

    const virtualSize = disk.getVirtualSize()
    const capacitySectors = Math.ceil(virtualSize / SECTOR_SIZE)
    const nbTotalGrains = Math.ceil(virtualSize / GRAIN_SIZE)
    const nbGrainTables = Math.ceil(nbTotalGrains / DEFAULT_NB_GRAIN_TABLE_ENTRIES)
    const grainDirectorySize = roundToSector(nbGrainTables * GRAIN_TABLE_ENTRY_SIZE)

    const descriptor = createStreamOptimizedDescriptor({
      capacitySectors,
      diskName: this.#diskName,
      geometry: this.#geometry ?? computeGeometry(virtualSize),
    })

    // the tables are always written as: marker, grain tables, marker, grain directory - twice, the
    // first copy being the redundant one. Only their position changes with the layout.
    const tablesSize = 2 * (SECTOR_SIZE + nbGrainTables * GRAIN_TABLE_SIZE + SECTOR_SIZE + grainDirectorySize)
    // marker, copy of the header, end of stream marker
    const tailSize = 3 * SECTOR_SIZE

    const afterDescriptor = SPARSE_HEADER_SIZE + descriptor.length

    let bitmap: Uint8Array | undefined
    let expectedStreamLength: number | undefined
    if (withLength) {
      const index = await this.#buildGrainPresenceIndex(nbTotalGrains, signal)
      bitmap = index.bitmap
      expectedStreamLength = afterDescriptor + tablesSize + index.nbAllocatedGrains * GRAIN_SLOT_SIZE + tailSize
      assert.ok(
        expectedStreamLength <= MAX_ADDRESSABLE_FILE_SIZE,
        `a VMDK addresses its grains with 32 bits sector offsets, a ${expectedStreamLength} bytes file is past the ${MAX_ADDRESSABLE_FILE_SIZE} bytes limit`
      )
    }

    const context: GenerationContext = {
      afterDescriptor,
      bitmap,
      capacitySectors,
      descriptor,
      emitted: {},
      expectedStreamLength,
      grainDirectorySize,
      grainTables: new Map(),
      nbGrainTables,
      nbTotalGrains,
      overheadSectors: afterDescriptor / SECTOR_SIZE,
      withLength,
      tablesSize,
      tailSize,
    }

    const stream = Readable.from(this.#generate(context, signal), {
      highWaterMark: 10 * 1024 * 1024,
      objectMode: false,
    }) as WithLength<Readable>
    stream.length = expectedStreamLength
    return stream
  }
}

/**
 * Creates a stream optimized VMDK stream from a Disk
 *
 * @returns a Readable of the VMDK data. With the `withLength` layout, `length` is the exact size of
 * the generated file; with the default `streaming` layout it is left undefined, the size of the
 * compressed grains is only known once they are generated.
 */
export async function toVmdkStream(
  disk: Disk,
  { signal, ...opts }: ConsumerVmdkStreamOptimizedOptions & { signal?: AbortSignal } = {}
): Promise<WithLength<Readable>> {
  return await new ConsumerVmdkStreamOptimized(disk, opts).stream(signal)
}
