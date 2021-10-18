import { computeBatSize } from './_utils'

export class AbstractVhd {
  header
  footer
  blockTable
  fullBlockSize
  bitmapSize
  /**
   * instantiate a Vhd
   *
   * @returns {AbstractVhd}
   */
  static async open(handler, path) {
    throw new Error(`open is not implemented`)
  }

  /**
   * Check if this vhd contains a block with id blockId
   * Must be called after readBlockAllocationTable
   *
   * @param {Number} blockId
   * @returns {Boolean}
   *
   */
  containsBlock(blockId) {
    throw new Error(`checking if this vhd contains the block ${blockId} is not implemented`)
  }

  /**
   * Read the header and the footer
   * check their integrity
   * compute fullBlockSize and bitmapSize
   * if checkSecondFooter also checks that the footer at the end is equal to the one at the beginning
   *
   * @param {Boolean} checkSecondFooter
   */
  readHeaderAndFooter(checkSecondFooter = true) {
    throw new Error(
      `reading and checking footer, ${checkSecondFooter ? 'second footer,' : ''} and header is not implemented`
    )
  }

  readBlockAllocationTable() {
    throw new Error(`reading $block allocation table is not implemented`)
  }

  /**
   *
   * @param {Number} blockId
   * @param {Boolean} onlyBitmap
   * @returns {Buffer}
   */
  _readBlock(blockId, onlyBitmap = false) {
    throw new Error(`reading  ${onlyBitmap ? 'bitmap of block' : 'block'} ${blockId} is not implemented`)
  }

  /**
   * coalesce the block with id blockId from the child vhd into
   * this vhd
   *
   * @param {AbstractVhd} child
   * @param {Number} blockId
   *
   * @returns {Number} the merged data size
   */
  coalesceBlock(child, blockId) {
    throw new Error(`coalescing the block ${blockId} from ${child} is not implemented`)
  }

  /**
   * ensure the bat size can store at least entries block
   * move blocks if needed
   * @param {Number} entries
   */
  ensureBatSize(entries) {
    throw new Error(`ensuring batSize can store at least  ${entries} is not implemented`)
  }

  // Write a context footer. (At the end and beginning of a vhd file.)
  writeFooter(onlyEndFooter = false) {
    throw new Error(`writing footer   ${onlyEndFooter ? 'only at end' : 'on both side'} is not implemented`)
  }

  writeHeader() {
    throw new Error(`writing header is not implemented`)
  }

  // never called outside
  // writeData(offsetSectors, buffer) { }

  setUniqueParentLocator(fileNameString) {
    throw new Error(`setting unique parent locator from file name ${fileNameString} is not implemented`)
  }

  // common
  get batSize() {
    return computeBatSize(this.header.maxTableEntries)
  }
}
