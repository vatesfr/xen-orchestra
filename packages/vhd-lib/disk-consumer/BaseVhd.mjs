// @ts-check
/**
 * @typedef {import('@xen-orchestra/disk-transform').Disk} Disk
 */

import { DiskLargerBlock, DiskSmallerBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform'
import computeGeometryForSize from '../_computeGeometryForSize.js'
import { DEFAULT_BLOCK_SIZE, DISK_TYPES, FOOTER_SIZE, HEADER_SIZE, SECTOR_SIZE } from '../_constants.js'
import { createFooter, createHeader } from '../_createFooterHeader.js'

export const FULL_BLOCK_BITMAP = Buffer.alloc(SECTOR_SIZE, 255)
/**
 * @abstract
 */
export class BaseVhd {
  /** @type {Disk} */
  #source

  /**
   * @returns {Disk}
   */
  get source() {
    return this.#source
  }

  /**
   * @param {Disk} source
   */
  constructor(source) {
    // vmdk export can provide various disk blocks
    if (source.getBlockSize() < DEFAULT_BLOCK_SIZE) {
      if (!(source instanceof RandomAccessDisk)) {
        throw new Error("Can't change disk block size of streamed disk ")
      }
      this.#source = new DiskLargerBlock(source, DEFAULT_BLOCK_SIZE)
    } else if (source.getBlockSize() > DEFAULT_BLOCK_SIZE) {
      if (!(source instanceof RandomAccessDisk)) {
        throw new Error("Can't change disk block size of streamed disk ")
      }
      this.#source = new DiskSmallerBlock(source, DEFAULT_BLOCK_SIZE)
    } else {
      this.#source = source
    }
  }

  /**
   * @returns {Buffer}
   */
  computeVhdHeader() {
    const source = this.source
    const size = source.getVirtualSize()
    const nbTotalBlocks = Math.ceil(size / DEFAULT_BLOCK_SIZE)
    const header = createHeader(nbTotalBlocks)
    return header
  }

  /**
   * @returns {Buffer}
   */
  computeVhdFooter() {
    const source = this.source
    const size = source.getVirtualSize()
    const geometry = computeGeometryForSize(size)
    const diskType = source.isDifferencing() ? DISK_TYPES.DIFFERENCING : DISK_TYPES.DYNAMIC
    const footer = createFooter(size, Math.floor(Date.now() / 1000), geometry, FOOTER_SIZE, diskType)
    return footer
  }

  /**
   * @returns {{ fileSize: number, bat: Buffer }}
   */
  computeVhdBatAndFileSize() {
    const source = this.source
    const size = source.getVirtualSize()
    const nbTotalBlocks = Math.ceil(size / DEFAULT_BLOCK_SIZE)
    // align bat size to a sector
    const batSize = Math.ceil((nbTotalBlocks * 4) / SECTOR_SIZE) * SECTOR_SIZE
    const bat = Buffer.alloc(batSize, 255) // initialized full of 1, which is BLOCK_UNUSED
    const dataOffset = FOOTER_SIZE + HEADER_SIZE + batSize
    let offsetSector = dataOffset / SECTOR_SIZE
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
}
