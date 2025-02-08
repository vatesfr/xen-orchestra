import computeGeometryForSize from 'vhd-lib/_computeGeometryForSize.js'
import type { PortableDisk } from '../PortableDisk.mts'
import { DEFAULT_BLOCK_SIZE, DISK_TYPES, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from 'vhd-lib/_constants.js'
import { createFooter, createHeader } from 'vhd-lib/_createFooterHeader.js'

export const FULL_BLOCK_BITMAP = Buffer.alloc(SECTOR_SIZE, 255)

export abstract class BaseVhd {
  #source: PortableDisk
  get source() {
    return this.#source
  }
  constructor(source: PortableDisk) {
    this.#source = source
  }
  computeVhdHeader() {
    const source = this.#source
    const size = source.virtualSize
    const nbTotalBlocks = Math.ceil(size / DEFAULT_BLOCK_SIZE)
    const header = createHeader(nbTotalBlocks)
    return header
  }

  computeVhdFooter(): Buffer {
    const source = this.#source
    const size = source.virtualSize
    const geometry = computeGeometryForSize(size)
    const diskType = source.isDifferencing() ? DISK_TYPES.DIFFERENCING : DISK_TYPES.DYNAMIC
    const footer = createFooter(size, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, diskType)
    return footer
  }

  computeVhdBatAndFileSize(): { fileSize: number; bat: Buffer } {
    const source = this.#source
    const size = source.virtualSize
    const nbTotalBlocks = Math.ceil(size / DEFAULT_BLOCK_SIZE)
    // align bat size to a sector
    const batSize = Math.ceil((nbTotalBlocks * 4) / SECTOR_SIZE) * SECTOR_SIZE
    let bat = Buffer.alloc(batSize, 255) // initialized full of 1, which is BLOCK_UNUSED
    let offset = FOOTER_SIZE + HEADER_SIZE + batSize
    let offsetSector = offset / SECTOR_SIZE
    const FULL_BLOCK_SIZE = SECTOR_SIZE + DEFAULT_BLOCK_SIZE
    const blockSizeInSectors = FULL_BLOCK_SIZE / SECTOR_SIZE
    let fileSize = offsetSector * SECTOR_SIZE + FOOTER_SIZE /* the footer at the end */
    // compute BAT , blocks starts after parent locator entries
    for (const index of source.getBlockIndexes()) {
      bat.writeUInt32BE(offsetSector, index * 4)
      offsetSector += blockSizeInSectors
      fileSize += FULL_BLOCK_SIZE
    }
    return { bat, fileSize }
  }

  async *vhdblockGenerator(): AsyncGenerator<Buffer> {
    for await (const { data } of this.#source.diskBlocks()) {
      yield Buffer.concat([FULL_BLOCK_BITMAP, data])
    }
  }
}