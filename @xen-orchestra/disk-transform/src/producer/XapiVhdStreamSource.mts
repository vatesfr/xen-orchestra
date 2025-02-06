import { PortableDisk, type DiskBlock } from '../PortableDisk.mts'
import { readChunkStrict, skipStrict } from '@vates/read-chunk'

import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { BLOCK_UNUSED, DISK_TYPES, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from 'vhd-lib/_constants.js'
import { Readable } from 'node:stream'
import assert from 'node:assert'

export class XapiVhdStreamSource extends PortableDisk {
  #vhdStream: Readable
  #busy = false
  #streamOffset = 0

  #blocks: Array<{ index: number; offset: number }> = []
  #blockSet = new Set<number>()
  get blocks() {
    return this.#blocks
  }

  #initDone = false

  #xapi
  get xapi() {
    return this.#xapi
  }

  #ref: string
  get ref() {
    return this.#ref
  }
  #baseRef: string
  get baseRef() {
    return this.#baseRef
  }

  #isDifferencing: boolean

  constructor({ vdiRef, baseRef, xapi }) {
    super()
    this.#ref = vdiRef
    this.#baseRef = baseRef
    this.#xapi = xapi
  }
  async #read(length: number): Promise<Buffer> {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    const data = (await readChunkStrict(this.#vhdStream, length)) as Buffer
    this.#streamOffset += length
    this.#busy = false
    return data
  }

  async #skip(length: number): Promise<void> {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    await skipStrict(this.#vhdStream, length)
    this.#streamOffset += length
    this.#busy = false
  }

  async #getExportStream(): Promise<Readable> {
    // get the stream with nbd or any magic
    const stream = await this.#xapi.VDI_exportContent(this.ref, {
      baseRef: this.#baseRef,
      format: 'vhd',
      preferNbd: false,
    })
    return Readable.from(stream, { highWaterMark: 5 * 1024 * 1024, objectMode: false })
  }

  async init(): Promise<void> {
    this.#vhdStream = await this.#getExportStream()
    const footer = unpackFooter(await this.#read(FOOTER_SIZE))
    this.#isDifferencing = footer.diskType === DISK_TYPES.DIFFERENCING
    this.virtualSize = footer.currentSize
    const header = unpackHeader(await this.#read(HEADER_SIZE))
    this.blockSize = header.blockSize
    const batSize = Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
    // skip space between header and beginning of the table
    console.log({ header, already: FOOTER_SIZE + HEADER_SIZE })
    await this.#skip(header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
    const bat = await this.#read(batSize)
    const blocks = []
    for (let index = 0; index < header.maxTableEntries; index++) {
      const offset = bat.readUInt32BE(index * 4)
      if (offset !== BLOCK_UNUSED) {
        blocks.push({ index, offset: (offset + 1) /* skip block bitmap */ * SECTOR_SIZE })
        this.#blockSet.add(index)
      }
    }
    // ensure we will generate the blocks in the same order as the stream
    blocks.sort((b1, b2) => b1.offset - b2.offset)
    this.#blocks = blocks
    this.#initDone = true
    console.log('init done')
  }

  async close() {
    assert.strictEqual(this.#initDone, true, 'init must be done to call close')
    this.#vhdStream?.destroy()
  }

  getBlockIndexes(): Array<number> {
    assert.strictEqual(this.#initDone, true, 'init must be done to call getBlockIndexes')
    return this.#blocks.map(({ index }) => index)
  }

  hasBlock(index: number): boolean {
    assert.strictEqual(this.#initDone, true, 'init must be done to call hasBlock')
    return this.#blockSet.has(index)
  }

  async *buildDiskBlockGenerator(): AsyncGenerator<DiskBlock> {
    assert.strictEqual(this.#initDone, true, 'init must be done to call buildDiskGenerator')
    const blockIndexes = this.#blocks
    for (const { offset, index } of blockIndexes) {
      await this.#skip(offset - this.#streamOffset) // this will skip the bitmap
      const data = await this.#read(2 * 1024 * 1024)

      // if this fails that means a error from consumer
      yield {
        index,
        data,
      }
    }
    // @todo read the end to check the end footer and ensure the stream is complete
  }

  openParent(): Promise<PortableDisk> {
    throw new Error('Method openParent not implemented for xapi stream')
  }
  isDifferencing(): boolean {
    return this.#isDifferencing
  }
}
