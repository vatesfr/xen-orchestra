import { VhdAbstract } from 'vhd-lib'
import { unpackFooter, unpackHeader } from 'vhd-lib/Vhd/_utils.js'
import _computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import {
  DEFAULT_BLOCK_SIZE as DEFAULT_VHD_BLOCK_SIZE,
  DISK_TYPES,
  FOOTER_SIZE,
  SECTOR_SIZE,
} from 'vhd-lib/_constants.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'
import { unpackHeader as unpackVmdkHeader } from 'xo-vmdk-to-vhd/dist/definitions.js'

import zlib from 'zlib'
import assert from 'node:assert'

export default class VhdEsxiStreamOptimized extends VhdAbstract {
  #handler
  #vmdkHeader
  #l1table
  #l2tables
  #path

  get header() {
    // a grain directory entry contains the address of a grain table
    // a grain table can addresses at most 4096 grain of 512 Bytes of data
    return unpackHeader(
      createHeader(Math.ceil((this.#vmdkHeader.capacitySectors * SECTOR_SIZE) / DEFAULT_VHD_BLOCK_SIZE))
    )
  }

  get footer() {
    const size = this.#vmdkHeader.capacitySectors * SECTOR_SIZE
    const geometry = _computeGeometryForSize(size)
    return unpackFooter(createFooter(size, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, DISK_TYPES.DYNAMIC))
  }

  constructor(handler, path) {
    super()
    this.#handler = handler
    this.#path = path
  }
  async readHeaderAndFooter() {
    // complete header is at the end of the file
    // the header at the beginning don't have the L1 table position
    const size = await this.#handler.getSize(this.#path)
    const headerBuffer = await this.#read(size - 1024, 1024)
    this.#vmdkHeader = unpackVmdkHeader(headerBuffer)
  }
  async readBlockAllocationTable() {
    const l1entries = Math.floor(
      (this.#vmdkHeader.capacitySectors + this.#vmdkHeader.l1EntrySectors - 1) / this.#vmdkHeader.l1EntrySectors
    )
    const buffer = await this.#read(this.#vmdkHeader.grainDirectoryOffsetSectors * SECTOR_SIZE, l1entries * 4)
    this.#l1table = []
    for (let grainTableIndex = 0; grainTableIndex < l1entries; grainTableIndex++) {
      this.#l1table.push(buffer.readUInt32LE(grainTableIndex * 4))
    }
    // also read all the l2 table since we must be able to check contains synchronously
    this.#l2tables = []
    for (let grainTableIndex = 0; grainTableIndex < l1entries; grainTableIndex++) {
      this.#l2tables[grainTableIndex] = await this.#getGrainTable(grainTableIndex)
    }
  }
  async #read(start, length) {
    const buffer = Buffer.alloc(length, 0)
    await this.#handler.read(this.#path, buffer, start)
    return buffer
  }
  async #getGrainTable(grainTableIndex) {
    const l1Entry = this.#l1table[grainTableIndex]
    if (l1Entry === 0) {
      return
    }
    const l2ByteSize = this.#vmdkHeader.numGTEsPerGT * 4
    const buffer = await this.#read(l1Entry * SECTOR_SIZE, l2ByteSize)
    const table = []
    for (let i = 0; i < this.#vmdkHeader.numGTEsPerGT; i++) {
      table.push(buffer.readUInt32LE(i * 4))
    }
    return table
  }

  async #getGrainData(grainTableIndex, grainEntryIndex) {
    const grainTable = this.#l2tables[grainTableIndex]
    if (grainTable === undefined) {
      return
    }
    const offset = grainTable[grainEntryIndex]
    if (offset === 0) {
      return
    }
    const dataSizeBuffer = await this.#read(offset * SECTOR_SIZE + 8, 4)
    const dataSize = dataSizeBuffer.readUInt32LE(0)
    const buffer = await this.#read(offset * SECTOR_SIZE + 12, dataSize)
    const inflated = zlib.inflateSync(buffer)
    assert(inflated.length, 64 * 1024)
    return inflated
  }
  containsBlock(blockId) {
    const nbBlocksPerGT = this.#getNumberOfBlockPerGrainTable()

    const grainTableIndex = Math.floor(blockId / nbBlocksPerGT)
    const length = this.#getNumberOfGrainPerBlock()
    const grainTableEntryIndexStart = (blockId % nbBlocksPerGT) * length

    const grainTable = this.#l2tables[grainTableIndex]
    if (!grainTable) {
      return false
    }

    for (let i = 0; i < length; i++) {
      const grainEntryIndex = grainTableEntryIndexStart + i
      if (grainTable[grainEntryIndex] !== 0) {
        return true
      }
    }
    return false
  }

  #getGrainSize() {
    return this.#vmdkHeader.grainSizeSectors * SECTOR_SIZE
  }
  #getNumberOfBlockPerGrainTable() {
    return (this.#vmdkHeader.numGTEsPerGT * this.#getGrainSize()) / DEFAULT_VHD_BLOCK_SIZE
  }
  #getNumberOfGrainPerBlock() {
    return DEFAULT_VHD_BLOCK_SIZE / this.#getGrainSize()
  }
  async readBlock(blockId) {
    // 1 grain = 128  sectors = 64KB
    // 512 grain per grain table => 32MB per grain table, 16 vhd blocks
    const nbBlocksPerGT = this.#getNumberOfBlockPerGrainTable()
    const buffer = Buffer.alloc(512 /* bitmap */ + DEFAULT_VHD_BLOCK_SIZE /* data */, 0)

    const grainTableIndex = Math.floor(blockId / nbBlocksPerGT)
    const length = this.#getNumberOfGrainPerBlock()
    const grainTableEntryIndexStart = (blockId % nbBlocksPerGT) * length
    for (let i = 0; i < length; i++) {
      const grainEntryIndex = grainTableEntryIndexStart + i
      const grain = await this.#getGrainData(grainTableIndex, grainEntryIndex)
      if (grain !== undefined) {
        grain.copy(buffer, i * grain.length + 512 /* bitmap */)
      }
    }
    return {
      id: blockId,
      bitmap: buffer.slice(0, 512),
      data: buffer.slice(512),
      buffer,
    }
  }
}
