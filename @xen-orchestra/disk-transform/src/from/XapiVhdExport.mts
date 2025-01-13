import {
  type DiskBlock,
  type DiskBlockData,
  DiskBlockGenerator,
  type Disposable,
  PortableDifferencingDisk,
  PortableDiskMetadata,
  type Uuid,
} from '../PortableDifferencingDisk.mts'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import { readChunkStrict, skipStrict } from '@vates/read-chunk'
import { BLOCK_UNUSED, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from 'vhd-lib/_constants.js'
import assert from 'node:assert'
import type { Readable } from 'node:stream'

class VhdStreamGenerator extends DiskBlockGenerator {
  #stream: Readable
  #streamOffset = 0
  #busy = false

  hasBlock(index: number): boolean {
    throw new Error('Method not implemented, only iterator is usable from this source')
  }
  readBlock(index: number): Promise<DiskBlockData> {
    throw new Error('Method not implemented, only iterator is usable from this source')
  }
  constructor(stream: Readable) {
    super()
    this.#stream = stream
  }
  async #read(length: number): Promise<Buffer> {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    const data = (await readChunkStrict(this.#stream, length)) as Buffer
    this.#streamOffset += length
    this.#busy = false
    return data
  }
  async #skip(length: number): Promise<void> {
    if (this.#busy) {
      throw new Error("Can't read/skip multiple block in parallel")
    }
    this.#busy = true
    await skipStrict(this.#stream, length)
    this.#streamOffset += length
    this.#busy = false
  }
  async *[Symbol.asyncIterator](): AsyncIterator<DiskBlock> {
    // read the beginning of the stream
    const footer = unpackFooter(await this.#read(FOOTER_SIZE))
    const header = unpackHeader(await this.#read(HEADER_SIZE))
    const batSize = Math.ceil((header.maxTableEntries * 4) / SECTOR_SIZE) * SECTOR_SIZE
    // skip space between header and beginning of the table
    await this.#skip(header.tableOffset - (FOOTER_SIZE + HEADER_SIZE))
    const bat = await this.#read(batSize)

    const blocks = []
    for (let index = 0; index < header.maxTableEntries; index++) {
      const offset = bat.readUInt32BE(index * 4)
      if (offset !== BLOCK_UNUSED) {
        blocks.push({ index, offset: (offset + 1) /* skip block bitmap */ * SECTOR_SIZE })
      }
    }
    // ensure we will generate the blocks in the same order as the stream
    blocks.sort((b1, b2) => b1.offset - b2.offset)

    for (const { offset, index } of blocks) {
      await this.#skip(offset - this.#streamOffset)
      const data = await this.#read(2 * 1024 * 1024)
      yield {
        index,
        data,
      }
    }
  }
}

type XoVdi = {
  uuid: Uuid
  $exportContent: (params: object) => Promise<Readable>
  name_label: string
  name_description: string
  virtual_size: number
}
export class VhdRemote extends PortableDifferencingDisk {
  #vdi: XoVdi
  constructor({ vdi }: { vdi: XoVdi }) {
    super()
    this.#vdi = vdi
  }
  async getMetadata(): Promise<PortableDiskMetadata> {
    const vdi = this.#vdi
    return {
      id: vdi.uuid,
      label: vdi.name_label,
      description: vdi.name_label,
      virtualSize: vdi.virtual_size,
    }
  }

  async getBlockIterator(): Promise<Disposable<DiskBlockGenerator>> {
    const stream = await this.#vdi.$exportContent({ preferNbd: false, format: 'vhd' })
    const generator = new VhdStreamGenerator(stream)
    return {
      value: generator,
      dispose: async function () {
        stream.destroy()
      },
    }
  }
}
